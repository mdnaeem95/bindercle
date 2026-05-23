import { CardLayout } from '@/components/CardLayout';
import { useBinder } from '@/hooks/useBinder';
import { type CardWithExtras, useCardsForPage } from '@/hooks/useCards';
import { usePage } from '@/hooks/usePages';
import { useReorderCards } from '@/hooks/useReorderCards';
import type { BinderLayout } from '@/lib/validators/binder';
import { type AccentColor, Button, Surface, Text, accentSolid, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PageDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const { data: page, isLoading: pageLoading } = usePage(pageId);
  const { data: binder } = useBinder(page?.binder_id);
  const { data: cards } = useCardsForPage(pageId);
  const reorderCards = useReorderCards();

  const [reorganizing, setReorganizing] = useState(false);
  const [draftCards, setDraftCards] = useState<CardWithExtras[]>([]);

  useEffect(() => {
    setDraftCards(cards ?? []);
  }, [cards]);

  if (pageLoading || !page) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary">Loading…</Text>
        </SafeAreaView>
      </Surface>
    );
  }

  const cardCount = cards?.length ?? 0;
  const accentTint = accentSolid(binder?.accent_color as AccentColor | null);
  const displayName = page.name?.trim() || `Page ${page.position + 1}`;

  const enterReorganize = () => {
    setDraftCards(cards ?? []);
    setReorganizing(true);
  };

  const exitReorganize = async () => {
    setReorganizing(false);
    const original = cards ?? [];
    const changed =
      draftCards.length !== original.length || draftCards.some((c, i) => c.id !== original[i]?.id);
    if (!changed) return;
    try {
      await reorderCards.mutateAsync({
        page_id: page.id,
        binder_id: page.binder_id,
        card_ids: draftCards.map((c) => c.id),
      });
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert("Couldn't save order", err.message ?? 'Try again.');
    }
  };

  const renderDragItem = ({ item, drag, isActive }: RenderItemParams<CardWithExtras>) => {
    const photoUrl = item.photos[0]?.url ?? item.tcg_card?.image_small ?? null;
    return (
      <Pressable
        onLongPress={drag}
        delayLongPress={150}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          marginBottom: 8,
          borderRadius: 12,
          backgroundColor: isActive ? theme.colors.bgElevated3 : theme.colors.bgElevated1,
          borderWidth: 1,
          borderColor: isActive ? theme.colors.textPrimary : theme.colors.borderSubtle,
          gap: 12,
        }}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{
              width: 36,
              height: 50,
              borderRadius: 4,
              backgroundColor: theme.colors.bgElevated2,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 50,
              borderRadius: 4,
              backgroundColor: theme.colors.bgElevated2,
            }}
          />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="body" numberOfLines={1}>
            {item.name}
          </Text>
          {item.caption && (
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              {item.caption}
            </Text>
          )}
        </View>
        <Text variant="display2" tone="tertiary">
          ⋮⋮
        </Text>
      </Pressable>
    );
  };

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
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
            <Pressable onPress={() => router.back()} hitSlop={12} disabled={reorganizing}>
              <Text variant="body" tone={reorganizing ? 'tertiary' : 'secondary'}>
                Back
              </Text>
            </Pressable>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text variant="heading3" style={accentTint ? { color: accentTint } : undefined}>
                {displayName}
              </Text>
              {binder && (
                <Text variant="caption" tone="tertiary">
                  {binder.title}
                </Text>
              )}
            </View>
            {reorganizing ? (
              <Pressable onPress={exitReorganize} hitSlop={12}>
                <Text variant="body" style={{ fontWeight: '600' }}>
                  Done
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push(`/pages/${page.id}/edit`)} hitSlop={12}>
                <Text variant="body" tone="secondary">
                  Edit
                </Text>
              </Pressable>
            )}
          </View>

          {reorganizing ? (
            <View style={{ flex: 1, padding: 16 }}>
              <Text
                variant="bodySmall"
                tone="secondary"
                align="center"
                style={{ marginBottom: 12 }}
              >
                long-press a card, then drag to rearrange
              </Text>
              <DraggableFlatList
                data={draftCards}
                onDragEnd={({ data }) => setDraftCards(data)}
                keyExtractor={(item) => item.id}
                renderItem={renderDragItem}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 48 + insets.bottom,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                {cardCount > 1 && (
                  <Button variant="ghost" size="sm" onPress={enterReorganize}>
                    Reorganize
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push(`/pages/${page.id}/cards/new`)}
                >
                  + Add card
                </Button>
              </View>

              {cardCount === 0 ? (
                <View
                  style={{
                    marginTop: 8,
                    padding: 32,
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: theme.colors.borderSubtle,
                  }}
                >
                  <Text variant="body" align="center">
                    empty page, full potential 💫
                  </Text>
                  <Text variant="caption" tone="secondary" align="center">
                    Add the first card to make this page yours.
                  </Text>
                </View>
              ) : (
                <CardLayout
                  layout={(page.layout_type as BinderLayout) ?? 'grid'}
                  cards={cards ?? []}
                  onCardPress={(cardId) => router.push(`/cards/${cardId}`)}
                />
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Surface>
  );
}
