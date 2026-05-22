import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Profile } from '@foilio/api-client';
import { useQuery } from '@tanstack/react-query';

export const profileQueryKey = (userId: string | null | undefined) => ['profile', userId] as const;

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error) throw error;
  return data;
}

/**
 * Fetch the currently signed-in user's profile.
 *
 * Disabled when there's no authenticated user.
 */
export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return fetchProfile(userId);
    },
    enabled: !!userId,
  });
}
