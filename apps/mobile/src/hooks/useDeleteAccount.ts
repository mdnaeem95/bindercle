import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';

/**
 * Permanently delete the signed-in user's account.
 *
 * Calls the `delete-account` edge function, which verifies the caller's
 * JWT then uses the service-role key to remove the auth.users row.
 * Everything FKs to that row with ON DELETE CASCADE, so the rest of the
 * user's data (profiles, binders, pages, cards, comments, likes, saves,
 * follows, notifications, blocks, reports) is removed in the same
 * statement.
 */
export function useDeleteAccount() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      trackEvent('account_deleted');
    },
  });
}
