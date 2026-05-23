import { cardsForBinderQueryKey, cardsForPageQueryKey } from '@/hooks/useCards';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ReorderCardsInput {
  page_id: string;
  binder_id: string;
  /** Card IDs in the new desired order — index becomes the new position. */
  card_ids: string[];
}

/**
 * Persist a new card ordering on a page.
 *
 * Implementation: parallel single-row updates, one per card. Acceptable for
 * the typical page size (≤ 20 cards). If pages get larger, replace with a
 * Postgres RPC that updates positions in a single transaction.
 *
 * The caller is responsible for optimistic UI — this hook just persists.
 */
export function useReorderCards() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReorderCardsInput>({
    mutationFn: async ({ card_ids }) => {
      await Promise.all(
        card_ids.map((id, index) =>
          supabase.from('cards').update({ position: index }).eq('id', id),
        ),
      );
    },
    onSuccess: (_data, input) => {
      trackEvent('cards_reordered', { page_id: input.page_id, count: input.card_ids.length });
      queryClient.invalidateQueries({ queryKey: cardsForPageQueryKey(input.page_id) });
      queryClient.invalidateQueries({ queryKey: cardsForBinderQueryKey(input.binder_id) });
    },
  });
}
