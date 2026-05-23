import { bindersQueryKey } from '@/hooks/useBinders';
import { cardsForBinderQueryKey } from '@/hooks/useCards';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { uploadCardPhoto } from '@/lib/uploads';
import type { CardCondition } from '@/lib/validators/card';
import { useAuthStore } from '@/stores/auth';
import type { Card } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateCardInput {
  binder_id: string;
  name: string;
  caption?: string | null;
  set_code?: string | null;
  set_number?: string | null;
  rarity?: string | null;
  condition?: CardCondition | null;
  notes?: string | null;
  /** Pokemon TCG API card ID — links to the mirror table when set. */
  tcg_card_id?: string | null;
  /** Local URIs to upload as photos after the card row is inserted. */
  photo_uris: string[];
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<Card, Error, CreateCardInput>({
    mutationFn: async (input) => {
      if (!userId) throw new Error('Not authenticated');

      // Compute the next position so new cards land at the end of the binder.
      const { count } = await supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('binder_id', input.binder_id);

      const { data: card, error } = await supabase
        .from('cards')
        .insert({
          binder_id: input.binder_id,
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

      // Upload photos sequentially, then insert card_photos rows in one batch
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
    onSuccess: (_card, input) => {
      trackEvent('card_created', {
        photo_count: input.photo_uris.length,
        has_set: !!input.set_code || !!input.set_number,
        has_condition: !!input.condition,
      });
      queryClient.invalidateQueries({ queryKey: cardsForBinderQueryKey(input.binder_id) });
      queryClient.invalidateQueries({ queryKey: bindersQueryKey(userId) });
    },
  });
}
