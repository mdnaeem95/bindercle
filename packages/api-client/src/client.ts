import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type FoilioClient = SupabaseClient<Database>;

export interface CreateFoilioClientOptions {
  url: string;
  anonKey: string;
  /**
   * AsyncStorage-compatible storage adapter for session persistence.
   * Pass `AsyncStorage` from `@react-native-async-storage/async-storage` on mobile.
   * Omit for tests / SSR contexts.
   */
  // biome-ignore lint/suspicious/noExplicitAny: storage adapter API is duck-typed
  storage?: any;
}

/**
 * Create a typed Supabase client for Foilio.
 *
 * The client is type-aware against the generated Database type, so queries
 * like `client.from('binders').select('*')` get full IntelliSense and
 * compile-time row shape checks.
 */
export function createFoilioClient(opts: CreateFoilioClientOptions): FoilioClient {
  return createClient<Database>(opts.url, opts.anonKey, {
    auth: {
      storage: opts.storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
