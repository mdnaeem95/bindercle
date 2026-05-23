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

async function uploadToBucket(
  bucket: 'avatars' | 'binder-covers' | 'card-photos',
  path: string,
  localUri: string,
  maxDimension: number,
): Promise<string> {
  const resized = await resizeImage(localUri, maxDimension);
  const response = await fetch(resized.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Upload an avatar image to the `avatars` storage bucket and return its public URL.
 *
 * Path convention: `{userId}/avatar-{timestamp}.jpg` — matches the path-scoped
 * RLS policy in the storage_buckets migration.
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  return uploadToBucket('avatars', `${userId}/avatar-${Date.now()}.jpg`, localUri, 512);
}

/**
 * Upload a binder cover image. Path convention: `{userId}/{binderId}/cover-{timestamp}.jpg`.
 * Pass `tempBinderId` of "new" when uploading before the binder row exists; the caller
 * is responsible for moving / linking the URL.
 */
export async function uploadBinderCover(
  userId: string,
  binderId: string,
  localUri: string,
): Promise<string> {
  return uploadToBucket(
    'binder-covers',
    `${userId}/${binderId}/cover-${Date.now()}.jpg`,
    localUri,
    1200,
  );
}
