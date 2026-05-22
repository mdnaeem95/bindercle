import { createFoilioClient } from '@foilio/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy apps/mobile/.env.example to .env.local and fill in values.',
  );
}

/**
 * App-wide Supabase client.
 * Configured for React Native: uses AsyncStorage for session persistence,
 * disables URL-based session detection (no browser redirects in native).
 */
export const supabase = createFoilioClient({ url, anonKey, storage: AsyncStorage });
