import { BinderPageGrid } from '@/components/BinderPageGrid';
import { CardLayout } from '@/components/CardLayout';
import { useBinder } from '@/hooks/useBinder';
import { type CardWithExtras, useCardsForBinder } from '@/hooks/useCards';
import { useDeleteCard } from '@/hooks/useDeleteCard';
import { useExportPage } from '@/hooks/usePageExport';
import { type PageWithCount, usePage, usePagesForBinder } from '@/hooks/usePages';
import { useReorderCards } from '@/hooks/useReorderCards';
import type { BinderLayout } from '@/lib/validators/binder';
import { useAuthStore } from '@/stores/auth';
import { type AccentColor, Button, Surface, Text, accentSolid, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  const deleteCard = useDeleteCard();
  const exportPage = useExportPage();
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
    const originalPositions = new Map(original.map((c) => [c.id, c.position]));
    const updates = draftCards
      .filter((c) => originalPositions.get(c.id) !== c.position)
      .map((c) => ({ card_id: c.id, position: c.position }));
    if (updates.length === 0) return;
    try {
      await reorderCards.mutateAsync({
        page_id: currentPage.id,
        binder_id: currentPage.binder_id,
        updates,
      });
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert("Couldn't save order", err.message ?? 'Try again.');
    }
  };

  const handlePositionsChange = (positions: Record<string, number>) => {
    setDraftCards((prev) =>
      prev.map((c) => {
        const next = positions[c.id];
        return next === undefined ? c : { ...c, position: next };
      }),
    );
  };

  const handleTrashCard = (cardId: string) => {
    const card = draftCards.find((c) => c.id === cardId);
    if (!card) return;
    Alert.alert('Delete card?', `"${card.name}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setDraftCards((prev) => prev.filter((c) => c.id !== cardId));
          deleteCard.mutate(
            { id: card.id, binder_id: card.binder_id, page_id: card.page_id ?? undefined },
            {
              onError: (e) => {
                Alert.alert("Couldn't delete", e.message ?? 'Try again.');
                setDraftCards((prev) =>
                  prev.some((c) => c.id === card.id) ? prev : [...prev, card],
                );
              },
            },
          );
        },
      },
    ]);
  };

  const onGridLayout = (e: LayoutChangeEvent) => {
    setGridWidth(e.nativeEvent.layout.width);
  };

  // Server-composed page export → OS share sheet. Available to any viewer of a
  // visible page (owner or not, signed in or anon) — every share carries the
  // wordmark + owner @handle back out.
  const onShare = () => {
    if (!currentPage) return;
    exportPage.mutate(
      { page_id: currentPage.id, surface: 'page_detail' },
      {
        onError: (e) => Alert.alert("Couldn't create image", e.message ?? 'Try again in a moment.'),
      },
    );
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
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Pressable
                  onPress={onShare}
                  hitSlop={12}
                  disabled={exportPage.isPending}
                  accessibilityLabel="Share this page"
                >
                  {exportPage.isPending ? (
                    <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                  ) : (
                    <Share2 size={20} color={theme.colors.textSecondary} strokeWidth={1.8} />
                  )}
                </Pressable>
                {isOwner && currentPage && (
                  <Pressable
                    onPress={() => router.push(`/pages/${currentPage.id}/edit`)}
                    hitSlop={12}
                  >
                    <Text variant="body" tone="secondary">
                      Edit
                    </Text>
                  </Pressable>
                )}
              </View>
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
                  onPositionsChange={handlePositionsChange}
                  onEnterReorganize={enterReorganize}
                  onTrashCard={handleTrashCard}
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
  onPositionsChange: (positions: Record<string, number>) => void;
  onEnterReorganize: () => void;
  onTrashCard: (cardId: string) => void;
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
  onPositionsChange,
  onEnterReorganize,
  onTrashCard,
}: PageBodyProps) {
  const insets = useSafeAreaInsets();
  const cardCount = cards.length;

  if (reorganizing) {
    return (
      <ScrollView
        style={{ width }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      >
        <Text variant="bodySmall" tone="secondary" align="center" style={{ marginBottom: 16 }}>
          Long-press a card, then drag to any pocket to move or swap. Drop on the trash to delete.
        </Text>
        <View onLayout={onGridLayout}>
          {gridWidth > 0 && (
            <BinderPageGrid
              layout={binderLayout}
              cards={draftCards}
              containerWidth={gridWidth}
              onPositionsChange={onPositionsChange}
              onDeleteCard={onTrashCard}
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
      {isOwner && cardCount >= 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" size="sm" onPress={onEnterReorganize}>
            Reorganize
          </Button>
        </View>
      )}

      <CardLayout
        layout={binderLayout}
        cards={cards}
        onCardPress={(cardId) => router.push(`/cards/${cardId}`)}
        onEmptySlotPress={
          isOwner
            ? (position) =>
                router.push(
                  `/pages/${page.id}/cards/new?position=${position}&binder_id=${page.binder_id}`,
                )
            : undefined
        }
      />

      {cardCount === 0 && (
        <View style={{ marginTop: 4, gap: 2 }}>
          <Text variant="caption" tone="tertiary" align="center">
            tap any pocket to add a card.
          </Text>
          <Text variant="caption" tone="tertiary" align="center">
            leave gaps if you want — the layout's yours.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
