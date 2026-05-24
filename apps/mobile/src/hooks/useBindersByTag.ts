import { supabase } from '@/lib/supabase';
import type { Binder, Profile, Tag } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';

export const bindersByTagQueryKey = (slug: string) => ['binders', 'by-tag', slug] as const;
export const tagBySlugQueryKey = (slug: string) => ['tag', slug] as const;

export type TaggedBinder = Binder & {
  card_count: number;
  owner: Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'>;
};

async function fetchTagBySlug(slug: string): Promise<Tag | null> {
  const { data, error } = await supabase.from('tags').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchBindersByTag(slug: string): Promise<TaggedBinder[]> {
  // Use the inner-joined binder_tags + tags relations to filter, then return
  // the binder rows. The `!inner` modifier turns the embed into a real INNER
  // JOIN so we can filter on its child columns.
  const { data, error } = await supabase
    .from('binders')
    .select(
      `*, cards(count),
       owner:profiles!binders_owner_id_fkey(id, handle, display_name, avatar_url),
       binder_tags!inner(tag_id, tags!inner(slug))`,
    )
    .eq('is_public', true)
    .eq('binder_tags.tags.slug', slug)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const cardsField = row.cards as { count: number }[] | null;
    const card_count = cardsField?.[0]?.count ?? 0;
    const {
      cards: _cards,
      binder_tags: _bt,
      ...rest
    } = row as typeof row & {
      cards?: unknown;
      binder_tags?: unknown;
    };
    return { ...rest, card_count } as TaggedBinder;
  });
}

export function useTagBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: tagBySlugQueryKey(slug ?? ''),
    queryFn: () => {
      if (!slug) throw new Error('Missing slug');
      return fetchTagBySlug(slug);
    },
    enabled: !!slug,
  });
}

export function useBindersByTag(slug: string | undefined) {
  return useQuery({
    queryKey: bindersByTagQueryKey(slug ?? ''),
    queryFn: () => {
      if (!slug) throw new Error('Missing slug');
      return fetchBindersByTag(slug);
    },
    enabled: !!slug,
  });
}
