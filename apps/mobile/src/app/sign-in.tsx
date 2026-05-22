import { isAppleAuthAvailable } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth';
import { FoilioWordmark, Surface, Text, useTheme } from '@foilio/ui';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const theme = useTheme();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);

  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  const onApple = async () => {
    setBusy('apple');
    try {
      await signInWithApple();
    } catch (e) {
      const err = e as { code?: string; message?: string };
      // ERR_REQUEST_CANCELED is fired when the user dismisses the sheet — not a real error
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', err.message ?? 'Try again in a moment.');
      }
    } finally {
      setBusy(null);
    }
  };

  const onGoogle = async () => {
    setBusy('google');
    try {
      await signInWithGoogle();
    } catch (e) {
      const err = e as { message?: string };
      // Browser dismissed errors include "cancel" — silent
      if (!err.message?.toLowerCase().includes('cancel')) {
        Alert.alert('Sign in failed', err.message ?? 'Try again in a moment.');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', padding: 24 }}>
        {/* Hero */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <FoilioWordmark size={64} />
          <Text variant="display2" tone="secondary" align="center">
            your collection, on display
          </Text>
        </View>

        {/* Auth actions */}
        <View style={{ gap: 12 }}>
          {Platform.OS === 'ios' && appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={12}
              style={{ height: 52, opacity: busy === 'apple' ? 0.6 : 1 }}
              onPress={onApple}
            />
          )}

          <Pressable
            onPress={onGoogle}
            disabled={busy !== null}
            style={({ pressed }) => ({
              height: 52,
              borderRadius: 12,
              backgroundColor: theme.colors.bgElevated2,
              borderWidth: 1,
              borderColor: theme.colors.borderDefault,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || busy === 'google' ? 0.6 : 1,
            })}
          >
            {busy === 'google' ? (
              <ActivityIndicator color={theme.colors.textPrimary} />
            ) : (
              <Text variant="bodyLarge" tone="primary">
                Continue with Google
              </Text>
            )}
          </Pressable>

          <Text variant="caption" tone="tertiary" align="center" style={{ marginTop: 8 }}>
            By continuing, you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </Surface>
  );
}
