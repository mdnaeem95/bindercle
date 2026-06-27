import { ReportSheet } from '@/components/ReportSheet';
import { type BinderWithCount, useBinders } from '@/hooks/useBinders';
import { useIsBlocked, useToggleBlock } from '@/hooks/useBlockUser';
import { type PublicBinder, usePublicBindersByUser, useUserProfile } from '@/hooks/useUserProfile';
import { useToggleFollow, useUserSocialStats } from '@/hooks/useUserSocialStats';
import { useAuthStore } from '@/stores/auth';
import { type AccentColor, Avatar, BinderCard, Button, Surface, Text, useTheme } from '@foilio/ui';
import { router } from 'expo-router';
import { ArrowLeft, Link as LinkIcon, MoreHorizontal, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type ProfileBinder = (BinderWithCount | PublicBinder) & { is_public: boolean };

type UserProfileViewProps = {
  /** The user whose profile we're rendering. */
  userId: string | undefined;
  /** Hide the back arrow — appropriate when rendered as a root tab screen. */
  hideBackButton?: boolean;
};

/**
 * Shared profile-screen content used by both the Profile bottom-tab (rendering
 * the signed-in user's profile) and `/users/[id]` (rendering any user's profile).
 *
 * When viewing self, shows ALL binders (incl. private) + an Edit Profile button.
 * When viewing others, shows public binders only + a Follow / Following button.
 */
export function UserProfileView({ userId, hideBackButton }: UserProfileViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const selfId = useAuthStore((s) => s.user?.id);
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: stats } = useUserSocialStats(userId);
  const toggleFollow = useToggleFollow();
  const { data: isBlocked } = useIsBlocked(userId);
  const toggleBlock = useToggleBlock();
  const [reportOpen, setReportOpen] = useState(false);
  const isSelf = !!profile && !!selfId && profile.id === selfId;

  const { data: ownBinders, isLoading: ownLoading } = useBinders();
  const { data: publicBinders, isLoading: publicLoading } = usePublicBindersByUser(
    isSelf ? undefined : userId,
  );
  const binders: ProfileBinder[] | undefined = isSelf ? ownBinders : publicBinders;
  const bindersLoading = isSelf ? ownLoading : publicLoading;

  if (profileLoading || !profile) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.textTertiary} />
        </SafeAreaView>
      </Surface>
    );
  }

  const displayLabel = profile.display_name?.trim() || `@${profile.handle}`;

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
          }}
        >
          {hideBackButton ? (
            <View style={{ width: 20 }} />
          ) : (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
            </Pressable>
          )}
          <Text variant="heading3">@{profile.handle}</Text>
          {isSelf ? (
            <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
              <Settings size={20} color={theme.colors.textPrimary} strokeWidth={1.8} />
            </Pressable>
          ) : (
            <View style={{ width: 20 }} />
          )}
        </View>

        <FlatList
          data={binders ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40 + insets.bottom,
            gap: 12,
          }}
          ListHeaderComponent={
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
              <Avatar
                source={profile.avatar_url}
                name={profile.display_name ?? profile.handle}
                size={88}
              />
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text variant="heading2">{displayLabel}</Text>
                {profile.display_name && (
                  <Text variant="caption" tone="tertiary">
                    @{profile.handle}
                  </Text>
                )}
              </View>

              {/* Stats row */}
              <View style={{ flexDirection: 'row', gap: 24 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    {binders?.length ?? 0}
                  </Text>
                  <Text variant="caption" tone="tertiary">
                    {binders?.length === 1 ? 'binder' : 'binders'}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    {stats?.followerCount ?? 0}
                  </Text>
                  <Text variant="caption" tone="tertiary">
                    {stats?.followerCount === 1 ? 'follower' : 'followers'}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    {stats?.followingCount ?? 0}
                  </Text>
                  <Text variant="caption" tone="tertiary">
                    following
                  </Text>
                </View>
              </View>

              {isSelf ? (
                <Button variant="secondary" size="sm" onPress={() => router.push('/profile/edit')}>
                  Edit profile
                </Button>
              ) : (
                !!selfId && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Button
                      variant={stats?.isFollowing || isBlocked ? 'ghost' : 'primary'}
                      size="sm"
                      loading={toggleFollow.isPending}
                      disabled={isBlocked}
                      onPress={() =>
                        toggleFollow.mutate({
                          user_id: profile.id,
                          currentlyFollowing: !!stats?.isFollowing,
                        })
                      }
                    >
                      {isBlocked ? 'Blocked' : stats?.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Pressable
                      onPress={() => {
                        Alert.alert(
                          profile.display_name?.trim() || `@${profile.handle}`,
                          undefined,
                          [
                            {
                              text: isBlocked ? 'Unblock' : 'Block',
                              style: 'destructive',
                              onPress: () =>
                                toggleBlock.mutate({
                                  target_user_id: profile.id,
                                  currentlyBlocked: !!isBlocked,
                                }),
                            },
                            {
                              text: 'Report',
                              style: 'destructive',
                              onPress: () => setReportOpen(true),
                            },
                            { text: 'Cancel', style: 'cancel' },
                          ],
                        );
                      }}
                      hitSlop={8}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.bgElevated1,
                      }}
                      accessibilityLabel="More actions"
                    >
                      <MoreHorizontal
                        size={16}
                        color={theme.colors.textSecondary}
                        strokeWidth={2}
                      />
                    </Pressable>
                  </View>
                )
              )}

              {profile.bio && (
                <Text
                  variant="body"
                  tone="secondary"
                  align="center"
                  style={{ maxWidth: 320, lineHeight: 22 }}
                >
                  {profile.bio}
                </Text>
              )}
              {profile.link && (
                <Pressable
                  onPress={() => Linking.openURL(profile.link as string)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <LinkIcon size={14} color={theme.colors.textSecondary} strokeWidth={1.8} />
                  <Text variant="caption" tone="secondary">
                    {profile.link}
                  </Text>
                </Pressable>
              )}
            </View>
          }
          ListEmptyComponent={
            bindersLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator color={theme.colors.textTertiary} />
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 32, gap: 6 }}>
                <Text variant="body" tone="secondary">
                  {isSelf ? 'no binders yet.' : 'no public binders yet.'}
                </Text>
                {isSelf ? (
                  <Text variant="caption" tone="tertiary" align="center">
                    the first one's the fun part. start with the cards you'd grab first.
                  </Text>
                ) : null}
              </View>
            )
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
      </SafeAreaView>

      {/* Report sheet — opened from the More-actions menu on others' profiles. */}
      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="user"
        targetId={profile.id}
        targetLabel={`@${profile.handle}`}
      />
    </Surface>
  );
}
