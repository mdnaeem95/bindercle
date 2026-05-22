import { useProfile } from '@/hooks/useProfile';
import { trackEvent } from '@/lib/observability';
import { useAuthStore } from '@/stores/auth';
import { Avatar, Button, FoilioWordmark, Surface, Text } from '@foilio/ui';
import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const status = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: profile } = useProfile();

  if (status === 'unauthenticated') {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32, padding: 24 }}
      >
        <FoilioWordmark size={72} />
        <Text variant="display2" tone="secondary" align="center">
          your collection, on display
        </Text>

        {profile && (
          <View style={{ alignItems: 'center', gap: 12, marginTop: 16 }}>
            <Avatar
              source={profile.avatar_url}
              name={profile.display_name ?? profile.handle}
              size={72}
            />
            <View style={{ alignItems: 'center', gap: 4 }}>
              {profile.display_name && (
                <Text variant="heading3" align="center">
                  {profile.display_name}
                </Text>
              )}
              <Text variant="body" tone="secondary" align="center">
                @{profile.handle}
              </Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <Button variant="secondary" size="sm" onPress={() => router.push('/profile/edit')}>
            Edit profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              trackEvent('sign_out_tapped');
              signOut();
            }}
          >
            Sign out
          </Button>
        </View>
      </SafeAreaView>
    </Surface>
  );
}
