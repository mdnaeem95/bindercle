import { pagesForBinderQueryKey } from '@/hooks/usePages';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ReorderPagesInput {
  binder_id: string;
  /** Page IDs in the new desired order — index becomes the new position. */
  page_ids: string[];
}

/**
 * Persist a new page ordering within a binder. Mirrors useReorderCards:
 * parallel single-row updates, one per page. Fine for the typical binder
 * size; swap for an RPC if a binder ever grows past a few dozen pages.
 */
export function useReorderPages() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReorderPagesInput>({
    mutationFn: async ({ page_ids }) => {
      await Promise.all(
        page_ids.map((id, index) =>
          supabase.from('binder_pages').update({ position: index }).eq('id', id),
        ),
      );
    },
    onSuccess: (_data, input) => {
      trackEvent('pages_reordered', { binder_id: input.binder_id, count: input.page_ids.length });
      queryClient.invalidateQueries({ queryKey: pagesForBinderQueryKey(input.binder_id) });
    },
  });
}
