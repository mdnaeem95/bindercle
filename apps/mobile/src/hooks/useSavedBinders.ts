import { savedBindersQueryKey } from '@/hooks/useBinderEngagement';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Binder, Profile } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';

export type SavedBinder = Binder & {
  card_count: number;
  owner: Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'>;
};

async function fetchSavedBinders(userId: string): Promise<SavedBinder[]> {
  const { data, error } = await supabase
    .from('saves')
    .select(
      'created_at, binder:binders!saves_binder_id_fkey(*, cards(count), owner:profiles!binders_owner_id_fkey(id, handle, display_name, avatar_url))',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  type Row = {
    created_at: string;
    binder:
      | (Binder & {
          cards?: { count: number }[] | null;
          owner: Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'>;
        })
      | null;
  };

  return ((data ?? []) as unknown as Row[])
    .map((row) => {
      const b = row.binder;
      if (!b) return null;
      const card_count = b.cards?.[0]?.count ?? 0;
      const { cards: _cards, ...rest } = b as typeof b & { cards?: unknown };
      return { ...rest, card_count } as SavedBinder;
    })
    .filter((b): b is SavedBinder => b !== null);
}

/** The current viewer's saved binders, newest save first. */
export function useSavedBinders() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: savedBindersQueryKey(userId),
    queryFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return fetchSavedBinders(userId);
    },
    enabled: !!userId,
  });
}
