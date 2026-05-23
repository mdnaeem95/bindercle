import { type TcgGame, searchTcgCards } from '@/lib/pokemonTcg';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const PAGE_SIZE = 24;

/**
 * Debounced infinite-scroll search against the TCG Price Lookup API
 * (via our Edge Function proxy).
 *
 * - Debounced 350ms.
 * - Cached 5 min per (query, game) pair.
 * - Returns flat `cards` array for the UI to render, plus
 *   `fetchNextPage` / `hasNextPage` / `isFetchingNextPage` for load-more.
 */
export function useTcgCardSearch(query: string, game: TcgGame = 'pokemon') {
  const debounced = useDebouncedValue(query.trim(), 350);

  const queryResult = useInfiniteQuery({
    queryKey: ['tcg-search', debounced, game],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      searchTcgCards(debounced, { offset: pageParam, limit: PAGE_SIZE, game }),
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
    enabled: debounced.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const cards = queryResult.data?.pages.flatMap((page) => page.cards) ?? [];
  const total = queryResult.data?.pages[0]?.total ?? 0;

  return {
    cards,
    total,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    hasNextPage: queryResult.hasNextPage,
    fetchNextPage: queryResult.fetchNextPage,
    error: queryResult.error,
  };
}
