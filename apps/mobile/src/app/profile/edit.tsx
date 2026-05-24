import { useHandleAvailability } from '@/hooks/useHandleAvailability';
import { useProfile } from '@/hooks/useProfile';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { trackEvent } from '@/lib/observability';
import { pickImage, uploadAvatar } from '@/lib/uploads';
import { type ProfileFormValues, profileFormSchema } from '@/lib/validators/profile';
import { useAuthStore } from '@/stores/auth';
import { Avatar, Button, Input, Surface, Text, useTheme } from '@foilio/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [avatarBusy, setAvatarBusy] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitting },
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

  const onChangeAvatar = async () => {
    if (!userId) return;
    setAvatarBusy(true);
    try {
      const asset = await pickImage({ aspect: [1, 1] });
      if (!asset) return;
      const publicUrl = await uploadAvatar(userId, asset.uri);
      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      trackEvent('avatar_updated');
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not update avatar', err.message ?? 'Try again in a moment.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (availability.status === 'taken') {
      Alert.alert('Handle taken', 'Try a different one.');
      return;
    }
    try {
      await updateProfile.mutateAsync({
        handle: values.handle,
        display_name: values.display_name?.trim() || null,
        bio: values.bio?.trim() || null,
        link: values.link?.trim() || null,
      });
      router.back();
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Save failed', err.message ?? 'Try again in a moment.');
    }
  };

  if (isLoading || !profile) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary">Loading…</Text>
        </SafeAreaView>
      </Surface>
    );
  }

  const handleSaveDisabled =
    !isDirty ||
    isSubmitting ||
    updateProfile.isPending ||
    availability.status === 'taken' ||
    availability.status === 'checking' ||
    availability.status === 'invalid';

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
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
              <Text variant="body" tone="secondary">
                Cancel
              </Text>
            </Pressable>
            <Text variant="heading3">Edit Profile</Text>
            <Button
              variant="ghost"
              size="sm"
              disabled={handleSaveDisabled}
              loading={isSubmitting || updateProfile.isPending}
              onPress={handleSubmit(onSubmit)}
            >
              Save
            </Button>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 24 + insets.bottom }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar */}
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Pressable onPress={onChangeAvatar} disabled={avatarBusy}>
                <Avatar
                  source={profile.avatar_url}
                  name={profile.display_name ?? profile.handle}
                  size={96}
                />
              </Pressable>
              <Pressable onPress={onChangeAvatar} disabled={avatarBusy} hitSlop={8}>
                <Text variant="bodySmall" tone="secondary">
                  {avatarBusy ? 'Uploading…' : 'Change photo'}
                </Text>
              </Pressable>
            </View>

            {/* Handle */}
            <Controller
              control={control}
              name="handle"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Handle"
                  hint={
                    availability.status === 'available'
                      ? 'Available'
                      : availability.status === 'checking'
                        ? 'Checking…'
                        : 'Lowercase letters, numbers, underscores'
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
                  onChangeText={(text) => onChange(text.toLowerCase())}
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
                  hint="What people see"
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

            {/* Link */}
            <Controller
              control={control}
              name="link"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Link"
                  hint="Twitter, TikTok, your portfolio…"
                  error={errors.link?.message}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              )}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}
