import { useCard } from '@/hooks/useCards';
import { useMoveCardToPage } from '@/hooks/useMoveCardToPage';
import { type PageWithCount, usePagesForBinder } from '@/hooks/usePages';
import { Surface, Text, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MoveCardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { data: card, isLoading: cardLoading } = useCard(cardId);
  const { data: pages, isLoading: pagesLoading } = usePagesForBinder(card?.binder_id);
  const moveCard = useMoveCardToPage();

  const onPick = async (target: PageWithCount) => {
    if (!card?.page_id || moveCard.isPending) return;
    try {
      await moveCard.mutateAsync({
        card_id: card.id,
        from_page_id: card.page_id,
        to_page_id: target.id,
        binder_id: card.binder_id,
      });
      router.replace(`/pages/${target.id}`);
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert("Couldn't move card", err.message ?? 'Try again.');
    }
  };

  const loading = cardLoading || pagesLoading || !card;

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderSubtle,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} disabled={moveCard.isPending}>
            <Text variant="body" tone="secondary">
              Cancel
            </Text>
          </Pressable>
          <Text variant="heading3">Move to Page</Text>
          <View style={{ width: 48 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text tone="tertiary">Loading…</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingBottom: insets.bottom + 24,
              gap: 8,
            }}
          >
            <Text variant="caption" tone="tertiary" style={{ marginBottom: 4 }}>
              Pick a page in this binder
            </Text>
            {(pages ?? []).map((p) => {
              const isCurrent = p.id === card.page_id;
              const displayName = p.name?.trim() || `Page ${p.position + 1}`;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => onPick(p)}
                  disabled={isCurrent || moveCard.isPending}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: isCurrent
                      ? theme.colors.bgElevated2
                      : theme.colors.bgElevated1,
                    borderWidth: 1,
                    borderColor: theme.colors.borderSubtle,
                    opacity: pressed ? 0.8 : isCurrent ? 0.6 : 1,
                  })}
                >
                  <View style={{ gap: 2 }}>
                    <Text variant="body">{displayName}</Text>
                    <Text variant="caption" tone="tertiary">
                      {p.card_count} {p.card_count === 1 ? 'card' : 'cards'}
                    </Text>
                  </View>
                  {isCurrent && (
                    <Text variant="caption" tone="tertiary">
                      Current
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </Surface>
  );
}
