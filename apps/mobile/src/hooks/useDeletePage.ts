import { type PageWithCount, pagesForBinderQueryKey } from '@/hooks/usePages';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeletePageInput {
  id: string;
  binder_id: string;
}

/**
 * Delete a page (and its cards via ON DELETE CASCADE).
 *
 * Optimistically removes the page from the binder's page list with
 * rollback-on-error.
 */
export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeletePageInput, { previous?: PageWithCount[] }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('binder_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, binder_id }) => {
      await queryClient.cancelQueries({ queryKey: pagesForBinderQueryKey(binder_id) });
      const previous = queryClient.getQueryData<PageWithCount[]>(pagesForBinderQueryKey(binder_id));
      if (previous) {
        queryClient.setQueryData(
          pagesForBinderQueryKey(binder_id),
          previous.filter((p) => p.id !== id),
        );
      }
      return { previous };
    },
    onError: (_err, { binder_id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(pagesForBinderQueryKey(binder_id), context.previous);
      }
    },
    onSuccess: (_data, input) => {
      trackEvent('page_deleted', { page_id: input.id });
    },
  });
}
