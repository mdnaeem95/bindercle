import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const userSocialStatsQueryKey = (userId: string, viewerId: string | null | undefined) =>
  ['user-social-stats', userId, viewerId ?? null] as const;

export type UserSocialStats = {
  followerCount: number;
  followingCount: number;
  /** Whether the viewer follows this user. False when viewer is anonymous or self. */
  isFollowing: boolean;
};

async function fetchStats(userId: string, viewerId: string | null): Promise<UserSocialStats> {
  const [followers, following, viewerFollows] = await Promise.all([
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('followed_id', userId),
    supabase
      .from('follows')
      .select('followed_id', { count: 'exact', head: true })
      .eq('follower_id', userId),
    viewerId && viewerId !== userId
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', viewerId)
          .eq('followed_id', userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    followerCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
    isFollowing: !!viewerFollows.data,
  };
}

/** Follower / following counts for a user, plus whether the viewer follows them. */
export function useUserSocialStats(userId: string | undefined) {
  const viewerId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userSocialStatsQueryKey(userId ?? '', viewerId),
    queryFn: () => {
      if (!userId) throw new Error('Missing userId');
      return fetchStats(userId, viewerId ?? null);
    },
    enabled: !!userId,
  });
}

interface ToggleFollowInput {
  user_id: string;
  /** Current state from the caller's perspective — see ToggleLikeInput for why. */
  currentlyFollowing: boolean;
}

/** Toggle the viewer's follow on another user. Optimistic, with rollback. */
export function useToggleFollow() {
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, ToggleFollowInput, { previous?: UserSocialStats }>({
    mutationFn: async ({ user_id, currentlyFollowing }) => {
      if (!viewerId) throw new Error('Not authenticated');
      if (viewerId === user_id) throw new Error("Can't follow yourself");
      if (currentlyFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', viewerId)
          .eq('followed_id', user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: viewerId, followed_id: user_id });
        if (error) throw error;
      }
    },
    onMutate: async ({ user_id }) => {
      const key = userSocialStatsQueryKey(user_id, viewerId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<UserSocialStats>(key);
      if (previous) {
        queryClient.setQueryData<UserSocialStats>(key, {
          ...previous,
          isFollowing: !previous.isFollowing,
          followerCount: previous.followerCount + (previous.isFollowing ? -1 : 1),
        });
      }
      return { previous };
    },
    onError: (_err, { user_id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userSocialStatsQueryKey(user_id, viewerId), context.previous);
      }
    },
    onSuccess: (_data, { user_id, currentlyFollowing }) => {
      trackEvent('user_follow_toggled', { user_id, following: !currentlyFollowing });
      // Refresh the viewer's own following count too.
      if (viewerId) {
        queryClient.invalidateQueries({
          queryKey: userSocialStatsQueryKey(viewerId, viewerId),
        });
      }
    },
  });
}
