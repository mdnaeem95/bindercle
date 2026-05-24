import { TagPicker } from '@/components/TagPicker';
import { useBinder } from '@/hooks/useBinder';
import { useDeleteBinder } from '@/hooks/useDeleteBinder';
import { useUpdateBinder } from '@/hooks/useUpdateBinder';
import { pickImage, uploadBinderCover } from '@/lib/uploads';
import {
  BINDER_LAYOUTS,
  BINDER_LAYOUT_LABELS,
  type BinderFormValues,
  binderFormSchema,
} from '@/lib/validators/binder';
import { useAuthStore } from '@/stores/auth';
import {
  type AccentColor,
  AccentPicker,
  Button,
  ChipGroup,
  Input,
  Surface,
  Text,
  useTheme,
} from '@foilio/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { ImagePlus } from 'lucide-react-native';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditBinderScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: binder, isLoading } = useBinder(id);
  const updateBinder = useUpdateBinder();
  const deleteBinder = useDeleteBinder();
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<BinderFormValues>({
    resolver: zodResolver(binderFormSchema),
    defaultValues: {
      title: binder?.title ?? '',
      description: binder?.description ?? '',
      is_public: binder?.is_public ?? true,
      tags: binder?.tags.map((t) => t.name) ?? [],
      accent_color: (binder?.accent_color as AccentColor | null) ?? undefined,
      layout_type: (binder?.layout_type as BinderFormValues['layout_type']) ?? 'nine_pocket',
    },
    values: binder
      ? {
          title: binder.title,
          description: binder.description ?? '',
          is_public: binder.is_public,
          tags: binder.tags.map((t) => t.name),
          accent_color: (binder.accent_color as AccentColor | null) ?? undefined,
          layout_type: (binder.layout_type as BinderFormValues['layout_type']) ?? 'nine_pocket',
        }
      : undefined,
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
    if (!userId || !binder) return;
    try {
      let coverUrl = binder.cover_image_url;
      if (coverUri) {
        setUploading(true);
        coverUrl = await uploadBinderCover(userId, binder.id, coverUri);
      }
      await updateBinder.mutateAsync({
        id: binder.id,
        updates: {
          title: values.title,
          description: values.description?.trim() || null,
          is_public: values.is_public,
          cover_image_url: coverUrl,
          accent_color: values.accent_color ?? null,
          layout_type: values.layout_type,
        },
        tags: values.tags,
      });
      router.back();
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not save', err.message ?? 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  const onDelete = () => {
    if (!binder) return;
    Alert.alert(
      'Delete binder?',
      `"${binder.title}" and all its cards will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBinder.mutateAsync({ id: binder.id });
              router.replace('/');
            } catch (e) {
              const err = e as { message?: string };
              Alert.alert('Could not delete', err.message ?? 'Try again.');
            }
          },
        },
      ],
    );
  };

  if (isLoading || !binder) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary">Loading…</Text>
        </SafeAreaView>
      </Surface>
    );
  }

  const busy = isSubmitting || updateBinder.isPending || uploading || deleteBinder.isPending;
  const coverPreview = coverUri ?? binder.cover_image_url ?? null;

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
            <Text variant="heading3">Edit Binder</Text>
            <Button
              variant="ghost"
              size="sm"
              disabled={(!isDirty && !coverUri) || busy}
              loading={busy}
              onPress={handleSubmit(onSubmit)}
            >
              Save
            </Button>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 24 + insets.bottom }}
            keyboardShouldPersistTaps="handled"
          >
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
                  borderStyle: coverPreview ? 'solid' : 'dashed',
                  backgroundColor: theme.colors.bgElevated1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {coverPreview ? (
                  <Image
                    source={{ uri: coverPreview }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <ImagePlus size={28} color={theme.colors.textSecondary} strokeWidth={1.6} />
                    <Text variant="body" tone="secondary">
                      Tap to pick a cover
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Title"
                  error={errors.title?.message}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={100}
                />
              )}
            />

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

            <Controller
              control={control}
              name="tags"
              render={({ field: { value, onChange } }) => (
                <TagPicker label="Tags" value={value} onChange={onChange} />
              )}
            />

            <Controller
              control={control}
              name="accent_color"
              render={({ field: { value, onChange } }) => (
                <AccentPicker
                  label="Accent color (optional)"
                  value={value ?? null}
                  onChange={onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="layout_type"
              render={({ field: { value, onChange } }) => (
                <View style={{ gap: 8 }}>
                  <Text variant="caption" tone="secondary">
                    Layout
                  </Text>
                  <ChipGroup
                    clearable={false}
                    options={BINDER_LAYOUTS.map((layout) => ({
                      value: layout,
                      label: BINDER_LAYOUT_LABELS[layout],
                    }))}
                    value={value}
                    onChange={(next) => onChange(next ?? 'nine_pocket')}
                  />
                </View>
              )}
            />

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

            {/* Delete */}
            <Button variant="destructive" size="md" disabled={busy} onPress={onDelete}>
              Delete binder
            </Button>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}
