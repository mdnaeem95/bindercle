import { CardLayout } from '@/components/CardLayout';
import { useBinder } from '@/hooks/useBinder';
import { useCardsForBinder } from '@/hooks/useCards';
import type { BinderLayout } from '@/lib/validators/binder';
import { type AccentColor, Button, Surface, Text, accentSolid, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BinderDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: binder, isLoading } = useBinder(id);
  const { data: cards } = useCardsForBinder(id);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Hero parallax: image moves at half scroll speed, scales up on overscroll
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

  const cardCount = cards?.length ?? 0;
  const accentTint = accentSolid(binder.accent_color as AccentColor | null);

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
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
                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
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

          {/* Cards grid */}
          <View style={{ marginTop: 16, gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="heading3">Cards</Text>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => router.push(`/binders/${binder.id}/cards/new`)}
              >
                + Add one
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
                  empty binder, full potential 💫
                </Text>
                <Text variant="caption" tone="secondary" align="center">
                  Drop in a card. Tell its story. Build the vibe.
                </Text>
              </View>
            ) : (
              <CardLayout
                layout={(binder.layout_type as BinderLayout) ?? 'grid'}
                cards={cards ?? []}
                onCardPress={(cardId) => router.push(`/cards/${cardId}`)}
              />
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </Surface>
  );
}
