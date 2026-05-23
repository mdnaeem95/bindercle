import { supabase } from '@/lib/supabase';
import type { BinderPage } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';

export const pagesForBinderQueryKey = (binderId: string) =>
  ['pages', 'by-binder', binderId] as const;
export const pageQueryKey = (pageId: string) => ['page', pageId] as const;

export type PageWithCount = BinderPage & { card_count: number };

async function fetchPagesForBinder(binderId: string): Promise<PageWithCount[]> {
  const { data, error } = await supabase
    .from('binder_pages')
    .select('*, cards(count)')
    .eq('binder_id', binderId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const cardsField = row.cards as { count: number }[] | null;
    const card_count = cardsField?.[0]?.count ?? 0;
    const { cards: _cards, ...rest } = row as typeof row & { cards?: unknown };
    return { ...rest, card_count } as PageWithCount;
  });
}

async function fetchPage(pageId: string): Promise<BinderPage> {
  const { data, error } = await supabase.from('binder_pages').select('*').eq('id', pageId).single();
  if (error) throw error;
  return data;
}

export function usePagesForBinder(binderId: string | undefined) {
  return useQuery({
    queryKey: pagesForBinderQueryKey(binderId ?? ''),
    queryFn: () => {
      if (!binderId) throw new Error('Missing binderId');
      return fetchPagesForBinder(binderId);
    },
    enabled: !!binderId,
  });
}

export function usePage(pageId: string | undefined) {
  return useQuery({
    queryKey: pageQueryKey(pageId ?? ''),
    queryFn: () => {
      if (!pageId) throw new Error('Missing pageId');
      return fetchPage(pageId);
    },
    enabled: !!pageId,
  });
}
