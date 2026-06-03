import { bindersQueryKey } from '@/hooks/useBinders';
import { cardsForBinderQueryKey, cardsForPageQueryKey } from '@/hooks/useCards';
import { pagesForBinderQueryKey } from '@/hooks/usePages';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { BINDER_LAYOUT_COLUMNS, type BinderLayout } from '@/lib/validators/binder';
import { useAuthStore } from '@/stores/auth';
import type { Card } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DuplicateCardInput {
  source_card_id: string;
}

export class PageFullError extends Error {
  constructor() {
    super('Page is full');
    this.name = 'PageFullError';
  }
}

/**
 * Clones a card's metadata + TCG link into the next empty pocket on the same
 * page. Photos are intentionally NOT copied — duplicate is for symmetry plays
 * where the official TCG art is what people want repeated. Throws
 * `PageFullError` if no empty slot exists within the binder's layout.
 */
export function useDuplicateCard() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<Card, Error, DuplicateCardInput>({
    mutationFn: async ({ source_card_id }) => {
      if (!userId) throw new Error('Not authenticated');

      const { data: source, error: cardError } = await supabase
        .from('cards')
        .select('*, binder:binders(layout_type)')
        .eq('id', source_card_id)
        .single();
      if (cardError) throw cardError;
      if (!source.page_id) throw new Error('Card is not on a page');

      const layout = (source.binder as { layout_type: BinderLayout } | null)?.layout_type;
      if (!layout) throw new Error('Could not resolve binder layout');
      const slotsPerSpread = BINDER_LAYOUT_COLUMNS[layout] ** 2;

      const { data: pageCards, error: pageCardsError } = await supabase
        .from('cards')
        .select('position')
        .eq('page_id', source.page_id);
      if (pageCardsError) throw pageCardsError;

      const taken = new Set(pageCards.map((c) => c.position));
      let nextPosition = -1;
      for (let i = 0; i < slotsPerSpread; i++) {
        if (!taken.has(i)) {
          nextPosition = i;
          break;
        }
      }
      if (nextPosition === -1) throw new PageFullError();

      const { data: card, error } = await supabase
        .from('cards')
        .insert({
          binder_id: source.binder_id,
          page_id: source.page_id,
          owner_id: userId,
          name: source.name,
          caption: source.caption,
          set_code: source.set_code,
          set_number: source.set_number,
          rarity: source.rarity,
          condition: source.condition,
          notes: source.notes,
          tcg_card_id: source.tcg_card_id,
          position: nextPosition,
        })
        .select('*')
        .single();
      if (error) throw error;
      return card;
    },
    onSuccess: (card) => {
      trackEvent('card_added', {
        page_position: card.position,
        is_first: false,
        via: 'duplicate',
      });
      queryClient.invalidateQueries({ queryKey: bindersQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: cardsForBinderQueryKey(card.binder_id) });
      queryClient.invalidateQueries({ queryKey: pagesForBinderQueryKey(card.binder_id) });
      if (card.page_id) {
        queryClient.invalidateQueries({ queryKey: cardsForPageQueryKey(card.page_id) });
      }
    },
  });
}
