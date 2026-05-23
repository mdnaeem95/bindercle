import { useBinders } from '@/hooks/useBinders';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/stores/auth';
import { type AccentColor, Avatar, BinderCard, Button, Surface, Text, useTheme } from '@foilio/ui';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const status = useAuthStore((s) => s.status);
  const { data: profile } = useProfile();
  const { data: binders, isLoading } = useBinders();

  if (status === 'unauthenticated') {
    return <Redirect href="/sign-in" />;
  }

  const renderEmptyState = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}>
      <Text variant="display2" align="center">
        nothing here yet 🌱
      </Text>
      <Text variant="body" tone="secondary" align="center">
        Make a binder of dabbing Pokemon. Or shiny Eevees. Or hat-wearing anybodies. The theme is
        the joke.
      </Text>
      <Button variant="primary" size="md" onPress={() => router.push('/binders/new')}>
        Make my first binder
      </Button>
    </View>
  );

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
          }}
        >
          <Pressable onPress={() => router.push('/profile/edit')} hitSlop={8}>
            <Avatar
              source={profile?.avatar_url}
              name={profile?.display_name ?? profile?.handle}
              size={36}
            />
          </Pressable>
          <Text variant="heading2">my binders</Text>
          <Pressable
            onPress={() => router.push('/binders/new')}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.colors.textPrimary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="heading3" style={{ color: theme.colors.bgBase }}>
              +
            </Text>
          </Pressable>
        </View>

        {/* Body */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={theme.colors.textTertiary} />
          </View>
        ) : !binders || binders.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={binders}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 + insets.bottom }}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <BinderCard
                  title={item.title}
                  cardCount={item.card_count}
                  coverImageUrl={item.cover_image_url}
                  isPublic={item.is_public}
                  accent={(item.accent_color as AccentColor | null) ?? null}
                  onPress={() => router.push(`/binders/${item.id}`)}
                />
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Surface>
  );
}
