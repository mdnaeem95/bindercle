import { supabase } from '@/lib/supabase';
import type { Binder, Profile } from '@foilio/api-client';
import { useInfiniteQuery } from '@tanstack/react-query';

export const discoverBindersQueryKey = ['discover', 'binders'] as const;

export type DiscoverBinder = Binder & {
  card_count: number;
  /** Author profile, joined via owner_id → profiles.id. */
  owner: Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'>;
};

const PAGE_SIZE = 20;

async function fetchDiscoverPage(
  offset: number,
): Promise<{ binders: DiscoverBinder[]; offset: number; limit: number; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('binders')
    .select(
      '*, cards(count), owner:profiles!binders_owner_id_fkey(id, handle, display_name, avatar_url)',
    )
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (error) throw error;

  const binders: DiscoverBinder[] = (data ?? []).map((row) => {
    const cardsField = row.cards as { count: number }[] | null;
    const card_count = cardsField?.[0]?.count ?? 0;
    const { cards: _cards, ...rest } = row as typeof row & { cards?: unknown };
    return { ...rest, card_count } as DiscoverBinder;
  });

  return {
    binders,
    offset,
    limit: PAGE_SIZE,
    hasMore: binders.length === PAGE_SIZE,
  };
}

/**
 * Infinite-scroll feed of every user's public binders, most-recently-updated
 * first. Owner profile is embedded for inline attribution.
 */
export function useDiscoverBinders() {
  const queryResult = useInfiniteQuery({
    queryKey: discoverBindersQueryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchDiscoverPage(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined,
    staleTime: 60 * 1000,
  });

  const binders = queryResult.data?.pages.flatMap((p) => p.binders) ?? [];

  return {
    binders,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    hasNextPage: queryResult.hasNextPage,
    fetchNextPage: queryResult.fetchNextPage,
    refetch: queryResult.refetch,
    error: queryResult.error,
  };
}
