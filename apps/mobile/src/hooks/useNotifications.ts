import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Binder, Profile } from '@foilio/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const notificationsQueryKey = (userId: string | null | undefined) =>
  ['notifications', userId ?? null] as const;
export const unreadNotificationCountQueryKey = (userId: string | null | undefined) =>
  ['notifications', 'unread-count', userId ?? null] as const;

export type NotificationType = 'like' | 'save' | 'follow' | 'comment';

export type NotificationWithRefs = {
  id: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
  binder_id: string | null;
  comment_id: string | null;
  actor: Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'>;
  binder: Pick<Binder, 'id' | 'title' | 'cover_image_url' | 'accent_color'> | null;
};

async function fetchNotifications(userId: string): Promise<NotificationWithRefs[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      `id, type, read_at, created_at, binder_id, comment_id,
       actor:profiles!notifications_actor_id_fkey(id, handle, display_name, avatar_url),
       binder:binders!notifications_binder_id_fkey(id, title, cover_image_url, accent_color)`,
    )
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as NotificationWithRefs[];
}

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

/** The signed-in viewer's notifications, newest first. */
export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: notificationsQueryKey(userId),
    queryFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return fetchNotifications(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Unread count for the bell badge. Polled every 60s while focused so the
 * badge stays roughly current without realtime infrastructure.
 */
export function useUnreadNotificationCount() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: unreadNotificationCountQueryKey(userId),
    queryFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return fetchUnreadCount(userId);
    },
    enabled: !!userId,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/** Mark every notification belonging to the viewer as read. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', userId)
        .is('read_at', null);
      if (error) throw error;
    },
    onMutate: async () => {
      const listKey = notificationsQueryKey(userId);
      const countKey = unreadNotificationCountQueryKey(userId);
      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: countKey });
      const nowIso = new Date().toISOString();
      const previousList = queryClient.getQueryData<NotificationWithRefs[]>(listKey);
      if (previousList) {
        queryClient.setQueryData<NotificationWithRefs[]>(
          listKey,
          previousList.map((n) => (n.read_at ? n : { ...n, read_at: nowIso })),
        );
      }
      queryClient.setQueryData<number>(countKey, 0);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: unreadNotificationCountQueryKey(userId) });
    },
  });
}
