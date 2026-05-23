import { TcgCardSuggestions } from '@/components/TcgCardSuggestions';
import { useCard } from '@/hooks/useCards';
import { useDeleteCard } from '@/hooks/useDeleteCard';
import { useUpdateCard } from '@/hooks/useUpdateCard';
import { mirrorTcgCard } from '@/lib/mirrorTcgCard';
import type { TcgApiCard } from '@/lib/pokemonTcg';
import {
  CARD_CONDITIONS,
  CARD_CONDITION_LABELS,
  type CardFormValues,
  cardFormSchema,
} from '@/lib/validators/card';
import { Button, ChipGroup, Input, Surface, Text, useTheme } from '@foilio/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditCardScreen() {
  const theme = useTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { data: card, isLoading } = useCard(cardId);
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const [tcgCardId, setTcgCardId] = useState<string | null>(null);

  // Sync the TCG link state from the loaded card row
  useEffect(() => {
    setTcgCardId(card?.tcg_card_id ?? null);
  }, [card?.tcg_card_id]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      name: card?.name ?? '',
      set_code: card?.set_code ?? '',
      set_number: card?.set_number ?? '',
      rarity: card?.rarity ?? '',
      condition: (card?.condition as CardFormValues['condition']) ?? undefined,
      notes: card?.notes ?? '',
    },
    values: card
      ? {
          name: card.name,
          set_code: card.set_code ?? '',
          set_number: card.set_number ?? '',
          rarity: card.rarity ?? '',
          condition: (card.condition as CardFormValues['condition']) ?? undefined,
          notes: card.notes ?? '',
        }
      : undefined,
  });

  const nameQuery = watch('name');

  const onPickTcgCard = async (picked: TcgApiCard) => {
    try {
      await mirrorTcgCard(picked);
      setTcgCardId(picked.id);
      setValue('name', picked.name, { shouldDirty: true });
      setValue('set_code', picked.set.id, { shouldDirty: true });
      setValue('set_number', picked.number, { shouldDirty: true });
      if (picked.rarity) setValue('rarity', picked.rarity, { shouldDirty: true });
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not link card', err.message ?? 'Try again.');
    }
  };

  const onSubmit = async (values: CardFormValues) => {
    if (!card) return;
    try {
      await updateCard.mutateAsync({
        id: card.id,
        binder_id: card.binder_id,
        updates: {
          name: values.name,
          set_code: values.set_code?.trim() || null,
          set_number: values.set_number?.trim() || null,
          rarity: values.rarity?.trim() || null,
          condition: values.condition ?? null,
          notes: values.notes?.trim() || null,
          tcg_card_id: tcgCardId,
        },
      });
      router.back();
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not save', err.message ?? 'Try again.');
    }
  };

  const onDelete = () => {
    if (!card) return;
    Alert.alert('Delete card?', `"${card.name}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard.mutateAsync({ id: card.id, binder_id: card.binder_id });
            router.replace(`/binders/${card.binder_id}`);
          } catch (e) {
            const err = e as { message?: string };
            Alert.alert('Could not delete', err.message ?? 'Try again.');
          }
        },
      },
    ]);
  };

  if (isLoading || !card) {
    return (
      <Surface level={0} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary">Loading…</Text>
        </SafeAreaView>
      </Surface>
    );
  }

  const busy = isSubmitting || updateCard.isPending || deleteCard.isPending;

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
            <Text variant="heading3">Edit card</Text>
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
            contentContainerStyle={{ padding: 24, gap: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: 8 }}>
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Name"
                    placeholder="Search Pokemon TCG…"
                    error={errors.name?.message}
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      if (tcgCardId) setTcgCardId(null);
                    }}
                    onBlur={onBlur}
                    maxLength={100}
                  />
                )}
              />

              {tcgCardId ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: theme.colors.bgElevated2,
                    borderWidth: 1,
                    borderColor: theme.colors.borderDefault,
                  }}
                >
                  <Text variant="caption" tone="secondary">
                    ✓ Linked to TCG card · {tcgCardId}
                  </Text>
                  <Pressable onPress={() => setTcgCardId(null)} hitSlop={6}>
                    <Text variant="caption" tone="tertiary">
                      Unlink
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <TcgCardSuggestions query={nameQuery} onSelect={onPickTcgCard} />
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Controller
                control={control}
                name="set_code"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Set"
                      error={errors.set_code?.message}
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                )}
              />
              <Controller
                control={control}
                name="set_number"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Number"
                      error={errors.set_number?.message}
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCorrect={false}
                    />
                  </View>
                )}
              />
            </View>

            <Controller
              control={control}
              name="rarity"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Rarity"
                  hint="Optional"
                  error={errors.rarity?.message}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <Controller
              control={control}
              name="condition"
              render={({ field: { value, onChange } }) => (
                <View style={{ gap: 8 }}>
                  <Text variant="caption" tone="secondary">
                    Condition
                  </Text>
                  <ChipGroup
                    options={CARD_CONDITIONS.map((c) => ({
                      value: c,
                      label: CARD_CONDITION_LABELS[c],
                    }))}
                    value={value}
                    onChange={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Notes"
                  error={errors.notes?.message}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  maxLength={1000}
                  showCharCount
                />
              )}
            />

            <Button variant="destructive" size="md" disabled={busy} onPress={onDelete}>
              Delete card
            </Button>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}
