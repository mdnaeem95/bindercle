import { useBinder } from '@/hooks/useBinder';
import { useCardsForBinder } from '@/hooks/useCards';
import { usePagesForBinder } from '@/hooks/usePages';
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
import { Image, Pressable, View } from 'react-native';
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

  // Group preview URLs by page_id so each PageThumbnail can render its own mini grid
  const previewsByPage = new Map<string, string[]>();
  for (const card of allCards ?? []) {
    if (!card.page_id) continue;
    const url = card.photos[0]?.url ?? card.tcg_card?.image_small ?? null;
    if (!url) continue;
    const existing = previewsByPage.get(card.page_id) ?? [];
    if (existing.length < 6) {
      existing.push(url);
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
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 9999,
              }}
            >
              <Text variant="body" style={{ color: '#F8F8F2' }}>
                ←
              </Text>
            </Pressable>
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
              <Button
                variant="secondary"
                size="sm"
                onPress={() => router.push(`/binders/${binder.id}/pages/new`)}
              >
                + Add page
              </Button>
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
                <Text variant="body" align="center">
                  no pages yet 📑
                </Text>
                <Text variant="caption" tone="secondary" align="center">
                  Add a page to start arranging cards.
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {(pages ?? []).map((page, index) => (
                  <View key={page.id} style={{ width: '47.5%' }}>
                    <PageThumbnail
                      name={page.name ?? ''}
                      pageNumber={index + 1}
                      cardCount={countsByPage.get(page.id) ?? page.card_count}
                      previewUrls={previewsByPage.get(page.id) ?? []}
                      accentColor={accentTint}
                      onPress={() => router.push(`/pages/${page.id}`)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </Surface>
  );
}
