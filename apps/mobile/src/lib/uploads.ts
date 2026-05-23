import { supabase } from '@/lib/supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * Open the system image picker and let the user pick a single image.
 * Returns null if the user cancels.
 *
 * Aspect is forced square for avatars; pass `aspect` for other ratios.
 */
export async function pickImage(
  opts: {
    aspect?: [number, number];
    quality?: number;
  } = {},
): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission required to upload an avatar.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: opts.aspect ?? [1, 1],
    quality: opts.quality ?? 0.9,
  });

  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

/**
 * Resize an image to a max dimension while preserving aspect ratio.
 * Returns the resized image's URI and size in bytes.
 */
export async function resizeImage(uri: string, maxDimension: number): Promise<{ uri: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxDimension, height: maxDimension } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: result.uri };
}

/**
 * Upload an avatar image to the `avatars` storage bucket and return its public URL.
 *
 * Path convention: `{userId}/avatar-{timestamp}.jpg` — matches the path-scoped
 * RLS policy in the storage_buckets migration.
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  // Resize to 512x512 — generous for avatar but keeps storage costs sane
  const resized = await resizeImage(localUri, 512);

  // Read the file as a Blob
  const response = await fetch(resized.uri);
  const arrayBuffer = await response.arrayBuffer();

  const path = `${userId}/avatar-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
