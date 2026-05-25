import PostHog from 'posthog-react-native';

// Sentry is temporarily disabled for v1.0.0 — Sentry 7.x ships OpenTelemetry
// code with dynamic import() expressions that Hermes can't bytecode-compile.
// Re-enable in v1.0.1 after either upgrading to Sentry 8.x or wiring a metro
// resolver that stubs @opentelemetry/* modules.

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export let posthog: PostHog | null = null;

export function initializeObservability() {
  if (POSTHOG_KEY) {
    posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      defaultOptIn: true,
      captureAppLifecycleEvents: true,
    });
  } else if (!__DEV__) {
    console.warn(
      '[observability] EXPO_PUBLIC_POSTHOG_API_KEY not set — analytics will not be reported',
    );
  }
}

type PropertyValue = string | number | boolean | null;
type Properties = Record<string, PropertyValue>;

export function identifyUser(userId: string, traits?: Properties) {
  posthog?.identify(userId, traits ?? {});
}

export function clearUserIdentity() {
  posthog?.reset();
}

export function trackEvent(name: string, properties?: Properties) {
  posthog?.capture(name, properties);
}
