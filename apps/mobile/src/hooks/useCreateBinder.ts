import { binderQueryKey } from '@/hooks/useBinder';
import { bindersQueryKey } from '@/hooks/useBinders';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { setBinderTags } from '@/lib/tags';
import { useAuthStore } from '@/stores/auth';
import type { Binder } from '@foilio/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateBinderInput {
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  is_public: boolean;
  accent_color?: string | null;
  layout_type?: string;
  tags: string[];
}

export function useCreateBinder() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<Binder, Error, CreateBinderInput>({
    mutationFn: async (input) => {
      if (!userId) throw new Error('Not authenticated');

      const { data: binder, error } = await supabase
        .from('binders')
        .insert({
          owner_id: userId,
          title: input.title,
          description: input.description ?? null,
          cover_image_url: input.cover_image_url ?? null,
          is_public: input.is_public,
          accent_color: input.accent_color ?? null,
          layout_type: input.layout_type ?? 'grid',
        })
        .select('*')
        .single();
      if (error) throw error;

      if (input.tags.length > 0) {
        await setBinderTags(binder.id, input.tags);
      }

      return binder;
    },
    onSuccess: (binder, input) => {
      trackEvent('binder_created', {
        is_public: input.is_public,
        tag_count: input.tags.length,
        has_cover: !!input.cover_image_url,
      });
      queryClient.invalidateQueries({ queryKey: bindersQueryKey(userId) });
      queryClient.setQueryData(binderQueryKey(binder.id), { ...binder, tags: [] });
    },
  });
}
