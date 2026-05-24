import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const binderEngagementQueryKey = (binderId: string, viewerId: string | null | undefined) =>
  ['binder-engagement', binderId, viewerId ?? null] as const;

export const savedBindersQueryKey = (userId: string | null | undefined) =>
  ['binders', 'saved', userId ?? null] as const;

export type BinderEngagement = {
  likeCount: number;
  saveCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
};

async function fetchEngagement(
  binderId: string,
  viewerId: string | null,
): Promise<BinderEngagement> {
  const [likeCount, saveCount, commentCount, myLike, mySave] = await Promise.all([
    supabase
      .from('likes')
      .select('user_id', { count: 'exact', head: true })
      .eq('binder_id', binderId),
    supabase
      .from('saves')
      .select('user_id', { count: 'exact', head: true })
      .eq('binder_id', binderId),
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('binder_id', binderId),
    viewerId
      ? supabase
          .from('likes')
          .select('user_id')
          .eq('binder_id', binderId)
          .eq('user_id', viewerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    viewerId
      ? supabase
          .from('saves')
          .select('user_id')
          .eq('binder_id', binderId)
          .eq('user_id', viewerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    likeCount: likeCount.count ?? 0,
    saveCount: saveCount.count ?? 0,
    commentCount: commentCount.count ?? 0,
    isLiked: !!myLike.data,
    isSaved: !!mySave.data,
  };
}

/** Like/save status + counts for a binder, from the current viewer's perspective. */
export function useBinderEngagement(binderId: string | undefined) {
  const viewerId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: binderEngagementQueryKey(binderId ?? '', viewerId),
    queryFn: () => {
      if (!binderId) throw new Error('Missing binderId');
      return fetchEngagement(binderId, viewerId ?? null);
    },
    enabled: !!binderId,
  });
}

interface ToggleLikeInput {
  binder_id: string;
  /** Current state from the caller's perspective. The caller passes the BEFORE-toggle value
   *  so the network call doesn't depend on cache state (onMutate flips the cache before mutationFn runs). */
  currentlyLiked: boolean;
}

interface ToggleSaveInput {
  binder_id: string;
  currentlySaved: boolean;
}

/**
 * Toggle the viewer's like on a binder. Optimistically updates the
 * engagement cache; rolls back on error.
 */
export function useToggleLike() {
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, ToggleLikeInput, { previous?: BinderEngagement }>({
    mutationFn: async ({ binder_id, currentlyLiked }) => {
      if (!viewerId) throw new Error('Not authenticated');
      if (currentlyLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', viewerId)
          .eq('binder_id', binder_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ user_id: viewerId, binder_id });
        if (error) throw error;
      }
    },
    onMutate: async ({ binder_id }) => {
      const key = binderEngagementQueryKey(binder_id, viewerId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BinderEngagement>(key);
      if (previous) {
        queryClient.setQueryData<BinderEngagement>(key, {
          ...previous,
          isLiked: !previous.isLiked,
          likeCount: previous.likeCount + (previous.isLiked ? -1 : 1),
        });
      }
      return { previous };
    },
    onError: (_err, { binder_id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(binderEngagementQueryKey(binder_id, viewerId), context.previous);
      }
    },
    onSuccess: (_data, { binder_id, currentlyLiked }) => {
      trackEvent('binder_like_toggled', { binder_id, liked: !currentlyLiked });
    },
  });
}

/**
 * Toggle the viewer's save on a binder. Optimistically updates the
 * engagement cache and invalidates the Saved feed.
 */
export function useToggleSave() {
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, ToggleSaveInput, { previous?: BinderEngagement }>({
    mutationFn: async ({ binder_id, currentlySaved }) => {
      if (!viewerId) throw new Error('Not authenticated');
      if (currentlySaved) {
        const { error } = await supabase
          .from('saves')
          .delete()
          .eq('user_id', viewerId)
          .eq('binder_id', binder_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saves').insert({ user_id: viewerId, binder_id });
        if (error) throw error;
      }
    },
    onMutate: async ({ binder_id }) => {
      const key = binderEngagementQueryKey(binder_id, viewerId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BinderEngagement>(key);
      if (previous) {
        queryClient.setQueryData<BinderEngagement>(key, {
          ...previous,
          isSaved: !previous.isSaved,
          saveCount: previous.saveCount + (previous.isSaved ? -1 : 1),
        });
      }
      return { previous };
    },
    onError: (_err, { binder_id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(binderEngagementQueryKey(binder_id, viewerId), context.previous);
      }
    },
    onSuccess: (_data, { binder_id, currentlySaved }) => {
      trackEvent('binder_save_toggled', { binder_id, saved: !currentlySaved });
      queryClient.invalidateQueries({ queryKey: savedBindersQueryKey(viewerId) });
    },
  });
}
