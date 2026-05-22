import { useAuthStore } from '@/stores/auth';
import { FoilioWordmark, Surface, Text, useTheme } from '@foilio/ui';
import { Redirect } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const theme = useTheme();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  if (status === 'unauthenticated') {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}
      >
        <FoilioWordmark size={72} />
        <Text variant="display2" tone="secondary" align="center">
          your collection, on display
        </Text>

        {user && (
          <View style={{ alignItems: 'center', gap: 8, marginTop: 24 }}>
            <Text variant="bodySmall" tone="tertiary" align="center">
              Signed in as
            </Text>
            <Text variant="body" tone="primary" align="center">
              {user.email ?? user.id}
            </Text>
          </View>
        )}

        <Pressable
          onPress={signOut}
          style={({ pressed }) => ({
            marginTop: 32,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: theme.colors.borderDefault,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text variant="caption" tone="secondary">
            Sign out
          </Text>
        </Pressable>
      </SafeAreaView>
    </Surface>
  );
}
