import { CardLayout } from '@/components/CardLayout';
import { useBinder } from '@/hooks/useBinder';
import { useCardsForPage } from '@/hooks/useCards';
import { usePage } from '@/hooks/usePages';
import type { BinderLayout } from '@/lib/validators/binder';
import { type AccentColor, Button, Surface, Text, accentSolid, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PageDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const { data: page, isLoading: pageLoading } = usePage(pageId);
  const { data: binder } = useBinder(page?.binder_id);
  const { data: cards } = useCardsForPage(pageId);

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

  return (
    <Surface level={0} style={{ flex: 1 }}>
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
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text variant="body" tone="secondary">
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
          <Pressable onPress={() => router.push(`/pages/${page.id}/edit`)} hitSlop={12}>
            <Text variant="body" tone="secondary">
              Edit
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 48 + insets.bottom,
            gap: 12,
          }}
        >
          {/* Add-card button */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
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
      </SafeAreaView>
    </Surface>
  );
}
