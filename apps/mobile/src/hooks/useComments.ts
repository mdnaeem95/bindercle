import { binderEngagementQueryKey } from '@/hooks/useBinderEngagement';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Comment, Profile } from '@foilio/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const commentsQueryKey = (binderId: string) => ['comments', binderId] as const;

export type CommentWithAuthor = Comment & {
  author: Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'>;
};

async function fetchComments(binderId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(
      'id, binder_id, user_id, body, parent_id, created_at, updated_at, author:profiles!comments_user_id_fkey(id, handle, display_name, avatar_url)',
    )
    .eq('binder_id', binderId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CommentWithAuthor[];
}

/** Comments on a binder, oldest first (conversation order). */
export function useComments(binderId: string | undefined) {
  return useQuery({
    queryKey: commentsQueryKey(binderId ?? ''),
    queryFn: () => {
      if (!binderId) throw new Error('Missing binderId');
      return fetchComments(binderId);
    },
    enabled: !!binderId,
  });
}

interface AddCommentInput {
  binder_id: string;
  body: string;
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.id);

  return useMutation<Comment, Error, AddCommentInput>({
    mutationFn: async ({ binder_id, body }) => {
      if (!viewerId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('comments')
        .insert({ binder_id, user_id: viewerId, body: body.trim() })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, input) => {
      trackEvent('comment_added', { binder_id: input.binder_id });
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(input.binder_id) });
      queryClient.invalidateQueries({
        queryKey: binderEngagementQueryKey(input.binder_id, viewerId),
      });
    },
  });
}

interface DeleteCommentInput {
  id: string;
  binder_id: string;
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, DeleteCommentInput>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      trackEvent('comment_deleted', { binder_id: input.binder_id });
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(input.binder_id) });
      queryClient.invalidateQueries({
        queryKey: binderEngagementQueryKey(input.binder_id, viewerId),
      });
    },
  });
}
