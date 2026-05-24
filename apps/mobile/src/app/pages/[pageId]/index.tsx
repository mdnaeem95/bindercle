import { CardLayout } from '@/components/CardLayout';
import { DraggableGrid } from '@/components/DraggableGrid';
import { useBinder } from '@/hooks/useBinder';
import { type CardWithExtras, useCardsForBinder } from '@/hooks/useCards';
import { type PageWithCount, usePage, usePagesForBinder } from '@/hooks/usePages';
import { useReorderCards } from '@/hooks/useReorderCards';
import type { BinderLayout } from '@/lib/validators/binder';
import { useAuthStore } from '@/stores/auth';
import { type AccentColor, Button, Surface, Text, accentSolid, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PageDetailScreen() {
  const theme = useTheme();
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const { data: initialPage, isLoading: pageLoading } = usePage(pageId);
  const { data: binder } = useBinder(initialPage?.binder_id);
  const { data: pages } = usePagesForBinder(initialPage?.binder_id);
  // One query for the whole binder's cards is cheaper than N per-page fetches as the
  // user swipes between pages.
  const { data: allCards } = useCardsForBinder(initialPage?.binder_id);
  const reorderCards = useReorderCards();
  const viewerId = useAuthStore((s) => s.user?.id);

  const initialIndex = useMemo(() => {
    if (!pages || pages.length === 0) return 0;
    const idx = pages.findIndex((p) => p.id === pageId);
    return idx >= 0 ? idx : 0;
  }, [pages, pageId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  // When pages first load (or the URL pageId changes), sync the visible index.
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const cardsByPage = useMemo(() => {
    const map = new Map<string, CardWithExtras[]>();
    for (const c of allCards ?? []) {
      if (!c.page_id) continue;
      const list = map.get(c.page_id) ?? [];
      list.push(c);
      map.set(c.page_id, list);
    }
    return map;
  }, [allCards]);

  const currentPage = pages?.[currentIndex] ?? initialPage ?? null;
  const isOwner = !!currentPage && viewerId === currentPage.owner_id;

  const [reorganizing, setReorganizing] = useState(false);
  const [draftCards, setDraftCards] = useState<CardWithExtras[]>([]);
  const [gridWidth, setGridWidth] = useState(0);

  const { width: screenWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList<PageWithCount>>(null);

  const enterReorganize = () => {
    if (!currentPage) return;
    setDraftCards(cardsByPage.get(currentPage.id) ?? []);
    setReorganizing(true);
  };

  const exitReorganize = async () => {
    if (!currentPage) return;
    const original = cardsByPage.get(currentPage.id) ?? [];
    setReorganizing(false);
    const changed =
      draftCards.length !== original.length || draftCards.some((c, i) => c.id !== original[i]?.id);
    if (!changed) return;
    try {
      await reorderCards.mutateAsync({
        page_id: currentPage.id,
        binder_id: currentPage.binder_id,
        card_ids: draftCards.map((c) => c.id),
      });
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert("Couldn't save order", err.message ?? 'Try again.');
    }
  };

  const handleOrderChange = (orderedIds: string[]) => {
    const byId = new Map(draftCards.map((c) => [c.id, c]));
    const next = orderedIds.map((id) => byId.get(id)).filter((c): c is CardWithExtras => !!c);
    setDraftCards(next);
  };

  const onGridLayout = (e: LayoutChangeEvent) => {
    setGridWidth(e.nativeEvent.layout.width);
  };

  const onPagerScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (idx !== currentIndex) setCurrentIndex(idx);
  };

  if (pageLoading || !initialPage || !binder || !pages) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary">Loading…</Text>
        </SafeAreaView>
      </Surface>
    );
  }

  const accentTint = accentSolid(binder.accent_color as AccentColor | null);
  const displayName =
    currentPage?.name?.trim() || `Page ${(currentPage?.position ?? currentIndex) + 1}`;
  const binderLayout = (binder.layout_type as BinderLayout) ?? 'nine_pocket';
  const pageCount = pages.length;

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header — reflects whichever page is currently visible. */}
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
              <Text variant="caption" tone="tertiary">
                {binder.title}
                {pageCount > 1 ? ` · ${currentIndex + 1} / ${pageCount}` : ''}
              </Text>
            </View>
            {reorganizing ? (
              <Pressable onPress={exitReorganize} hitSlop={12}>
                <Text variant="body" style={{ fontWeight: '600' }}>
                  Done
                </Text>
              </Pressable>
            ) : isOwner && currentPage ? (
              <Pressable onPress={() => router.push(`/pages/${currentPage.id}/edit`)} hitSlop={12}>
                <Text variant="body" tone="secondary">
                  Edit
                </Text>
              </Pressable>
            ) : (
              <View style={{ width: 32 }} />
            )}
          </View>

          {/* Horizontal page pager — disabled while reorganizing so drags don't fight scrolls. */}
          <FlatList
            ref={flatListRef}
            data={pages}
            horizontal
            pagingEnabled
            scrollEnabled={!reorganizing}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, idx) => ({
              length: screenWidth,
              offset: screenWidth * idx,
              index: idx,
            })}
            onMomentumScrollEnd={onPagerScrollEnd}
            keyExtractor={(p) => p.id}
            renderItem={({ item: p, index }) => {
              const pageCards = cardsByPage.get(p.id) ?? [];
              const isActive = index === currentIndex;
              return (
                <PageBody
                  width={screenWidth}
                  page={p}
                  cards={pageCards}
                  binderLayout={binderLayout}
                  isOwner={isOwner && isActive}
                  reorganizing={reorganizing && isActive}
                  draftCards={isActive ? draftCards : pageCards}
                  gridWidth={gridWidth}
                  onGridLayout={onGridLayout}
                  onOrderChange={handleOrderChange}
                  onEnterReorganize={enterReorganize}
                />
              );
            }}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    </Surface>
  );
}

type PageBodyProps = {
  width: number;
  page: PageWithCount;
  cards: CardWithExtras[];
  binderLayout: BinderLayout;
  isOwner: boolean;
  reorganizing: boolean;
  draftCards: CardWithExtras[];
  gridWidth: number;
  onGridLayout: (e: LayoutChangeEvent) => void;
  onOrderChange: (ids: string[]) => void;
  onEnterReorganize: () => void;
};

function PageBody({
  width,
  page,
  cards,
  binderLayout,
  isOwner,
  reorganizing,
  draftCards,
  gridWidth,
  onGridLayout,
  onOrderChange,
  onEnterReorganize,
}: PageBodyProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cardCount = cards.length;

  if (reorganizing) {
    return (
      <ScrollView
        style={{ width }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      >
        <Text variant="bodySmall" tone="secondary" align="center" style={{ marginBottom: 16 }}>
          Long-press a card, then drag to rearrange
        </Text>
        <View onLayout={onGridLayout}>
          {gridWidth > 0 && (
            <DraggableGrid
              items={draftCards}
              keyExtractor={(c) => c.id}
              containerWidth={gridWidth}
              onOrderChange={onOrderChange}
              renderItem={(c) => {
                const photoUrl = c.photos[0]?.url ?? c.tcg_card?.image_small ?? null;
                return photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ flex: 1, backgroundColor: theme.colors.bgElevated2 }} />
                );
              }}
            />
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 48 + insets.bottom,
        gap: 12,
      }}
    >
      {isOwner && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          {cardCount > 1 && (
            <Button variant="ghost" size="sm" onPress={onEnterReorganize}>
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
      )}

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
          <Sparkles size={32} color={theme.colors.textTertiary} strokeWidth={1.6} />
          <Text variant="body" align="center">
            Empty page, full potential
          </Text>
          <Text variant="caption" tone="secondary" align="center">
            Add the first card to make this page yours.
          </Text>
        </View>
      ) : (
        <CardLayout
          layout={binderLayout}
          cards={cards}
          onCardPress={(cardId) => router.push(`/cards/${cardId}`)}
        />
      )}
    </ScrollView>
  );
}
