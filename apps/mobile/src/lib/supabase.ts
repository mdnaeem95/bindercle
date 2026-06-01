import { createFoilioClient } from '@foilio/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe-default fallbacks ensure createFoilioClient never throws at module
// load even if env vars are missing — that was the original crash mechanism
// (Supabase threw → expo-updates' ErrorRecovery caught → relaunched as native
// NSException abort). The launch-time validateLaunchEnv() gate in _layout.tsx
// prevents the app from rendering when these fallbacks are in play, so the
// bogus client never actually issues a request.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://invalid.local';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'invalid';

/**
 * App-wide Supabase client.
 * Configured for React Native: uses AsyncStorage for session persistence,
 * disables URL-based session detection (no browser redirects in native).
 */
export const supabase = createFoilioClient({ url, anonKey, storage: AsyncStorage });
