import { TagPicker } from '@/components/TagPicker';
import { useCreateBinder } from '@/hooks/useCreateBinder';
import { supabase } from '@/lib/supabase';
import { pickImage, uploadBinderCover } from '@/lib/uploads';
import { type BinderFormValues, binderFormSchema } from '@/lib/validators/binder';
import { useAuthStore } from '@/stores/auth';
import { Button, Input, Surface, Text, useTheme } from '@foilio/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewBinderScreen() {
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const createBinder = useCreateBinder();
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BinderFormValues>({
    resolver: zodResolver(binderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      is_public: true,
      tags: [],
    },
  });

  const onPickCover = async () => {
    try {
      const asset = await pickImage({ aspect: [3, 4] });
      if (asset) setCoverUri(asset.uri);
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not load image', err.message ?? 'Try again.');
    }
  };

  const onSubmit = async (values: BinderFormValues) => {
    if (!userId) return;
    try {
      const binder = await createBinder.mutateAsync({
        title: values.title,
        description: values.description?.trim() || null,
        is_public: values.is_public,
        tags: values.tags,
      });

      if (coverUri) {
        setUploading(true);
        const url = await uploadBinderCover(userId, binder.id, coverUri);
        await supabase.from('binders').update({ cover_image_url: url }).eq('id', binder.id);
      }

      router.replace(`/binders/${binder.id}`);
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not create binder', err.message ?? 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  const busy = isSubmitting || createBinder.isPending || uploading;

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
            <Text variant="heading3">New binder</Text>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              loading={busy}
              onPress={handleSubmit(onSubmit)}
            >
              Create
            </Button>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 24, gap: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cover */}
            <View style={{ gap: 8 }}>
              <Text variant="caption" tone="secondary">
                Cover
              </Text>
              <Pressable
                onPress={onPickCover}
                style={{
                  aspectRatio: 3 / 4,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.borderDefault,
                  borderStyle: 'dashed',
                  backgroundColor: theme.colors.bgElevated1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {coverUri ? (
                  <Image
                    source={{ uri: coverUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text variant="body" tone="tertiary">
                    Tap to choose a cover
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Title */}
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Title"
                  placeholder="Dabbing Pokemon"
                  error={errors.title?.message}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={100}
                />
              )}
            />

            {/* Description */}
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Description"
                  hint="Optional"
                  error={errors.description?.message}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  maxLength={1000}
                  showCharCount
                />
              )}
            />

            {/* Tags */}
            <Controller
              control={control}
              name="tags"
              render={({ field: { value, onChange } }) => (
                <TagPicker label="Tags" value={value} onChange={onChange} />
              )}
            />

            {/* Visibility */}
            <Controller
              control={control}
              name="is_public"
              render={({ field: { value, onChange } }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.borderSubtle,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text variant="body">Public</Text>
                    <Text variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                      Anyone can discover this binder
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{
                      true: theme.colors.textPrimary,
                      false: theme.colors.bgElevated3,
                    }}
                  />
                </View>
              )}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}
