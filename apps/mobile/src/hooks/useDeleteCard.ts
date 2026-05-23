import { bindersQueryKey } from '@/hooks/useBinders';
import {
  type CardWithExtras,
  cardsForBinderQueryKey,
  cardsForPageQueryKey,
} from '@/hooks/useCards';
import { pagesForBinderQueryKey } from '@/hooks/usePages';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteCardInput {
  id: string;
  binder_id: string;
  page_id?: string;
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, DeleteCardInput, { previous?: CardWithExtras[] }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, binder_id }) => {
      await queryClient.cancelQueries({ queryKey: cardsForBinderQueryKey(binder_id) });
      const previous = queryClient.getQueryData<CardWithExtras[]>(
        cardsForBinderQueryKey(binder_id),
      );
      if (previous) {
        queryClient.setQueryData(
          cardsForBinderQueryKey(binder_id),
          previous.filter((c) => c.id !== id),
        );
      }
      return { previous };
    },
    onError: (_err, { binder_id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cardsForBinderQueryKey(binder_id), context.previous);
      }
    },
    onSuccess: (_data, input) => {
      trackEvent('card_deleted', { card_id: input.id });
      queryClient.invalidateQueries({ queryKey: bindersQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: pagesForBinderQueryKey(input.binder_id) });
      if (input.page_id) {
        queryClient.invalidateQueries({ queryKey: cardsForPageQueryKey(input.page_id) });
      }
    },
  });
}
