import { cardsForBinderQueryKey, cardsForPageQueryKey } from '@/hooks/useCards';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ReorderCardsInput {
  page_id: string;
  binder_id: string;
  /**
   * The cards whose positions changed, each with its new slot position.
   * Caller is responsible for only including cards that actually moved —
   * the typical drag yields one entry (empty target) or two (swap).
   */
  updates: { card_id: string; position: number }[];
}

/**
 * Persist new card positions on a page. Positions are sparse — slot 4 with
 * no entry is a legit empty pocket.
 *
 * Implementation: parallel single-row updates. Acceptable for the typical
 * page change (1–2 cards per drag).
 */
export function useReorderCards() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReorderCardsInput>({
    mutationFn: async ({ updates }) => {
      if (updates.length === 0) return;
      await Promise.all(
        updates.map(({ card_id, position }) =>
          supabase.from('cards').update({ position }).eq('id', card_id),
        ),
      );
    },
    onSuccess: (_data, input) => {
      trackEvent('cards_reordered', { page_id: input.page_id, count: input.updates.length });
      queryClient.invalidateQueries({ queryKey: cardsForPageQueryKey(input.page_id) });
      queryClient.invalidateQueries({ queryKey: cardsForBinderQueryKey(input.binder_id) });
    },
  });
}
