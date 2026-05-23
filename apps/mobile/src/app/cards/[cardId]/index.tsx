import { HoloShimmer } from '@/components/HoloShimmer';
import { useCard } from '@/hooks/useCards';
import { isHolo } from '@/lib/cards';
import { CARD_CONDITION_LABELS, type CardCondition } from '@/lib/validators/card';
import { Surface, Text, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CardDetailScreen() {
  const theme = useTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { data: card, isLoading } = useCard(cardId);

  if (isLoading || !card) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary">Loading…</Text>
        </SafeAreaView>
      </Surface>
    );
  }

  const heroPhotoUrl = card.photos[0]?.url ?? card.tcg_card?.image_large ?? null;
  const hasUserPhotos = card.photos.length > 0;
  const cardIsHolo = isHolo(card.rarity);

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Hero photo — shimmer overlay on holo rarities */}
        {heroPhotoUrl ? (
          cardIsHolo ? (
            <HoloShimmer
              uri={heroPhotoUrl}
              style={{
                width: '100%',
                aspectRatio: 63 / 88,
                backgroundColor: theme.colors.bgElevated1,
              }}
            />
          ) : (
            <Image
              source={{ uri: heroPhotoUrl }}
              style={{
                width: '100%',
                aspectRatio: 63 / 88,
                backgroundColor: theme.colors.bgElevated1,
              }}
              resizeMode="cover"
            />
          )
        ) : (
          <View
            style={{
              width: '100%',
              aspectRatio: 63 / 88,
              backgroundColor: theme.colors.bgElevated2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="display2" tone="tertiary">
              {card.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Source indicator when we're showing official art */}
        {!hasUserPhotos && card.tcg_card?.image_large && (
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text variant="caption" tone="tertiary">
              Official art · add your own photo to make it yours
            </Text>
          </View>
        )}

        {/* Header overlay */}
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
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
              onPress={() => router.push(`/cards/${card.id}/edit`)}
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

        {/* Photo carousel (if multi-photo) */}
        {card.photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, gap: 8 }}
          >
            {card.photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photo.url }}
                style={{
                  width: 80,
                  height: 112,
                  borderRadius: 8,
                  backgroundColor: theme.colors.bgElevated1,
                }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        {/* Meta */}
        <View style={{ padding: 24, gap: 16 }}>
          <Text variant="heading1">{card.name}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {card.set_code && (
              <View
                style={{
                  backgroundColor: theme.colors.bgElevated2,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}
              >
                <Text variant="caption">{card.set_code}</Text>
              </View>
            )}
            {card.set_number && (
              <View
                style={{
                  backgroundColor: theme.colors.bgElevated2,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}
              >
                <Text variant="mono">{card.set_number}</Text>
              </View>
            )}
            {card.rarity && (
              <View
                style={{
                  backgroundColor: theme.colors.bgElevated2,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}
              >
                <Text variant="caption">{card.rarity}</Text>
              </View>
            )}
            {card.condition && (
              <View
                style={{
                  backgroundColor: theme.colors.bgElevated2,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}
              >
                <Text variant="caption">
                  {CARD_CONDITION_LABELS[card.condition as CardCondition] ?? card.condition}
                </Text>
              </View>
            )}
          </View>

          {card.notes && (
            <Text variant="body" tone="secondary">
              {card.notes}
            </Text>
          )}
        </View>
      </ScrollView>
    </Surface>
  );
}
