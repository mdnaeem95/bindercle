import { pagesForBinderQueryKey } from '@/hooks/usePages';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { BinderPage } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreatePageInput {
  binder_id: string;
  name?: string | null;
  layout_type?: string;
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<BinderPage, Error, CreatePageInput>({
    mutationFn: async (input) => {
      if (!userId) throw new Error('Not authenticated');

      // Compute next position so the new page lands at the end of the binder.
      const { count } = await supabase
        .from('binder_pages')
        .select('id', { count: 'exact', head: true })
        .eq('binder_id', input.binder_id);

      // If layout_type isn't provided, default to the binder's layout_type
      // (the "default vibe for new pages" semantic we kept on binders).
      let layout = input.layout_type;
      if (!layout) {
        const { data: binder } = await supabase
          .from('binders')
          .select('layout_type')
          .eq('id', input.binder_id)
          .single();
        layout = binder?.layout_type ?? 'grid';
      }

      const { data, error } = await supabase
        .from('binder_pages')
        .insert({
          binder_id: input.binder_id,
          owner_id: userId,
          name: input.name ?? null,
          layout_type: layout,
          position: count ?? 0,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_page, input) => {
      trackEvent('page_created', { binder_id: input.binder_id });
      queryClient.invalidateQueries({ queryKey: pagesForBinderQueryKey(input.binder_id) });
    },
  });
}
