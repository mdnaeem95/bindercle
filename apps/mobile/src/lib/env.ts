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

/** Env vars the app cannot function without. */
const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
] as const;

export type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

export type EnvValidationResult = { valid: true } | { valid: false; missing: RequiredEnvVar[] };

/**
 * Inspect process.env for the required public env vars. A value is
 * considered missing if undefined OR an empty/whitespace-only string —
 * both produce identical downstream Supabase init failures.
 */
export function validateLaunchEnv(): EnvValidationResult {
  const missing: RequiredEnvVar[] = [];
  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
      missing.push(key);
    }
  }
  return missing.length === 0 ? { valid: true } : { valid: false, missing };
}
