import { cardQueryKey, cardsForBinderQueryKey } from '@/hooks/useCards';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import type { Card, CardUpdate } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateCardInput {
  id: string;
  /** binder_id is needed for cache invalidation; pass it from the screen. */
  binder_id: string;
  updates: CardUpdate;
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation<Card, Error, UpdateCardInput>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (card, input) => {
      trackEvent('card_updated', {
        card_id: card.id,
        changed_fields: Object.keys(input.updates).join(','),
      });
      queryClient.invalidateQueries({ queryKey: cardsForBinderQueryKey(input.binder_id) });
      queryClient.invalidateQueries({ queryKey: cardQueryKey(card.id) });
    },
  });
}
