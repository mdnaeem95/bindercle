import { supabase } from '@/lib/supabase';
import type { Tag } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Search existing tags by name prefix. Returns up to 8 matches.
 * Debounced 250ms. Returns an empty result for queries shorter than 1 char.
 */
export function useTagSearch(query: string) {
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 250);

  return useQuery<Tag[]>({
    queryKey: ['tags', 'search', debounced],
    queryFn: async () => {
      if (debounced.length === 0) return [];
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${debounced}%`)
        .order('name')
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 1000,
  });
}
