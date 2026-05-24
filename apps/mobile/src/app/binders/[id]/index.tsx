import { DraggableGrid } from '@/components/DraggableGrid';
import { useBinder } from '@/hooks/useBinder';
import { useBinderEngagement, useToggleLike, useToggleSave } from '@/hooks/useBinderEngagement';
import { useCardsForBinder } from '@/hooks/useCards';
import { type PageWithCount, usePagesForBinder } from '@/hooks/usePages';
import { useReorderPages } from '@/hooks/useReorderPages';
import { BINDER_LAYOUT_COLUMNS, type BinderLayout } from '@/lib/validators/binder';
import { useAuthStore } from '@/stores/auth';
import {
  type AccentColor,
  Button,
  PageThumbnail,
  Surface,
  Text,
  accentSolid,
  useTheme,
} from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  ChevronRight,
  Heart,
  MessageCircle,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, type LayoutChangeEvent, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BinderDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: binder, isLoading } = useBinder(id);
  const { data: pages } = usePagesForBinder(id);
  // Used to derive preview thumbnails per page (one query for the whole binder is
  // cheaper than N queries per page).
  const { data: allCards } = useCardsForBinder(id);
  const reorderPages = useReorderPages();
  const viewerId = useAuthStore((s) => s.user?.id);
  const { data: engagement } = useBinderEngagement(id);
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();

  const [reorganizing, setReorganizing] = useState(false);
  const [draftPages, setDraftPages] = useState<PageWithCount[]>([]);
  const [gridWidth, setGridWidth] = useState(0);

  useEffect(() => {
    setDraftPages(pages ?? []);
  }, [pages]);

  const onGridLayout = (e: LayoutChangeEvent) => {
    setGridWidth(e.nativeEvent.layout.width);
  };

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const overscroll = scrollY.value < 0 ? -scrollY.value : 0;
    const scale = 1 + overscroll / 400;
    return {
      transform: [{ translateY: scrollY.value * 0.5 }, { scale }],
    };
  });

  if (isLoading || !binder) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary">Loading…</Text>
        </SafeAreaView>
      </Surface>
    );
  }

  const pageCount = pages?.length ?? 0;
  const totalCardCount = allCards?.length ?? 0;
  const accentTint = accentSolid(binder.accent_color as AccentColor | null);

  const enterReorganize = () => {
    setDraftPages(pages ?? []);
    setReorganizing(true);
  };

  const exitReorganize = async () => {
    setReorganizing(false);
    const original = pages ?? [];
    const changed =
      draftPages.length !== original.length || draftPages.some((p, i) => p.id !== original[i]?.id);
    if (!changed) return;
    try {
      await reorderPages.mutateAsync({
        binder_id: binder.id,
        page_ids: draftPages.map((p) => p.id),
      });
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert("Couldn't save order", err.message ?? 'Try again.');
    }
  };

  const handlePageOrderChange = (orderedIds: string[]) => {
    const byId = new Map(draftPages.map((p) => [p.id, p]));
    const next = orderedIds.map((id) => byId.get(id)).filter((p): p is PageWithCount => !!p);
    setDraftPages(next);
  };

  // All pages in a binder share the binder's pocket layout.
  const binderCols = BINDER_LAYOUT_COLUMNS[binder.layout_type as BinderLayout] ?? 3;
  // Mini cells are flex:1 with 4px gaps; their height is width * 88/63.
  const pageCellHeight =
    gridWidth > 0
      ? (() => {
          const cellWidth = (gridWidth - 12) / 2;
          const innerWidth = cellWidth - 24;
          const miniItemWidth = (innerWidth - (binderCols - 1) * 4) / binderCols;
          const miniItemHeight = miniItemWidth * (88 / 63);
          // 12 padding + N rows of mini cells + (N-1) inter-row gaps of 4 + 8 gap to footer
          // + 24 footer line + 12 padding
          return Math.ceil(12 + binderCols * miniItemHeight + (binderCols - 1) * 4 + 8 + 24 + 12);
        })()
      : 0;

  // Group preview URLs by page_id so each PageThumbnail can render its own mini grid.
  // Cap at 16 (the largest possible layout = 4×4 / sixteen_pocket). Cards without an
  // image take a slot with null so the empty pocket sits where that card actually is.
  const previewsByPage = new Map<string, (string | null)[]>();
  for (const card of allCards ?? []) {
    if (!card.page_id) continue;
    const existing = previewsByPage.get(card.page_id) ?? [];
    if (existing.length < 16) {
      existing.push(card.photos[0]?.url ?? card.tcg_card?.image_small ?? null);
      previewsByPage.set(card.page_id, existing);
    }
  }

  // Card counts per page
  const countsByPage = new Map<string, number>();
  for (const card of allCards ?? []) {
    if (!card.page_id) continue;
    countsByPage.set(card.page_id, (countsByPage.get(card.page_id) ?? 0) + 1);
  }

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.ScrollView
          contentContainerStyle={{ paddingBottom: 48 + insets.bottom }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* Cover hero with parallax */}
          <Animated.View style={heroAnimatedStyle}>
            {binder.cover_image_url ? (
              <Image
                source={{ uri: binder.cover_image_url }}
                style={{ width: '100%', aspectRatio: 3 / 4 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  aspectRatio: 3 / 4,
                  backgroundColor: theme.colors.bgElevated2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="display1" tone="tertiary">
                  {binder.title.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
          </Animated.View>

          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 12,
              }}
            >
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={{
                  backgroundColor: 'rgba(10,10,15,0.6)',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowLeft size={18} color="#F8F8F2" strokeWidth={2} />
              </Pressable>
              {viewerId === binder.owner_id ? (
                <Pressable
                  onPress={() => router.push(`/binders/${binder.id}/edit`)}
                  hitSlop={12}
                  style={{
                    backgroundColor: 'rgba(10,10,15,0.6)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 9999,
                  }}
                >
                  <Text variant="caption" style={{ color: '#F8F8F2' }}>
                    Edit
                  </Text>
                </Pressable>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() =>
                      toggleLike.mutate({
                        binder_id: binder.id,
                        currentlyLiked: !!engagement?.isLiked,
                      })
                    }
                    hitSlop={12}
                    style={{
                      backgroundColor: 'rgba(10,10,15,0.6)',
                      paddingHorizontal: 12,
                      height: 36,
                      borderRadius: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Heart
                      size={18}
                      color="#F8F8F2"
                      fill={engagement?.isLiked ? '#F8F8F2' : 'transparent'}
                      strokeWidth={2}
                    />
                    {!!engagement && engagement.likeCount > 0 && (
                      <Text variant="caption" style={{ color: '#F8F8F2' }}>
                        {engagement.likeCount}
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      toggleSave.mutate({
                        binder_id: binder.id,
                        currentlySaved: !!engagement?.isSaved,
                      })
                    }
                    hitSlop={12}
                    style={{
                      backgroundColor: 'rgba(10,10,15,0.6)',
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bookmark
                      size={18}
                      color="#F8F8F2"
                      fill={engagement?.isSaved ? '#F8F8F2' : 'transparent'}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          </SafeAreaView>

          {/* Meta */}
          <View style={{ padding: 24, gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text variant="heading1" style={accentTint ? { color: accentTint } : undefined}>
                {binder.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text variant="caption" tone="tertiary">
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'} · {totalCardCount}{' '}
                  {totalCardCount === 1 ? 'card' : 'cards'}
                </Text>
                {!binder.is_public && (
                  <Text variant="caption" tone="tertiary">
                    · Private
                  </Text>
                )}
              </View>
            </View>

            {binder.description && (
              <Text variant="body" tone="secondary">
                {binder.description}
              </Text>
            )}

            {binder.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {binder.tags.map((tag) => (
                  <View
                    key={tag.id}
                    style={{
                      backgroundColor: theme.colors.bgElevated2,
                      borderColor: theme.colors.borderDefault,
                      borderWidth: 1,
                      borderRadius: 9999,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text variant="caption">{tag.name}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Comments link */}
            <Pressable
              onPress={() => router.push(`/binders/${binder.id}/comments`)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: pressed ? theme.colors.bgElevated2 : theme.colors.bgElevated1,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
              })}
            >
              <MessageCircle size={18} color={theme.colors.textSecondary} strokeWidth={1.8} />
              <Text variant="body" style={{ flex: 1 }}>
                {engagement?.commentCount && engagement.commentCount > 0
                  ? `${engagement.commentCount} ${engagement.commentCount === 1 ? 'comment' : 'comments'}`
                  : 'Be the first to comment'}
              </Text>
              <ChevronRight size={16} color={theme.colors.textTertiary} strokeWidth={1.8} />
            </Pressable>

            {/* Pages grid */}
            <View style={{ marginTop: 16, gap: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text variant="heading3">Pages</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {viewerId === binder.owner_id &&
                    (reorganizing ? (
                      <Button variant="secondary" size="sm" onPress={exitReorganize}>
                        Done
                      </Button>
                    ) : (
                      <>
                        {pageCount > 1 && (
                          <Button variant="ghost" size="sm" onPress={enterReorganize}>
                            Reorganize
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onPress={() => router.push(`/binders/${binder.id}/pages/new`)}
                        >
                          + Add page
                        </Button>
                      </>
                    ))}
                </View>
              </View>

              {pageCount === 0 ? (
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
                  <BookOpen size={32} color={theme.colors.textTertiary} strokeWidth={1.6} />
                  <Text variant="body" align="center">
                    No pages yet
                  </Text>
                  <Text variant="caption" tone="secondary" align="center">
                    Add a page to start arranging cards.
                  </Text>
                </View>
              ) : reorganizing ? (
                <View onLayout={onGridLayout}>
                  {reorganizing && (
                    <Text
                      variant="bodySmall"
                      tone="secondary"
                      align="center"
                      style={{ marginBottom: 12 }}
                    >
                      Long-press a page, then drag to rearrange
                    </Text>
                  )}
                  {gridWidth > 0 && pageCellHeight > 0 && (
                    <DraggableGrid
                      items={draftPages}
                      keyExtractor={(p) => p.id}
                      containerWidth={gridWidth}
                      columns={2}
                      cellHeight={pageCellHeight}
                      gap={12}
                      onOrderChange={handlePageOrderChange}
                      renderItem={(page) => (
                        <PageThumbnail
                          name={page.name ?? ''}
                          pageNumber={page.position + 1}
                          cardCount={countsByPage.get(page.id) ?? page.card_count}
                          previewUrls={previewsByPage.get(page.id) ?? []}
                          columns={binderCols}
                          accentColor={accentTint}
                          style={{ width: '100%', height: '100%' }}
                        />
                      )}
                    />
                  )}
                </View>
              ) : (
                // Explicit row chunks: flex-wrap can reflow unpredictably if any
                // thumbnail ever differs in height. This guarantees left-to-right,
                // top-to-bottom fill regardless of content size.
                <View style={{ gap: 12 }}>
                  {chunk(pages ?? [], 2).map((row, rowIdx) => (
                    <View
                      key={`row-${rowIdx}-${row[0]?.id ?? rowIdx}`}
                      style={{ flexDirection: 'row', gap: 12 }}
                    >
                      {row.map((page, colIdx) => (
                        <View key={page.id} style={{ flex: 1 }}>
                          <PageThumbnail
                            name={page.name ?? ''}
                            pageNumber={rowIdx * 2 + colIdx + 1}
                            cardCount={countsByPage.get(page.id) ?? page.card_count}
                            previewUrls={previewsByPage.get(page.id) ?? []}
                            columns={binderCols}
                            accentColor={accentTint}
                            onPress={() => router.push(`/pages/${page.id}`)}
                          />
                        </View>
                      ))}
                      {row.length === 1 && <View style={{ flex: 1 }} />}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Animated.ScrollView>
      </GestureHandlerRootView>
    </Surface>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
