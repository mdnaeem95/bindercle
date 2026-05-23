import { supabase } from '@/lib/supabase';
import { slugifyTag } from '@/lib/validators/binder';
import type { Tag } from '@foilio/api-client';

/**
 * Ensure each label exists as a row in `tags` and return the resolved rows.
 *
 * Uses `upsert(ignoreDuplicates)` so existing slugs aren't overwritten —
 * the first user to create a tag sets its display name.
 */
export async function ensureTags(labels: string[]): Promise<Tag[]> {
  const entries = labels
    .map((label) => ({ slug: slugifyTag(label), name: label.trim() }))
    .filter((entry) => entry.slug.length >= 1 && entry.name.length >= 1);

  if (entries.length === 0) return [];

  const { error: upsertError } = await supabase
    .from('tags')
    .upsert(entries, { onConflict: 'slug', ignoreDuplicates: true });
  if (upsertError) throw upsertError;

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .in(
      'slug',
      entries.map((e) => e.slug),
    );
  if (error) throw error;
  return data ?? [];
}

/**
 * Replace a binder's attached tags with the given labels.
 *
 * Diff-free implementation: delete all current attachments, insert new ones.
 * RLS policies ensure only the binder owner can do this.
 */
export async function setBinderTags(binderId: string, labels: string[]): Promise<Tag[]> {
  const tags = await ensureTags(labels);

  const { error: deleteError } = await supabase
    .from('binder_tags')
    .delete()
    .eq('binder_id', binderId);
  if (deleteError) throw deleteError;

  if (tags.length === 0) return [];

  const { error: insertError } = await supabase
    .from('binder_tags')
    .insert(tags.map((tag) => ({ binder_id: binderId, tag_id: tag.id })));
  if (insertError) throw insertError;

  return tags;
}
