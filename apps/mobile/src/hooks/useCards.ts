import { supabase } from '@/lib/supabase';
import type { Card, CardPhoto } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';

export const cardsForBinderQueryKey = (binderId: string) =>
  ['cards', 'by-binder', binderId] as const;
export const cardQueryKey = (cardId: string) => ['card', cardId] as const;

export type CardWithPhotos = Card & { photos: CardPhoto[] };

async function fetchCardsForBinder(binderId: string): Promise<CardWithPhotos[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*, photos:card_photos(*)')
    .eq('binder_id', binderId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const photos = ((row.photos as CardPhoto[] | null) ?? [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index);
    return { ...row, photos } as CardWithPhotos;
  });
}

async function fetchCard(cardId: string): Promise<CardWithPhotos> {
  const { data, error } = await supabase
    .from('cards')
    .select('*, photos:card_photos(*)')
    .eq('id', cardId)
    .single();
  if (error) throw error;

  const photos = ((data.photos as CardPhoto[] | null) ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index);
  return { ...data, photos } as CardWithPhotos;
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
