import { bindersQueryKey } from '@/hooks/useBinders';
import { type CardWithPhotos, cardsForBinderQueryKey } from '@/hooks/useCards';
import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteCardInput {
  id: string;
  binder_id: string;
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, DeleteCardInput, { previous?: CardWithPhotos[] }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, binder_id }) => {
      await queryClient.cancelQueries({ queryKey: cardsForBinderQueryKey(binder_id) });
      const previous = queryClient.getQueryData<CardWithPhotos[]>(
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
    },
  });
}
