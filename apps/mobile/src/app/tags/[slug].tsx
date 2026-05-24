import { type TaggedBinder, useBindersByTag, useTagBySlug } from '@/hooks/useBindersByTag';
import { type AccentColor, Avatar, BinderCard, Surface, Text, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Hash } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TagBindersScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: tag } = useTagBySlug(slug);
  const { data: binders, isLoading } = useBindersByTag(slug);

  const headerLabel = tag?.name ?? slug ?? '';

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderSubtle,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Hash size={18} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text variant="heading3" numberOfLines={1}>
              {headerLabel}
            </Text>
          </View>
          <View style={{ width: 20 }} />
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={theme.colors.textTertiary} />
          </View>
        ) : !binders || binders.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 12,
            }}
          >
            <Hash size={48} color={theme.colors.textTertiary} strokeWidth={1.6} />
            <Text variant="display2" align="center">
              Quiet on this tag
            </Text>
            <Text variant="body" tone="secondary" align="center">
              No public binders tagged "{headerLabel}" yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={binders}
            keyExtractor={(b) => b.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{
              padding: 16,
              gap: 16,
              paddingBottom: 40 + insets.bottom,
            }}
            renderItem={({ item }) => <TaggedBinderItem binder={item} />}
          />
        )}
      </SafeAreaView>
    </Surface>
  );
}

function TaggedBinderItem({ binder }: { binder: TaggedBinder }) {
  const ownerLabel = binder.owner.display_name?.trim() || `@${binder.owner.handle}`;
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <BinderCard
        title={binder.title}
        cardCount={binder.card_count}
        coverImageUrl={binder.cover_image_url}
        accent={(binder.accent_color as AccentColor | null) ?? null}
        onPress={() => router.push(`/binders/${binder.id}`)}
      />
      <Pressable
        onPress={() => router.push(`/users/${binder.owner.id}`)}
        hitSlop={6}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Avatar source={binder.owner.avatar_url} name={ownerLabel} size={18} />
        <Text variant="caption" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {ownerLabel}
        </Text>
      </Pressable>
    </View>
  );
}
