import { useBinder } from '@/hooks/useBinder';
import { useCreatePage } from '@/hooks/useCreatePage';
import { BINDER_LAYOUTS, BINDER_LAYOUT_LABELS, type BinderLayout } from '@/lib/validators/binder';
import { type PageFormValues, pageFormSchema } from '@/lib/validators/page';
import { Button, ChipGroup, Input, Surface, Text, useTheme } from '@foilio/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewPageScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id: binderId } = useLocalSearchParams<{ id: string }>();
  const { data: binder } = useBinder(binderId);
  const createPage = useCreatePage();

  const defaultLayout = (binder?.layout_type as BinderLayout) ?? 'grid';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      name: '',
      layout_type: defaultLayout,
    },
    values: {
      name: '',
      layout_type: defaultLayout,
    },
  });

  const onSubmit = async (values: PageFormValues) => {
    if (!binderId) return;
    try {
      const page = await createPage.mutateAsync({
        binder_id: binderId,
        name: values.name?.trim() || null,
        layout_type: values.layout_type,
      });
      router.replace(`/pages/${page.id}`);
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not create page', err.message ?? 'Try again.');
    }
  };

  const busy = isSubmitting || createPage.isPending;

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
            <Text variant="heading3">New Page</Text>
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
                  hint="Optional — name your page if it has a theme"
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
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}
