/**
 * Launch-time environment validation.
 *
 * History: build 12 crashed on launch because EXPO_PUBLIC_* values weren't
 * being baked into the JS bundle. Supabase's createClient(undefined, undefined)
 * threw at module load; expo-updates' ErrorRecovery caught it and re-threw as
 * the launch abort users saw. Fixed in eas.json (commit fbb9917), but the only
 * thing standing between us and a repeat is `eas.json` being correct.
 *
 * This module is the guard. Call validateLaunchEnv() once before anything
 * else runs (Sentry, PostHog, Supabase). If it returns invalid, the app
 * should render ConfigurationErrorScreen instead of attempting to boot.
 *
 * IMPORTANT: this file must not import from any module that depends on env
 * vars (Sentry, observability, Supabase, theme). It needs to be safe to load
 * even when literally nothing else is configured.
 */

/**
 * Each entry MUST access process.env via direct dot notation with a literal
 * key, because Metro / Babel's expo-router plugin only inlines EXPO_PUBLIC_*
 * accesses when the key is a static literal. Using bracket notation with a
 * variable (e.g. `process.env[key]` inside a loop) returns `undefined` at
 * runtime even when the value was injected at build time — silently breaking
 * the validation. Each var is read once into a plain object; iterate over
 * THAT object, not over a dynamic key list.
 */
const REQUIRED_ENV_VARS: Record<string, string | undefined> = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export type EnvValidationResult = { valid: true } | { valid: false; missing: string[] };

/**
 * Inspect the resolved env-var object for missing values. A value is
 * considered missing if undefined OR an empty/whitespace-only string —
 * both produce identical downstream Supabase init failures.
 */
export function validateLaunchEnv(): EnvValidationResult {
  const missing: string[] = [];
  for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!value || value.trim().length === 0) {
      missing.push(key);
    }
  }
  return missing.length === 0 ? { valid: true } : { valid: false, missing };
}
