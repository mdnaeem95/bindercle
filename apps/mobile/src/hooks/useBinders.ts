import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Binder } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';

export const bindersQueryKey = (userId: string | null | undefined) =>
  ['binders', 'list', userId] as const;

export type BinderWithCount = Binder & { card_count: number };

async function fetchBinders(userId: string): Promise<BinderWithCount[]> {
  // Use the count via embedded relationship for inline aggregation
  const { data, error } = await supabase
    .from('binders')
    .select('*, cards(count)')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const cardsField = row.cards as { count: number }[] | null;
    const card_count = cardsField?.[0]?.count ?? 0;
    const { cards: _cards, ...rest } = row as typeof row & { cards?: unknown };
    return { ...rest, card_count } as BinderWithCount;
  });
}

/**
 * Fetch all binders owned by the current user, with embedded card counts.
 * Sorted by most-recently-updated first.
 */
export function useBinders() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: bindersQueryKey(userId),
    queryFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return fetchBinders(userId);
    },
    enabled: !!userId,
  });
}
