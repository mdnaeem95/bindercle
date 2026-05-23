import { supabase } from '@/lib/supabase';
import type { Card, CardPhoto, PokemonTcgCard } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';

export const cardsForBinderQueryKey = (binderId: string) =>
  ['cards', 'by-binder', binderId] as const;
export const cardsForPageQueryKey = (pageId: string) => ['cards', 'by-page', pageId] as const;
export const cardQueryKey = (cardId: string) => ['card', cardId] as const;

export type CardWithExtras = Card & {
  photos: CardPhoto[];
  /** Linked TCG card with official art — present only when tcg_card_id is set. */
  tcg_card: Pick<PokemonTcgCard, 'id' | 'image_small' | 'image_large' | 'set_name'> | null;
};

const CARDS_SELECT =
  '*, photos:card_photos(*), tcg_card:pokemon_tcg_cards(id, image_small, image_large, set_name)';

function normalize(row: Record<string, unknown>): CardWithExtras {
  const photos = ((row.photos as CardPhoto[] | null) ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index);
  const tcg = row.tcg_card as CardWithExtras['tcg_card'];
  return { ...(row as unknown as Card), photos, tcg_card: tcg ?? null };
}

async function fetchCardsForBinder(binderId: string): Promise<CardWithExtras[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(CARDS_SELECT)
    .eq('binder_id', binderId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => normalize(row as Record<string, unknown>));
}

async function fetchCardsForPage(pageId: string): Promise<CardWithExtras[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(CARDS_SELECT)
    .eq('page_id', pageId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => normalize(row as Record<string, unknown>));
}

async function fetchCard(cardId: string): Promise<CardWithExtras> {
  const { data, error } = await supabase
    .from('cards')
    .select(CARDS_SELECT)
    .eq('id', cardId)
    .single();
  if (error) throw error;
  return normalize(data as Record<string, unknown>);
}

export function useCardsForBinder(binderId: string | undefined) {
  return useQuery({
    queryKey: cardsForBinderQueryKey(binderId ?? ''),
    queryFn: () => {
      if (!binderId) throw new Error('Missing binderId');
      return fetchCardsForBinder(binderId);
    },
    enabled: !!binderId,
  });
}

export function useCardsForPage(pageId: string | undefined) {
  return useQuery({
    queryKey: cardsForPageQueryKey(pageId ?? ''),
    queryFn: () => {
      if (!pageId) throw new Error('Missing pageId');
      return fetchCardsForPage(pageId);
    },
    enabled: !!pageId,
  });
}

export function useCard(cardId: string | undefined) {
  return useQuery({
    queryKey: cardQueryKey(cardId ?? ''),
    queryFn: () => {
      if (!cardId) throw new Error('Missing cardId');
      return fetchCard(cardId);
    },
    enabled: !!cardId,
  });
}
