import { useDeletePage } from '@/hooks/useDeletePage';
import { usePage } from '@/hooks/usePages';
import { useUpdatePage } from '@/hooks/useUpdatePage';
import { BINDER_LAYOUTS, BINDER_LAYOUT_LABELS, type BinderLayout } from '@/lib/validators/binder';
import { type PageFormValues, pageFormSchema } from '@/lib/validators/page';
import { Button, ChipGroup, Input, Surface, Text, useTheme } from '@foilio/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditPageScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const { data: page, isLoading } = usePage(pageId);
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      name: page?.name ?? '',
      layout_type: (page?.layout_type as BinderLayout) ?? 'grid',
    },
    values: page
      ? {
          name: page.name ?? '',
          layout_type: (page.layout_type as BinderLayout) ?? 'grid',
        }
      : undefined,
  });

  const onSubmit = async (values: PageFormValues) => {
    if (!page) return;
    try {
      await updatePage.mutateAsync({
        id: page.id,
        binder_id: page.binder_id,
        updates: {
          name: values.name?.trim() || null,
          layout_type: values.layout_type,
        },
      });
      router.back();
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not save', err.message ?? 'Try again.');
    }
  };

  const onDelete = () => {
    if (!page) return;
    Alert.alert('Delete page?', 'All cards on this page will be permanently removed too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePage.mutateAsync({ id: page.id, binder_id: page.binder_id });
            router.replace(`/binders/${page.binder_id}`);
          } catch (e) {
            const err = e as { message?: string };
            Alert.alert('Could not delete', err.message ?? 'Try again.');
          }
        },
      },
    ]);
  };

  if (isLoading || !page) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary">Loading…</Text>
        </SafeAreaView>
      </Surface>
    );
  }

  const busy = isSubmitting || updatePage.isPending || deletePage.isPending;

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
            <Text variant="heading3">Edit Page</Text>
            <Button
              variant="ghost"
              size="sm"
              disabled={!isDirty || busy}
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
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Page name"
                  placeholder="Leave blank for 'Page N'"
                  hint="Optional — something cute like 'Hat Pokemon' or 'Promos'"
                  error={errors.name?.message}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={60}
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
                    onChange={(next) => onChange(next ?? 'grid')}
                  />
                </View>
              )}
            />

            <Button variant="destructive" size="md" disabled={busy} onPress={onDelete}>
              Delete page
            </Button>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}
