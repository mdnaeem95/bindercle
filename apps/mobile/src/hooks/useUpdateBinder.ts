import { binderQueryKey } from '@/hooks/useBinder';
import { bindersQueryKey } from '@/hooks/useBinders';
import { discoverBindersQueryKey } from '@/hooks/useDiscoverBinders';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { setBinderTags } from '@/lib/tags';
import { useAuthStore } from '@/stores/auth';
import type { Binder, BinderUpdate } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateBinderInput {
  id: string;
  updates: BinderUpdate;
  /** If provided, replaces the binder's tag attachments. Pass `undefined` to leave tags untouched. */
  tags?: string[];
}

export function useUpdateBinder() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<Binder, Error, UpdateBinderInput>({
    mutationFn: async ({ id, updates, tags }) => {
      const { data, error } = await supabase
        .from('binders')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;

      if (tags !== undefined) {
        await setBinderTags(id, tags);
      }

      return data;
    },
    onSuccess: (binder, input) => {
      trackEvent('binder_updated', {
        binder_id: binder.id,
        changed_fields: Object.keys(input.updates).join(','),
        tags_changed: input.tags !== undefined,
      });
      queryClient.invalidateQueries({ queryKey: bindersQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: binderQueryKey(binder.id) });
      // Public/private + cover changes affect the Discover feed too.
      queryClient.invalidateQueries({ queryKey: discoverBindersQueryKey });
    },
  });
}
