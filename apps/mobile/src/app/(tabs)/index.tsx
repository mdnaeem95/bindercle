import { useBinders } from '@/hooks/useBinders';
import { useBlockedUserIdSet } from '@/hooks/useBlockUser';
import { type DiscoverBinder, useDiscoverBinders } from '@/hooks/useDiscoverBinders';
import { useProfile } from '@/hooks/useProfile';
import { type SavedBinder, useSavedBinders } from '@/hooks/useSavedBinders';
import { useAuthStore } from '@/stores/auth';
import {
  type AccentColor,
  Avatar,
  BinderCard,
  Button,
  ChipGroup,
  Surface,
  Text,
  useTheme,
} from '@foilio/ui';
import { Redirect, router } from 'expo-router';
import { Bookmark, Compass, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'mine' | 'saved' | 'discover';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const status = useAuthStore((s) => s.status);
  const { data: profile } = useProfile();
  const [tab, setTab] = useState<Tab>('mine');

  if (status === 'unauthenticated') {
    return <Redirect href="/sign-in" />;
  }
  // First-run flow — pick a handle, etc — before the user sees the home feed.
  if (profile && !profile.onboarded_at) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header — top-level destinations live in the bottom tab bar now. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 4,
          }}
        >
          <Text variant="heading2">Bindercle</Text>
        </View>

        {/* Tabs */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <ChipGroup
            clearable={false}
            options={[
              { value: 'mine', label: 'Mine' },
              { value: 'saved', label: 'Saved' },
              { value: 'discover', label: 'Discover' },
            ]}
            value={tab}
            onChange={(next) => next && setTab(next)}
          />
        </View>

        {/* Body */}
        {tab === 'mine' ? (
          <MineFeed insetsBottom={insets.bottom} />
        ) : tab === 'saved' ? (
          <SavedFeed insetsBottom={insets.bottom} />
        ) : (
          <DiscoverFeed insetsBottom={insets.bottom} />
        )}
      </SafeAreaView>
    </Surface>
  );
}

function MineFeed({ insetsBottom }: { insetsBottom: number }) {
  const theme = useTheme();
  const { data: binders, isLoading, refetch } = useBinders();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.textTertiary} />
      </View>
    );
  }

  if (!binders || binders.length === 0) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}
      >
        <Sprout size={48} color={theme.colors.textTertiary} strokeWidth={1.6} />
        <Text variant="display2" align="center">
          nothing here yet
        </Text>
        <Text variant="body" tone="secondary" align="center">
          Make a binder of dabbing Pokemon. Or shiny Eevees. Or hat-wearing anybodies. The theme is
          the joke.
        </Text>
        <Button variant="primary" size="md" onPress={() => router.push('/binders/new')}>
          make my first binder
        </Button>
      </View>
    );
  }

  return (
    <FlatList
      data={binders}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 + insetsBottom }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.textTertiary}
        />
      }
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
  );
}

function DiscoverFeed({ insetsBottom }: { insetsBottom: number }) {
  const theme = useTheme();
  const {
    binders: allBinders,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useDiscoverBinders();
  const blockedIds = useBlockedUserIdSet();
  const binders = allBinders.filter((b) => !blockedIds.has(b.owner.id));
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.textTertiary} />
      </View>
    );
  }

  if (binders.length === 0) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}
      >
        <Compass size={48} color={theme.colors.textTertiary} strokeWidth={1.6} />
        <Text variant="display2" align="center">
          Quiet in here
        </Text>
        <Text variant="body" tone="secondary" align="center">
          No public binders yet. Be the first to share one.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={binders}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insetsBottom }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.textTertiary}
        />
      }
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => <DiscoverFeedItem binder={item} />}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator color={theme.colors.textTertiary} />
          </View>
        ) : null
      }
    />
  );
}

function SavedFeed({ insetsBottom }: { insetsBottom: number }) {
  const theme = useTheme();
  const { data: binders, isLoading, refetch } = useSavedBinders();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.textTertiary} />
      </View>
    );
  }

  if (!binders || binders.length === 0) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}
      >
        <Bookmark size={48} color={theme.colors.textTertiary} strokeWidth={1.6} />
        <Text variant="display2" align="center">
          Nothing saved yet
        </Text>
        <Text variant="body" tone="secondary" align="center">
          Tap the bookmark on a public binder to keep it here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={binders}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insetsBottom }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.textTertiary}
        />
      }
      renderItem={({ item }) => <SavedFeedItem binder={item} />}
    />
  );
}

function SavedFeedItem({ binder }: { binder: SavedBinder }) {
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
          gap: 8,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Avatar source={binder.owner.avatar_url} name={ownerLabel} size={20} />
        <Text variant="caption" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {ownerLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function DiscoverFeedItem({ binder }: { binder: DiscoverBinder }) {
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
          gap: 8,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Avatar source={binder.owner.avatar_url} name={ownerLabel} size={20} />
        <Text variant="caption" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {ownerLabel}
        </Text>
      </Pressable>
    </View>
  );
}
