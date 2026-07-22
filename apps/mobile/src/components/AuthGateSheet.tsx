import { isAppleAuthAvailable } from '@/lib/auth';
import { trackEvent } from '@/lib/observability';
import { useAuthStore } from '@/stores/auth';
import { type AuthIntent, useAuthGate } from '@/stores/authGate';
import { Surface, Text, useTheme } from '@foilio/ui';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Contextual sign-in prompt (w27 Item 1c). Rendered once at the root; opened
 * from anywhere via useAuthGate().requireAuth(intent, action). Copy lands at
 * the moment of intent — "browse to create the want, wall at the want."
 */

type GateCopy = { title: string; subtitle: string };

const COPY: Record<AuthIntent, GateCopy> = {
  like: {
    title: 'like this one?',
    subtitle: 'sign in to show some love — it takes a sec.',
  },
  save: {
    title: 'save this for later?',
    subtitle: "sign in and it'll be right here when you come back.",
  },
  follow: {
    title: 'follow along?',
    subtitle: 'sign in to keep up with what they add.',
  },
  comment: {
    title: 'join the conversation?',
    subtitle: 'sign in to leave a comment.',
  },
  create_binder: {
    title: 'build your own?',
    subtitle: "sign in and make your first binder — this is the part that's actually fun.",
  },
  add_card: {
    title: 'add a card?',
    subtitle: 'sign in to start filling your binder.',
  },
  duplicate_card: {
    title: 'duplicate this card?',
    subtitle: 'sign in to keep building your page.',
  },
  view_profile: {
    title: 'your shelf lives here',
    subtitle: 'sign in to set up your profile and start building binders.',
  },
  view_notifications: {
    title: 'keep up with your collection',
    subtitle: 'sign in to see likes, saves, and new followers.',
  },
};

export function AuthGateSheet() {
  const theme = useTheme();
  const visible = useAuthGate((s) => s.visible);
  const intent = useAuthGate((s) => s.intent);
  const dismiss = useAuthGate((s) => s.dismiss);
  const resume = useAuthGate((s) => s.resume);

  const status = useAuthStore((s) => s.status);
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  // Resume the stashed intent once auth completes. Gating on `visible` ensures
  // we only fire for a gate-initiated sign-in, and running it in an effect (not
  // inline after the await) guarantees the auth store — and every mutation
  // hook's viewerId — has already re-rendered fresh, sidestepping the stale
  // worklet/closure footgun called out in the codebase gotchas.
  useEffect(() => {
    if (visible && status === 'authenticated') {
      resume();
    }
  }, [visible, status, resume]);

  const copy = intent ? COPY[intent] : null;

  const onApple = async () => {
    setBusy('apple');
    trackEvent('sign_in_attempted', { provider: 'apple', trigger: intent });
    try {
      await signInWithApple();
      // Success path resumes via the effect above (status flips to authenticated).
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        trackEvent('sign_in_failed', { provider: 'apple', error_message: err.message ?? null });
        Alert.alert('Sign in failed', err.message ?? 'Try again in a moment.');
      }
    } finally {
      setBusy(null);
    }
  };

  const onGoogle = async () => {
    setBusy('google');
    trackEvent('sign_in_attempted', { provider: 'google', trigger: intent });
    try {
      await signInWithGoogle();
    } catch (e) {
      const err = e as { message?: string };
      if (!err.message?.toLowerCase().includes('cancel')) {
        trackEvent('sign_in_failed', { provider: 'google', error_message: err.message ?? null });
        Alert.alert('Sign in failed', err.message ?? 'Try again in a moment.');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={dismiss}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Surface
            level={1}
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderColor: theme.colors.borderSubtle,
            }}
          >
            <SafeAreaView edges={['bottom']}>
              <View style={{ padding: 24, gap: 20 }}>
                <View style={{ gap: 6 }}>
                  <Text variant="heading2">{copy?.title ?? 'sign in'}</Text>
                  <Text variant="body" tone="secondary">
                    {copy?.subtitle ?? 'sign in to continue.'}
                  </Text>
                </View>

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

                  <Pressable
                    onPress={dismiss}
                    hitSlop={8}
                    style={{ alignItems: 'center', paddingVertical: 8 }}
                  >
                    <Text variant="caption" tone="tertiary">
                      maybe later
                    </Text>
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </Surface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
