import { pageQueryKey, pagesForBinderQueryKey } from '@/hooks/usePages';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import type { BinderPage, BinderPageUpdate } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdatePageInput {
  id: string;
  binder_id: string;
  updates: BinderPageUpdate;
}

export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation<BinderPage, Error, UpdatePageInput>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('binder_pages')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_page, input) => {
      trackEvent('page_updated', { changed_fields: Object.keys(input.updates).join(',') });
      queryClient.invalidateQueries({ queryKey: pageQueryKey(input.id) });
      queryClient.invalidateQueries({ queryKey: pagesForBinderQueryKey(input.binder_id) });
    },
  });
}
