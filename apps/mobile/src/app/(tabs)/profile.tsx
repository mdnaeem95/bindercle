import { UserProfileView } from '@/components/UserProfileView';
import { useAuthStore } from '@/stores/auth';
import { Surface, Text } from '@foilio/ui';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Profile tab — renders the signed-in user's own profile so the bottom
 * tab bar stays visible. Other users' profiles still route to
 * `/users/[id]` (which sits outside the (tabs) group on purpose, so the
 * back button gives you a way out).
 */
export default function ProfileTab() {
  const status = useAuthStore((s) => s.status);
  const selfId = useAuthStore((s) => s.user?.id);

  if (status === 'unauthenticated') return <Redirect href="/sign-in" />;
  if (!selfId) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary">Loading…</Text>
        </SafeAreaView>
      </Surface>
    );
  }
  return <UserProfileView userId={selfId} hideBackButton />;
}
