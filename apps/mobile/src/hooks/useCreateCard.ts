import { bindersQueryKey } from '@/hooks/useBinders';
import { cardsForBinderQueryKey, cardsForPageQueryKey } from '@/hooks/useCards';
import { pagesForBinderQueryKey } from '@/hooks/usePages';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { uploadCardPhoto } from '@/lib/uploads';
import type { CardCondition } from '@/lib/validators/card';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/stores/toast';
import type { Card } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateCardInput {
  /** Target page within a binder. binder_id is derived. */
  page_id: string;
  name: string;
  caption?: string | null;
  set_code?: string | null;
  set_number?: string | null;
  rarity?: string | null;
  condition?: CardCondition | null;
  notes?: string | null;
  tcg_card_id?: string | null;
  photo_uris: string[];
  /**
   * Explicit slot to drop the card into. If omitted, the card is appended after
   * the highest existing position on the page.
   */
  position?: number;
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<Card, Error, CreateCardInput, { isFirst: boolean }>({
    onMutate: async () => {
      if (!userId) return { isFirst: false };
      const { data: anyExisting } = await supabase
        .from('cards')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle();
      return { isFirst: !anyExisting };
    },
    mutationFn: async (input) => {
      if (!userId) throw new Error('Not authenticated');

      // Resolve the binder from the page so cards stay denormalized to binder_id.
      const { data: page, error: pageError } = await supabase
        .from('binder_pages')
        .select('id, binder_id')
        .eq('id', input.page_id)
        .single();
      if (pageError) throw pageError;

      // Use the caller-provided slot when given (tap-empty-pocket flow);
      // otherwise append after the highest existing slot so gaps from
      // drag-rearrange aren't auto-filled by new cards.
      let nextPosition: number;
      if (input.position !== undefined) {
        nextPosition = input.position;
      } else {
        const { data: lastCard } = await supabase
          .from('cards')
          .select('position')
          .eq('page_id', input.page_id)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle();
        nextPosition = lastCard ? lastCard.position + 1 : 0;
      }

      const { data: card, error } = await supabase
        .from('cards')
        .insert({
          binder_id: page.binder_id,
          page_id: page.id,
          owner_id: userId,
          name: input.name,
          caption: input.caption ?? null,
          set_code: input.set_code ?? null,
          set_number: input.set_number ?? null,
          rarity: input.rarity ?? null,
          condition: input.condition ?? null,
          notes: input.notes ?? null,
          tcg_card_id: input.tcg_card_id ?? null,
          position: nextPosition,
        })
        .select('*')
        .single();
      if (error) throw error;

      // Upload photos sequentially, batch-insert photo rows.
      if (input.photo_uris.length > 0) {
        const photoRecords: { card_id: string; url: string; order_index: number }[] = [];
        for (let i = 0; i < input.photo_uris.length; i++) {
          const uri = input.photo_uris[i];
          if (!uri) continue;
          const url = await uploadCardPhoto(userId, card.id, i, uri);
          photoRecords.push({ card_id: card.id, url, order_index: i });
        }
        if (photoRecords.length > 0) {
          const { error: photoError } = await supabase.from('card_photos').insert(photoRecords);
          if (photoError) throw photoError;
        }
      }

      return card;
    },
    onSuccess: (card, input, context) => {
      // Mirror render precedence (photos win over catalog art) so the event
      // reflects what the user will actually see in the grid.
      const imageSource: 'photo' | 'catalog' | 'none' =
        input.photo_uris.length > 0 ? 'photo' : input.tcg_card_id ? 'catalog' : 'none';
      trackEvent('card_added', {
        binder_id: card.binder_id,
        page_id: input.page_id,
        page_position: card.position,
        is_first: context?.isFirst ?? false,
        via: 'empty_slot',
        image_source: imageSource,
      });
      // First-card payoff (onboarding-copy §4): affirm the moment the very
      // first card lands. Only on the user's first-ever card.
      if (context?.isFirst) {
        useToast.getState().show("first card's in. this is the part that gets good.");
      }
      queryClient.invalidateQueries({ queryKey: cardsForPageQueryKey(input.page_id) });
      queryClient.invalidateQueries({ queryKey: cardsForBinderQueryKey(card.binder_id) });
      queryClient.invalidateQueries({ queryKey: pagesForBinderQueryKey(card.binder_id) });
      queryClient.invalidateQueries({ queryKey: bindersQueryKey(userId) });
    },
  });
}
