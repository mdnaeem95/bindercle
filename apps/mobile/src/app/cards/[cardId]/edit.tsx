import { TcgCardSuggestions } from '@/components/TcgCardSuggestions';
import { cardQueryKey, cardsForPageQueryKey, useCard } from '@/hooks/useCards';
import { useDeleteCard } from '@/hooks/useDeleteCard';
import { useUpdateCard } from '@/hooks/useUpdateCard';
import { mirrorTcgCard } from '@/lib/mirrorTcgCard';
import { type TcgApiCard, getTcgCardById } from '@/lib/pokemonTcg';
import { supabase } from '@/lib/supabase';
import { pickImages, takePhoto, uploadCardPhoto } from '@/lib/uploads';
import {
  CARD_CONDITIONS,
  CARD_CONDITION_LABELS,
  type CardFormValues,
  cardFormSchema,
} from '@/lib/validators/card';
import { useAuthStore } from '@/stores/auth';
import { Button, ChipGroup, Input, Surface, Text, useTheme } from '@foilio/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActionSheetIOS,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const PHOTO_LIMIT = 6;

export default function EditCardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { data: card, isLoading } = useCard(cardId);
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.id);
  const [tcgCardId, setTcgCardId] = useState<string | null>(null);
  const [tcgCardArt, setTcgCardArt] = useState<string | null>(null);
  /** IDs of existing card_photos rows to remove on save. */
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  /** Local image URIs picked since the screen opened — uploaded on save. */
  const [newPhotoUris, setNewPhotoUris] = useState<string[]>([]);

  // Sync the TCG link state from the loaded card row
  useEffect(() => {
    setTcgCardId(card?.tcg_card_id ?? null);
    setTcgCardArt(card?.tcg_card?.image_small ?? null);
  }, [card?.tcg_card_id, card?.tcg_card?.image_small]);

  const existingPhotos = (card?.photos ?? []).filter((p) => !removedPhotoIds.includes(p.id));
  const totalPhotoCount = existingPhotos.length + newPhotoUris.length;
  const canAddPhoto = totalPhotoCount < PHOTO_LIMIT;
  const photosDirty = removedPhotoIds.length > 0 || newPhotoUris.length > 0;

  const onAddPhoto = () => {
    const options = ['Choose from library', 'Take photo', 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 2 }, async (idx) => {
      try {
        if (idx === 0) {
          const remaining = PHOTO_LIMIT - totalPhotoCount;
          const picked = await pickImages(remaining);
          setNewPhotoUris((c) => [...c, ...picked.map((p) => p.uri)].slice(0, PHOTO_LIMIT));
        } else if (idx === 1) {
          const taken = await takePhoto();
          if (taken) setNewPhotoUris((c) => [...c, taken.uri].slice(0, PHOTO_LIMIT));
        }
      } catch (e) {
        const err = e as { message?: string };
        Alert.alert('Could not add photo', err.message ?? 'Try again.');
      }
    });
  };

  const removeExistingPhoto = (photoId: string) => {
    setRemovedPhotoIds((c) => [...c, photoId]);
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotoUris((c) => c.filter((_, i) => i !== index));
  };

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
      caption: card?.caption ?? '',
      set_code: card?.set_code ?? '',
      set_number: card?.set_number ?? '',
      rarity: card?.rarity ?? '',
      condition: (card?.condition as CardFormValues['condition']) ?? undefined,
      notes: card?.notes ?? '',
    },
    values: card
      ? {
          name: card.name,
          caption: card.caption ?? '',
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
      const full = (await getTcgCardById(picked.id)) ?? picked;

      await mirrorTcgCard(full);
      setTcgCardId(full.id);
      setTcgCardArt(full.images?.small ?? null);
      setValue('name', full.name, { shouldDirty: true });
      setValue('set_code', full.set.name || full.set.id, { shouldDirty: true });
      setValue('set_number', full.number, { shouldDirty: true });
      if (full.rarity) setValue('rarity', full.rarity, { shouldDirty: true });
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not link card', err.message ?? 'Try again.');
    }
  };

  const onSubmit = async (values: CardFormValues) => {
    if (!card || !viewerId) return;
    try {
      await updateCard.mutateAsync({
        id: card.id,
        binder_id: card.binder_id,
        updates: {
          name: values.name,
          caption: values.caption?.trim() || null,
          set_code: values.set_code?.trim() || null,
          set_number: values.set_number?.trim() || null,
          rarity: values.rarity?.trim() || null,
          condition: values.condition ?? null,
          notes: values.notes?.trim() || null,
          tcg_card_id: tcgCardId,
        },
      });

      // Sync photos: delete the ones marked for removal, then upload + insert new ones
      // at the end of the order.
      if (removedPhotoIds.length > 0) {
        const { error } = await supabase.from('card_photos').delete().in('id', removedPhotoIds);
        if (error) throw error;
      }
      if (newPhotoUris.length > 0) {
        const startIndex = existingPhotos.length;
        const rows: { card_id: string; url: string; order_index: number }[] = [];
        for (let i = 0; i < newPhotoUris.length; i++) {
          const uri = newPhotoUris[i];
          if (!uri) continue;
          const url = await uploadCardPhoto(viewerId, card.id, startIndex + i, uri);
          rows.push({ card_id: card.id, url, order_index: startIndex + i });
        }
        if (rows.length > 0) {
          const { error } = await supabase.from('card_photos').insert(rows);
          if (error) throw error;
        }
      }
      if (photosDirty) {
        queryClient.invalidateQueries({ queryKey: cardQueryKey(card.id) });
        if (card.page_id) {
          queryClient.invalidateQueries({ queryKey: cardsForPageQueryKey(card.page_id) });
        }
      }

      router.back();
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not save', err.message ?? 'Try again.');
    }
  };

  const onMove = () => {
    if (!card) return;
    if (isDirty || photosDirty) {
      Alert.alert('Save your changes first', 'Hit Save before moving to another page.');
      return;
    }
    router.push(`/cards/${card.id}/move`);
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
            await deleteCard.mutateAsync({
              id: card.id,
              binder_id: card.binder_id,
              page_id: card.page_id ?? undefined,
            });
            // Pop both the edit screen AND the card-detail beneath it so a swipe-back
            // can't land on the deleted card. Falls back to replace if the stack is
            // shallower than expected (e.g. deep-linked into edit).
            if (router.canDismiss() && card.page_id) {
              router.dismiss(2);
            } else if (card.page_id) {
              router.replace(`/pages/${card.page_id}`);
            } else {
              router.replace(`/binders/${card.binder_id}`);
            }
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
            <Text variant="heading3">Edit Card</Text>
            <Button
              variant="ghost"
              size="sm"
              disabled={(!isDirty && !photosDirty) || busy}
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
            {/* Photos */}
            <View style={{ gap: 8 }}>
              <Text variant="caption" tone="secondary">
                Photos ({totalPhotoCount}/{PHOTO_LIMIT})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {existingPhotos.map((photo) => (
                  <View key={photo.id} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: photo.url }}
                      style={{
                        width: 100,
                        height: 140,
                        borderRadius: 8,
                        backgroundColor: theme.colors.bgElevated1,
                      }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => removeExistingPhoto(photo.id)}
                      hitSlop={6}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'rgba(10,10,15,0.7)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text variant="caption" style={{ color: '#F8F8F2' }}>
                        ×
                      </Text>
                    </Pressable>
                  </View>
                ))}
                {newPhotoUris.map((uri, index) => (
                  <View key={uri} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri }}
                      style={{
                        width: 100,
                        height: 140,
                        borderRadius: 8,
                        backgroundColor: theme.colors.bgElevated1,
                      }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => removeNewPhoto(index)}
                      hitSlop={6}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'rgba(10,10,15,0.7)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text variant="caption" style={{ color: '#F8F8F2' }}>
                        ×
                      </Text>
                    </Pressable>
                  </View>
                ))}
                {canAddPhoto && (
                  <Pressable
                    onPress={onAddPhoto}
                    style={{
                      width: 100,
                      height: 140,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: theme.colors.borderDefault,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.bgElevated1,
                    }}
                  >
                    <Text variant="display2" tone="tertiary">
                      +
                    </Text>
                    <Text variant="caption" tone="tertiary">
                      Add
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>

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
                    gap: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: theme.colors.bgElevated2,
                    borderWidth: 1,
                    borderColor: theme.colors.borderDefault,
                  }}
                >
                  {tcgCardArt && (
                    <Image
                      source={{ uri: tcgCardArt }}
                      style={{
                        width: 36,
                        height: 50,
                        borderRadius: 4,
                        backgroundColor: theme.colors.bgElevated3,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                      <Text variant="caption" tone="secondary">
                        Linked to TCG card
                      </Text>
                    </View>
                    <Text variant="caption" tone="tertiary" numberOfLines={2}>
                      {(card?.photos.length ?? 0) === 0
                        ? 'Official art will display until you add your own.'
                        : 'Your photos will be shown.'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setTcgCardId(null);
                      setTcgCardArt(null);
                    }}
                    hitSlop={6}
                  >
                    <Text variant="caption" tone="tertiary">
                      Unlink
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <TcgCardSuggestions query={nameQuery} onSelect={onPickTcgCard} />
              )}
            </View>

            <Controller
              control={control}
              name="caption"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Caption"
                  placeholder="A line of story for this card…"
                  hint="One sentence. The cute lives here."
                  error={errors.caption?.message}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={140}
                  showCharCount
                />
              )}
            />

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

            <Button variant="secondary" size="md" disabled={busy} onPress={onMove}>
              Move to Page…
            </Button>

            <Button variant="destructive" size="md" disabled={busy} onPress={onDelete}>
              Delete card
            </Button>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}
