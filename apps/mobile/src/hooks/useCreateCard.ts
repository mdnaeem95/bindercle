import { bindersQueryKey } from '@/hooks/useBinders';
import { cardsForBinderQueryKey, cardsForPageQueryKey } from '@/hooks/useCards';
import { pagesForBinderQueryKey } from '@/hooks/usePages';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { uploadCardPhoto } from '@/lib/uploads';
import type { CardCondition } from '@/lib/validators/card';
import { useAuthStore } from '@/stores/auth';
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
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<Card, Error, CreateCardInput>({
    mutationFn: async (input) => {
      if (!userId) throw new Error('Not authenticated');

      // Resolve the binder from the page so cards stay denormalized to binder_id.
      const { data: page, error: pageError } = await supabase
        .from('binder_pages')
        .select('id, binder_id')
        .eq('id', input.page_id)
        .single();
      if (pageError) throw pageError;

      // Compute next position within the page.
      const { count } = await supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('page_id', input.page_id);

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
          position: count ?? 0,
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
    onSuccess: (card, input) => {
      trackEvent('card_created', {
        photo_count: input.photo_uris.length,
        has_set: !!input.set_code || !!input.set_number,
        has_condition: !!input.condition,
      });
      queryClient.invalidateQueries({ queryKey: cardsForPageQueryKey(input.page_id) });
      queryClient.invalidateQueries({ queryKey: cardsForBinderQueryKey(card.binder_id) });
      queryClient.invalidateQueries({ queryKey: pagesForBinderQueryKey(card.binder_id) });
      queryClient.invalidateQueries({ queryKey: bindersQueryKey(userId) });
    },
  });
}
