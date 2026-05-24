import { discoverBindersQueryKey } from '@/hooks/useDiscoverBinders';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Profile } from '@foilio/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const blockedUsersQueryKey = (viewerId: string | null | undefined) =>
  ['blocked-users', viewerId ?? null] as const;
export const isBlockedQueryKey = (viewerId: string | null | undefined, targetId: string) =>
  ['user-block', viewerId ?? null, targetId] as const;

export type BlockedUser = Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'> & {
  created_at: string;
};

/** Every account the signed-in user has blocked, with the actor profile inlined. */
export function useBlockedUsers() {
  const viewerId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: blockedUsersQueryKey(viewerId),
    queryFn: async (): Promise<BlockedUser[]> => {
      if (!viewerId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_blocks')
        .select(
          'created_at, blocked:profiles!user_blocks_blocked_id_fkey(id, handle, display_name, avatar_url)',
        )
        .eq('blocker_id', viewerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      type Row = {
        created_at: string;
        blocked: Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'> | null;
      };
      return ((data ?? []) as unknown as Row[])
        .filter((r): r is Row & { blocked: NonNullable<Row['blocked']> } => r.blocked !== null)
        .map((r) => ({ ...r.blocked, created_at: r.created_at }));
    },
    enabled: !!viewerId,
  });
}

/**
 * Set of user ids the signed-in viewer has blocked. Consumers use this to
 * filter out blocked authors from feeds, comments, notifications, etc. The
 * Set is memoized so referential equality holds across renders.
 */
export function useBlockedUserIdSet(): Set<string> {
  const { data } = useBlockedUsers();
  // Build a stable Set instance each time the data changes. Cheap for typical
  // block counts (< ~hundreds).
  if (!data || data.length === 0) return EMPTY_SET;
  return new Set(data.map((u) => u.id));
}

const EMPTY_SET = new Set<string>();

/** Is the signed-in user blocking `targetId`? Used to gate the Block/Unblock button. */
export function useIsBlocked(targetId: string | undefined) {
  const viewerId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: isBlockedQueryKey(viewerId, targetId ?? ''),
    queryFn: async (): Promise<boolean> => {
      if (!viewerId || !targetId) return false;
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocker_id')
        .eq('blocker_id', viewerId)
        .eq('blocked_id', targetId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!viewerId && !!targetId,
  });
}

interface ToggleBlockInput {
  target_user_id: string;
  currentlyBlocked: boolean;
}

export function useToggleBlock() {
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, ToggleBlockInput>({
    mutationFn: async ({ target_user_id, currentlyBlocked }) => {
      if (!viewerId) throw new Error('Not authenticated');
      if (viewerId === target_user_id) throw new Error("Can't block yourself");
      if (currentlyBlocked) {
        const { error } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', viewerId)
          .eq('blocked_id', target_user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_blocks')
          .insert({ blocker_id: viewerId, blocked_id: target_user_id });
        if (error) throw error;
      }
    },
    onSuccess: (_data, input) => {
      trackEvent('user_block_toggled', {
        target_user_id: input.target_user_id,
        blocked: !input.currentlyBlocked,
      });
      queryClient.invalidateQueries({ queryKey: blockedUsersQueryKey(viewerId) });
      queryClient.invalidateQueries({
        queryKey: isBlockedQueryKey(viewerId, input.target_user_id),
      });
      // Refresh feeds — they filter out blocked authors.
      queryClient.invalidateQueries({ queryKey: discoverBindersQueryKey });
    },
  });
}
