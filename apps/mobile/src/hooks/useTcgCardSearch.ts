import { type TcgApiCard, searchTcgCards } from '@/lib/pokemonTcg';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Debounced autocomplete against the Pokemon TCG API.
 *
 * - Returns an empty result for queries shorter than 2 chars.
 * - Cached for 5 minutes per query (TCG card data is stable).
 */
export function useTcgCardSearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), 350);

  return useQuery<TcgApiCard[]>({
    queryKey: ['tcg-card-search', debounced],
    queryFn: () => searchTcgCards(debounced),
    enabled: debounced.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
