import { useBlockedUserIdSet } from '@/hooks/useBlockUser';
import {
  type NotificationWithRefs,
  useMarkAllNotificationsRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { Avatar, Surface, Text, useTheme } from '@foilio/ui';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Bookmark, Heart, MessageCircle, UserPlus } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: rawNotifications, isLoading } = useNotifications();
  const blockedIds = useBlockedUserIdSet();
  const notifications = rawNotifications?.filter((n) => !blockedIds.has(n.actor.id));
  const markAllRead = useMarkAllNotificationsRead();

  // Mark everything as read on visit. Async + idempotent — safe to fire once.
  // biome-ignore lint/correctness/useExhaustiveDependencies: markAllRead.mutate is a stable bound method; including it would only loop.
  useEffect(() => {
    if ((notifications ?? []).some((n) => !n.read_at)) {
      markAllRead.mutate();
    }
  }, [notifications]);

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
            <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text variant="heading3">Notifications</Text>
          <View style={{ width: 20 }} />
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={theme.colors.textTertiary} />
          </View>
        ) : !notifications || notifications.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 12,
            }}
          >
            <Bell size={48} color={theme.colors.textTertiary} strokeWidth={1.6} />
            <Text variant="display2" align="center">
              nothing here yet.
            </Text>
            <Text variant="body" tone="secondary" align="center">
              follows, likes, and saves will show up as people find your binders.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            renderItem={({ item }) => <NotificationRow notification={item} />}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.colors.borderSubtle,
                  marginLeft: 64,
                }}
              />
            )}
          />
        )}
      </SafeAreaView>
    </Surface>
  );
}

function NotificationRow({ notification }: { notification: NotificationWithRefs }) {
  const theme = useTheme();
  const actorLabel = notification.actor.display_name?.trim() || `@${notification.actor.handle}`;
  const unread = !notification.read_at;

  const onPress = () => {
    if (notification.type === 'follow') {
      router.push(`/users/${notification.actor.id}`);
    } else if (notification.type === 'comment' && notification.binder_id) {
      router.push(`/binders/${notification.binder_id}/comments`);
    } else if (notification.binder_id) {
      router.push(`/binders/${notification.binder_id}`);
    }
  };

  const action =
    notification.type === 'like'
      ? 'liked'
      : notification.type === 'save'
        ? 'saved'
        : notification.type === 'comment'
          ? 'commented on'
          : 'followed you';

  const Icon =
    notification.type === 'like'
      ? Heart
      : notification.type === 'save'
        ? Bookmark
        : notification.type === 'comment'
          ? MessageCircle
          : UserPlus;
  const iconColor =
    notification.type === 'like'
      ? '#FF7A8A'
      : notification.type === 'save'
        ? theme.colors.textPrimary
        : notification.type === 'comment'
          ? '#7AC7A1'
          : '#7AAEFF';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: unread
          ? theme.colors.bgElevated1
          : pressed
            ? theme.colors.bgElevated1
            : 'transparent',
      })}
    >
      <View style={{ position: 'relative' }}>
        <Avatar source={notification.actor.avatar_url} name={actorLabel} size={40} />
        <View
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.bgBase,
            borderWidth: 1,
            borderColor: theme.colors.borderSubtle,
          }}
        >
          <Icon
            size={12}
            color={iconColor}
            strokeWidth={2}
            fill={
              notification.type === 'like' || notification.type === 'save'
                ? iconColor
                : 'transparent'
            }
          />
        </View>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" numberOfLines={2}>
          <Text variant="body" style={{ fontWeight: '600' }}>
            {actorLabel}
          </Text>{' '}
          {action}
          {notification.binder ? (
            <>
              {' '}
              <Text variant="body" style={{ fontWeight: '600' }}>
                {notification.binder.title}
              </Text>
            </>
          ) : null}
        </Text>
        <Text variant="caption" tone="tertiary">
          {timeAgo(notification.created_at)}
        </Text>
      </View>

      {notification.binder?.cover_image_url && (
        <Image
          source={{ uri: notification.binder.cover_image_url }}
          style={{
            width: 44,
            height: 56,
            borderRadius: 8,
            backgroundColor: theme.colors.bgElevated1,
          }}
          resizeMode="cover"
        />
      )}
    </Pressable>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}
