import { useCreateCard } from '@/hooks/useCreateCard';
import { pickImages, takePhoto } from '@/lib/uploads';
import {
  CARD_CONDITIONS,
  CARD_CONDITION_LABELS,
  type CardFormValues,
  cardFormSchema,
} from '@/lib/validators/card';
import { Button, ChipGroup, Input, Surface, Text, useTheme } from '@foilio/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

const PHOTO_LIMIT = 6;

export default function NewCardScreen() {
  const theme = useTheme();
  const { id: binderId } = useLocalSearchParams<{ id: string }>();
  const createCard = useCreateCard();
  const [photos, setPhotos] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      name: '',
      set_code: '',
      set_number: '',
      rarity: '',
      condition: undefined,
      notes: '',
    },
  });

  const canAddPhoto = photos.length < PHOTO_LIMIT;

  const addFromLibrary = async () => {
    try {
      const remaining = PHOTO_LIMIT - photos.length;
      const picked = await pickImages(remaining);
      if (picked.length === 0) return;
      setPhotos((current) => [...current, ...picked.map((p) => p.uri)].slice(0, PHOTO_LIMIT));
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not load photos', err.message ?? 'Try again.');
    }
  };

  const addFromCamera = async () => {
    try {
      const taken = await takePhoto();
      if (!taken) return;
      setPhotos((current) => [...current, taken.uri].slice(0, PHOTO_LIMIT));
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not open camera', err.message ?? 'Try again.');
    }
  };

  const onAddPhoto = () => {
    if (!canAddPhoto) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Camera', 'Photo Library', 'Cancel'],
          cancelButtonIndex: 2,
          userInterfaceStyle: 'dark',
        },
        (selectedIndex) => {
          if (selectedIndex === 0) addFromCamera();
          else if (selectedIndex === 1) addFromLibrary();
        },
      );
    } else {
      // Simple two-button alert on Android for now; replace with a proper sheet later.
      Alert.alert('Add photo', undefined, [
        { text: 'Camera', onPress: addFromCamera },
        { text: 'Library', onPress: addFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: CardFormValues) => {
    if (!binderId) return;
    try {
      const card = await createCard.mutateAsync({
        binder_id: binderId,
        name: values.name,
        set_code: values.set_code?.trim() || null,
        set_number: values.set_number?.trim() || null,
        rarity: values.rarity?.trim() || null,
        condition: values.condition ?? null,
        notes: values.notes?.trim() || null,
        photo_uris: photos,
      });
      router.replace(`/cards/${card.id}`);
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert('Could not save card', err.message ?? 'Try again.');
    }
  };

  const busy = isSubmitting || createCard.isPending;

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
            <Text variant="heading3">Add a card</Text>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
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
            {/* Photos */}
            <View style={{ gap: 8 }}>
              <Text variant="caption" tone="secondary">
                Photos ({photos.length}/{PHOTO_LIMIT})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {photos.map((uri, index) => (
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
                      onPress={() => removePhoto(index)}
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

            {/* Name */}
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Name"
                  placeholder="Charizard"
                  error={errors.name?.message}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={100}
                />
              )}
            />

            {/* Set code + number — side by side */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Controller
                control={control}
                name="set_code"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Set"
                      placeholder="Base"
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
                      placeholder="4/102"
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

            {/* Rarity */}
            <Controller
              control={control}
              name="rarity"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Rarity"
                  placeholder="Holo Rare"
                  hint="Optional"
                  error={errors.rarity?.message}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            {/* Condition */}
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

            {/* Notes */}
            <Controller
              control={control}
              name="notes"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Notes"
                  hint="Where you pulled it, condition details, anything memorable"
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
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}
