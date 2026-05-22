import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

/**
 * Foilio observability layer.
 *
 * Sentry  — crash + error reporting with PII redaction
 * PostHog — privacy-friendly product analytics, anonymous by default
 *
 * Both fail gracefully when their env vars are missing (so local dev
 * without the keys still works).
 */

export let posthog: PostHog | null = null;

export function initializeObservability() {
  // Sentry --------------------------------------------------------------
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      // PII redaction — never send raw IPs or auto-captured user metadata
      sendDefaultPii: false,
      // Only sample a fraction of transactions in prod; full sampling in dev
      tracesSampleRate: __DEV__ ? 1.0 : 0.1,
      // Strip env so we know which build emitted the error
      environment: process.env.EXPO_PUBLIC_ENV ?? (__DEV__ ? 'development' : 'production'),
      enableAutoSessionTracking: true,
      // Mute noisy network errors that are expected (e.g. user cancels)
      beforeSend(event) {
        const msg = event.message?.toLowerCase() ?? '';
        if (msg.includes('cancel') || msg.includes('canceled')) return null;
        return event;
      },
    });
  } else if (!__DEV__) {
    console.warn('[observability] EXPO_PUBLIC_SENTRY_DSN not set — errors will not be reported');
  }

  // PostHog -------------------------------------------------------------
  if (POSTHOG_KEY) {
    posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Anonymous-by-default; we call identify() only after auth
      defaultOptIn: true,
      // Privacy-conscious defaults
      captureAppLifecycleEvents: true,
    });
  } else if (!__DEV__) {
    console.warn(
      '[observability] EXPO_PUBLIC_POSTHOG_API_KEY not set — analytics will not be reported',
    );
  }
}

/** Property values safe for both PostHog and Sentry tags. */
type PropertyValue = string | number | boolean | null;
type Properties = Record<string, PropertyValue>;

/**
 * Identify the signed-in user across both services.
 * Call this once on successful sign-in. Anonymous before this point.
 */
export function identifyUser(userId: string, traits?: Properties) {
  Sentry.setUser({ id: userId });
  posthog?.identify(userId, traits ?? {});
}

/**
 * Clear user context across both services. Call on sign-out.
 */
export function clearUserIdentity() {
  Sentry.setUser(null);
  posthog?.reset();
}

/**
 * Track a named product event (PostHog only; Sentry is for errors).
 */
export function trackEvent(name: string, properties?: Properties) {
  posthog?.capture(name, properties);
}
