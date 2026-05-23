import { type BinderWithCount, bindersQueryKey } from '@/hooks/useBinders';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteBinder() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, { id: string }, { previous?: BinderWithCount[] }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('binders').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: bindersQueryKey(userId) });
      const previous = queryClient.getQueryData<BinderWithCount[]>(bindersQueryKey(userId));
      if (previous) {
        queryClient.setQueryData(
          bindersQueryKey(userId),
          previous.filter((b) => b.id !== id),
        );
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(bindersQueryKey(userId), context.previous);
      }
    },
    onSuccess: (_data, input) => {
      trackEvent('binder_deleted', { binder_id: input.id });
    },
  });
}
