import { useBinder } from '@/hooks/useBinder';
import { useCardsForBinder } from '@/hooks/useCards';
import { Button, CardThumbnail, Surface, Text, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BinderDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: binder, isLoading } = useBinder(id);
  const { data: cards } = useCardsForBinder(id);

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

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Cover hero */}
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
            <Text variant="heading1">{binder.title}</Text>
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
                Add card
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
                <Text variant="body" tone="secondary" align="center">
                  No cards yet
                </Text>
                <Text variant="caption" tone="tertiary" align="center">
                  Tap “Add card” to upload your first.
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(cards ?? []).map((card) => (
                  <View key={card.id} style={{ width: '31.5%' }}>
                    <CardThumbnail
                      name={card.name}
                      photoUrl={card.photos[0]?.url ?? null}
                      photoCount={card.photos.length}
                      onPress={() => router.push(`/cards/${card.id}`)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </Surface>
  );
}
