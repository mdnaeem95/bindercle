import { type BlockedUser, useBlockedUsers, useToggleBlock } from '@/hooks/useBlockUser';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useAuthStore } from '@/stores/auth';
import { Avatar, Surface, Text, useTheme } from '@foilio/ui';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, ExternalLink } from 'lucide-react-native';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// TODO: replace these with the real hosted URLs before App Store submission.
const TOS_URL = 'https://bindercle.app/terms';
const PRIVACY_URL = 'https://bindercle.app/privacy';
const SUPPORT_URL = 'mailto:support@bindercle.app';

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useDeleteAccount();
  const { data: blocked, isLoading: blockedLoading } = useBlockedUsers();
  const toggleBlock = useToggleBlock();

  const onSignOut = () => {
    Alert.alert('Sign out?', "You'll need to sign in again to see your binders.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/sign-in');
          } catch (e) {
            const err = e as { message?: string };
            Alert.alert("Couldn't sign out", err.message ?? 'Try again.');
          }
        },
      },
    ]);
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This cannot be undone. Your binders, pages, cards, comments, follows — all gone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: () => {
            // Double-confirm — Apple requires the delete action be reversible-feeling-only.
            Alert.alert(
              'Are you sure?',
              "Last chance. Once you tap delete, we can't bring this account back.",
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount.mutateAsync();
                      // Session is now invalid; sign out cleans up local state.
                      await signOut().catch(() => {});
                      router.replace('/sign-in');
                    } catch (e) {
                      const err = e as { message?: string };
                      Alert.alert("Couldn't delete account", err.message ?? 'Try again.');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderSubtle,
            gap: 8,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text variant="heading3">Settings</Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40 + insets.bottom,
            gap: 24,
          }}
        >
          {/* Account */}
          <Section title="Account">
            <Row label="Edit profile" onPress={() => router.push('/profile/edit')} />
          </Section>

          {/* Privacy */}
          <Section title="Privacy">
            <Row
              label={`Blocked accounts${blocked && blocked.length > 0 ? ` (${blocked.length})` : ''}`}
              caption="Manage accounts you've blocked"
            />
            {blockedLoading ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={theme.colors.textTertiary} />
              </View>
            ) : !blocked || blocked.length === 0 ? (
              <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text variant="caption" tone="tertiary">
                  You haven't blocked anyone.
                </Text>
              </View>
            ) : (
              blocked.map((user) => (
                <BlockedUserRow
                  key={user.id}
                  user={user}
                  onUnblock={() =>
                    toggleBlock.mutate({ target_user_id: user.id, currentlyBlocked: true })
                  }
                />
              ))
            )}
          </Section>

          {/* Legal */}
          <Section title="Legal">
            <Row
              label="Terms of Service"
              icon={<ExternalLink size={16} color={theme.colors.textTertiary} strokeWidth={1.8} />}
              onPress={() => Linking.openURL(TOS_URL)}
            />
            <Row
              label="Privacy Policy"
              icon={<ExternalLink size={16} color={theme.colors.textTertiary} strokeWidth={1.8} />}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            />
            <Row
              label="Contact support"
              icon={<ExternalLink size={16} color={theme.colors.textTertiary} strokeWidth={1.8} />}
              onPress={() => Linking.openURL(SUPPORT_URL)}
            />
          </Section>

          {/* Danger zone */}
          <Section title="Danger zone">
            <Row label="Sign out" onPress={onSignOut} destructive />
            <Row
              label="Delete account"
              caption="Permanently remove your account and all data"
              onPress={onDeleteAccount}
              destructive
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text
        variant="caption"
        tone="tertiary"
        style={{ paddingHorizontal: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: theme.colors.bgElevated1,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  caption,
  icon,
  onPress,
  destructive,
}: {
  label: string;
  caption?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: pressed ? theme.colors.bgElevated2 : 'transparent',
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" style={destructive ? { color: theme.semantic.error } : undefined}>
          {label}
        </Text>
        {caption && (
          <Text variant="caption" tone="tertiary">
            {caption}
          </Text>
        )}
      </View>
      {icon ??
        (onPress && <ChevronRight size={16} color={theme.colors.textTertiary} strokeWidth={1.8} />)}
    </Pressable>
  );
}

function BlockedUserRow({ user, onUnblock }: { user: BlockedUser; onUnblock: () => void }) {
  const theme = useTheme();
  const label = user.display_name?.trim() || `@${user.handle}`;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <Avatar source={user.avatar_url} name={label} size={32} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" numberOfLines={1}>
          {label}
        </Text>
        <Text variant="caption" tone="tertiary" numberOfLines={1}>
          @{user.handle}
        </Text>
      </View>
      <Pressable
        onPress={onUnblock}
        hitSlop={6}
        style={({ pressed }) => ({
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 9999,
          borderWidth: 1,
          borderColor: theme.colors.borderDefault,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text variant="caption">Unblock</Text>
      </Pressable>
    </View>
  );
}
