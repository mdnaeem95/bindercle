import { supabase } from '@/lib/supabase';
import type { Binder, Tag } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';

export const binderQueryKey = (binderId: string) => ['binder', binderId] as const;

export type BinderWithTags = Binder & { tags: Tag[] };

async function fetchBinder(binderId: string): Promise<BinderWithTags> {
  const { data, error } = await supabase
    .from('binders')
    .select('*, binder_tags(tag:tags(*))')
    .eq('id', binderId)
    .single();

  if (error) throw error;

  const tags = ((data.binder_tags as { tag: Tag | null }[] | null) ?? [])
    .map((row) => row.tag)
    .filter((t): t is Tag => t !== null);

  const { binder_tags: _bt, ...rest } = data as typeof data & { binder_tags?: unknown };
  return { ...rest, tags } as BinderWithTags;
}

/**
 * Fetch a single binder by id with its attached tags.
 */
export function useBinder(binderId: string | undefined) {
  return useQuery({
    queryKey: binderQueryKey(binderId ?? ''),
    queryFn: () => {
      if (!binderId) throw new Error('Missing binderId');
      return fetchBinder(binderId);
    },
    enabled: !!binderId,
  });
}
