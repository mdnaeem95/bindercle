import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Profile, ProfileUpdate } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileQueryKey } from './useProfile';

/**
 * Update the current user's profile with optimistic UI.
 *
 * Optimistically writes new values into the cache, calls supabase, then
 * reconciles. On failure, rolls back to the previous cache value.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<Profile, Error, ProfileUpdate, { previous?: Profile }>({
    mutationFn: async (updates) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      if (!userId) return { previous: undefined };
      await queryClient.cancelQueries({ queryKey: profileQueryKey(userId) });
      const previous = queryClient.getQueryData<Profile>(profileQueryKey(userId));
      if (previous) {
        queryClient.setQueryData<Profile>(profileQueryKey(userId), {
          ...previous,
          ...updates,
        });
      }
      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(profileQueryKey(userId), context.previous);
      }
    },
    onSuccess: (data, updates) => {
      trackEvent('profile_updated', {
        changed_fields: Object.keys(updates).join(','),
      });
      // Sync server truth back into cache
      if (userId) {
        queryClient.setQueryData(profileQueryKey(userId), data);
      }
    },
  });
}
