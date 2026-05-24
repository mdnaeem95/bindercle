import { supabase } from '@/lib/supabase';
import type { Binder, Profile } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';

export const userProfileQueryKey = (userId: string) => ['profile', 'user', userId] as const;
export const publicBindersByUserQueryKey = (userId: string) =>
  ['binders', 'public-by-user', userId] as const;

export type PublicBinder = Binder & { card_count: number };

async function fetchUserProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

async function fetchPublicBindersByUser(userId: string): Promise<PublicBinder[]> {
  const { data, error } = await supabase
    .from('binders')
    .select('*, cards(count)')
    .eq('owner_id', userId)
    .eq('is_public', true)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const cardsField = row.cards as { count: number }[] | null;
    const card_count = cardsField?.[0]?.count ?? 0;
    const { cards: _cards, ...rest } = row as typeof row & { cards?: unknown };
    return { ...rest, card_count } as PublicBinder;
  });
}

/** Fetch another user's public profile by their user id. */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userProfileQueryKey(userId ?? ''),
    queryFn: () => {
      if (!userId) throw new Error('Missing userId');
      return fetchUserProfile(userId);
    },
    enabled: !!userId,
  });
}

/** Fetch the public binders owned by a specific user. */
export function usePublicBindersByUser(userId: string | undefined) {
  return useQuery({
    queryKey: publicBindersByUserQueryKey(userId ?? ''),
    queryFn: () => {
      if (!userId) throw new Error('Missing userId');
      return fetchPublicBindersByUser(userId);
    },
    enabled: !!userId,
  });
}
