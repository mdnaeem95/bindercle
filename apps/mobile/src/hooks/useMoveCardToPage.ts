import { cardQueryKey, cardsForBinderQueryKey, cardsForPageQueryKey } from '@/hooks/useCards';
import { pagesForBinderQueryKey } from '@/hooks/usePages';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import type { Card } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MoveCardToPageInput {
  card_id: string;
  from_page_id: string;
  to_page_id: string;
  binder_id: string;
}

/**
 * Move a card to another page within the same binder. The card lands at
 * the end of the target page; existing ordering elsewhere is untouched.
 */
export function useMoveCardToPage() {
  const queryClient = useQueryClient();

  return useMutation<Card, Error, MoveCardToPageInput>({
    mutationFn: async ({ card_id, to_page_id }) => {
      const { count } = await supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('page_id', to_page_id);

      const { data, error } = await supabase
        .from('cards')
        .update({ page_id: to_page_id, position: count ?? 0 })
        .eq('id', card_id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_card, input) => {
      trackEvent('card_moved', {
        from_page_id: input.from_page_id,
        to_page_id: input.to_page_id,
      });
      queryClient.invalidateQueries({ queryKey: cardsForPageQueryKey(input.from_page_id) });
      queryClient.invalidateQueries({ queryKey: cardsForPageQueryKey(input.to_page_id) });
      queryClient.invalidateQueries({ queryKey: cardsForBinderQueryKey(input.binder_id) });
      queryClient.invalidateQueries({ queryKey: cardQueryKey(input.card_id) });
      queryClient.invalidateQueries({ queryKey: pagesForBinderQueryKey(input.binder_id) });
    },
  });
}
