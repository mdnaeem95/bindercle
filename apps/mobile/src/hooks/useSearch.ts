import { supabase } from '@/lib/supabase';
import type { Binder, Profile } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const PAGE_SIZE = 12;

export type SearchBinder = Binder & {
  card_count: number;
  owner: Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'>;
};

export type SearchUser = Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url' | 'bio'>;

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

async function fetchBindersByQuery(q: string): Promise<SearchBinder[]> {
  // Escape SQL-LIKE wildcards so a user typing `%` doesn't blow up the match.
  const safe = q.replace(/[%_]/g, '\\$&');
  const { data, error } = await supabase
    .from('binders')
    .select(
      '*, cards(count), owner:profiles!binders_owner_id_fkey(id, handle, display_name, avatar_url)',
    )
    .eq('is_public', true)
    .or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    .order('updated_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const cardsField = row.cards as { count: number }[] | null;
    const card_count = cardsField?.[0]?.count ?? 0;
    const { cards: _cards, ...rest } = row as typeof row & { cards?: unknown };
    return { ...rest, card_count } as SearchBinder;
  });
}

async function fetchUsersByQuery(q: string): Promise<SearchUser[]> {
  const safe = q.replace(/[%_]/g, '\\$&');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url, bio')
    .or(`handle.ilike.%${safe}%,display_name.ilike.%${safe}%`)
    .limit(PAGE_SIZE);
  if (error) throw error;
  return data ?? [];
}

/** Debounced search across public binders (title + description). */
export function useSearchBinders(query: string) {
  const debounced = useDebouncedValue(query.trim(), 300);
  return useQuery({
    queryKey: ['search', 'binders', debounced],
    queryFn: () => fetchBindersByQuery(debounced),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });
}

/** Debounced search across user profiles (handle + display_name). */
export function useSearchUsers(query: string) {
  const debounced = useDebouncedValue(query.trim(), 300);
  return useQuery({
    queryKey: ['search', 'users', debounced],
    queryFn: () => fetchUsersByQuery(debounced),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });
}
