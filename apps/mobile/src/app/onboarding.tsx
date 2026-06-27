import { useHandleAvailability } from '@/hooks/useHandleAvailability';
import { useProfile } from '@/hooks/useProfile';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { posthog, trackEvent } from '@/lib/observability';
import { pickImage, uploadAvatar } from '@/lib/uploads';
import { type ProfileFormValues, profileFormSchema } from '@/lib/validators/profile';
import { useAuthStore } from '@/stores/auth';
import { Avatar, Button, ChipGroup, Input, Surface, Text, useTheme } from '@foilio/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Self-reported acquisition channels. Values are the analytics-stable
 * identifiers (snake_case, lowercase) and must match the `?src=` values
 * used on bindercle.app so cross-platform attribution joins cleanly in
 * PostHog. Keep this list in sync with the landing-page tagging.
 */
const ACQUISITION_SOURCES = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'friend', label: 'Friend' },
  { value: 'press', label: 'Press' },
  { value: 'other', label: 'Other' },
] as const;

type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number]['value'];

/**
 * First-run flow. Shown when a freshly signed-in user has no
 * `onboarded_at` timestamp yet. They pick a handle and (optionally) a
 * display name, avatar, bio, and acquisition source. "Get started"
 * persists everything and marks them onboarded.
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const status = useAuthStore((s) => s.status);
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [acquisitionSource, setAcquisitionSource] = useState<AcquisitionSource | undefined>(
    undefined,
  );
  // Set the instant onboarding completes so the redirect guard below routes a
  // just-finished first-run user into binder creation (the wedge) instead of
  // the empty feed — without hijacking an already-onboarded manual visitor,
  // who still goes home. Guards against the cache-update re-render racing the
  // imperative router.replace in onSubmit.
  const completedOnboardingRef = useRef(false);

  // ALL hooks must run on every render — if we early-return above useForm /
  // useHandleAvailability, React throws "rendered fewer hooks than expected"
  // the moment onboarded_at flips truthy after submit.
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      handle: profile?.handle ?? '',
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
      link: profile?.link ?? '',
    },
    values: profile
      ? {
          handle: profile.handle,
          display_name: profile.display_name ?? '',
          bio: profile.bio ?? '',
          link: profile.link ?? '',
        }
      : undefined,
  });

  const watchedHandle = watch('handle');
  const availability = useHandleAvailability(watchedHandle);

  // Gates after all hooks: not signed in → sign-in. Already onboarded → home
  // (lets a signed-in user visit /onboarding manually without a loop after save).
  if (status === 'unauthenticated') return <Redirect href="/sign-in" />;
  if (profile?.onboarded_at)
    return <Redirect href={completedOnboardingRef.current ? '/binders/new' : '/'} />;

  const onChangeAvatar = async () => {
    if (!userId) return;
    setAvatarBusy(true);
    try {
      const asset = await pickImage({ aspect: [1, 1] });
      if (!asset) return;
      const publicUrl = await uploadAvatar(userId, asset.uri);
      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      trackEvent('avatar_updated', { during: 'onboarding' });
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert("Couldn't update photo", err.message ?? 'Try again.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({
        handle: values.handle,
        display_name: values.display_name?.trim() || null,
        bio: values.bio?.trim() || null,
        link: values.link?.trim() || null,
        onboarded_at: new Date().toISOString(),
      });
      // Attach acquisition source as a PostHog super-property BEFORE the
      // completion event so the breakdown attaches to every subsequent
      // event (funnel attribution). Skip silently when the user didn't pick
      // a source — "no answer" is a valid signal.
      if (acquisitionSource) {
        posthog?.register({ acquisition_source: acquisitionSource });
        trackEvent('acquisition_source_reported', { source: acquisitionSource });
      }
      trackEvent('onboarding_completed');
      // The wedge: first-run ends in *building*, not the empty feed.
      completedOnboardingRef.current = true;
      router.replace('/binders/new');
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert("Couldn't save", err.message ?? 'Try again.');
    }
  };

  if (isLoading || !profile) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.textTertiary} />
        </SafeAreaView>
      </Surface>
    );
  }

  const canSubmit =
    !isSubmitting &&
    !updateProfile.isPending &&
    availability.status !== 'taken' &&
    availability.status !== 'checking' &&
    availability.status !== 'invalid';

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView
            contentContainerStyle={{
              padding: 24,
              gap: 24,
              paddingBottom: 24 + insets.bottom,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero */}
            <View style={{ gap: 8, marginTop: 8 }}>
              <Text variant="display2">welcome to bindercle.</Text>
              <Text variant="body" tone="secondary">
                this is your shelf. let's make the first page you'd actually want to show off.
              </Text>
            </View>

            {/* Avatar */}
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Pressable onPress={onChangeAvatar} hitSlop={8} disabled={avatarBusy}>
                <Avatar
                  source={profile.avatar_url}
                  name={profile.display_name ?? profile.handle}
                  size={96}
                />
              </Pressable>
              <Pressable onPress={onChangeAvatar} hitSlop={8} disabled={avatarBusy}>
                <Text variant="caption" tone="secondary">
                  {avatarBusy ? 'Uploading…' : profile.avatar_url ? 'Change photo' : 'Add a photo'}
                </Text>
              </Pressable>
            </View>

            {/* Handle */}
            <Controller
              control={control}
              name="handle"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="pick a handle."
                  hint={
                    availability.status === 'available'
                      ? 'Available'
                      : availability.status === 'checking'
                        ? 'Checking…'
                        : "it's how people find your binders later — but for now, they're just for you."
                  }
                  error={
                    errors.handle?.message ??
                    (availability.status === 'taken'
                      ? 'Handle is taken'
                      : availability.status === 'invalid'
                        ? availability.reason
                        : undefined)
                  }
                  value={value}
                  onChangeText={(t) => onChange(t.toLowerCase())}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  leadingAdornment={
                    <Text variant="body" tone="tertiary">
                      @
                    </Text>
                  }
                />
              )}
            />

            {/* Display name */}
            <Controller
              control={control}
              name="display_name"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Display name"
                  hint="Optional — how you'd like your name to appear"
                  error={errors.display_name?.message}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={50}
                />
              )}
            />

            {/* Bio */}
            <Controller
              control={control}
              name="bio"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Bio"
                  hint="a line about what you collect (optional)."
                  error={errors.bio?.message}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  softMaxLength={280}
                  showCharCount
                />
              )}
            />

            {/* Acquisition source — self-reported channel attribution */}
            <View style={{ gap: 8 }}>
              <Text variant="caption" tone="secondary">
                last thing — how'd you find us?
              </Text>
              <Text variant="caption" tone="tertiary">
                helps us know what's working. no wrong answer.
              </Text>
              <ChipGroup
                options={ACQUISITION_SOURCES.map((s) => ({ value: s.value, label: s.label }))}
                value={acquisitionSource}
                onChange={(v) => setAcquisitionSource(v as AcquisitionSource | undefined)}
              />
            </View>

            <Button
              variant="primary"
              size="md"
              disabled={!canSubmit}
              loading={isSubmitting || updateProfile.isPending}
              onPress={handleSubmit(onSubmit)}
            >
              make my first binder
            </Button>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}
