import { ConfigurationErrorScreen } from '@/components/ConfigurationErrorScreen';
import { validateLaunchEnv } from '@/lib/env';
import { useFoilioFonts } from '@/lib/fonts';
import { initializeObservability, posthog } from '@/lib/observability';
import { queryClient } from '@/lib/query';
import { useAuthStore } from '@/stores/auth';
import { ThemeContext, darkTheme } from '@foilio/ui';
import * as Sentry from '@sentry/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, router, useGlobalSearchParams, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect, useRef } from 'react';

// Validate required env vars BEFORE initializing observability or anything
// else that depends on them. If invalid, the app renders ConfigurationErrorScreen
// and bails — no Sentry/PostHog/Supabase init, no native crash. See env.ts for
// the failure history this guards against.
const envValidation = validateLaunchEnv();

// Initialize Sentry + PostHog before any component renders so the very
// first error/event is captured. Skip when env is invalid — Sentry/PostHog
// may themselves be the missing config.
if (envValidation.valid) {
  initializeObservability();
}

function RootLayout() {
  const [fontsLoaded] = useFoilioFonts();
  const authStatus = useAuthStore((s) => s.status);
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    useAuthStore
      .getState()
      .initialize()
      .then((cleanup) => {
        unsubscribe = cleanup;
      });
    return () => unsubscribe?.();
  }, []);

  // Manual screen tracking for Expo Router
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog?.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  // Global auth guard: if the session is ever invalidated (sign-out, token
  // expiry, manual revoke), bounce to /sign-in from wherever we are. The
  // 'unknown' check above keeps the splash visible until the initial check
  // resolves, so this only fires after a real state change.
  useEffect(() => {
    if (authStatus === 'unauthenticated' && pathname !== '/sign-in') {
      router.replace('/sign-in');
    }
  }, [authStatus, pathname]);

  // Keep the splash up until fonts AND the initial auth check are both done
  if (!fontsLoaded || authStatus === 'unknown') {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider
        client={posthog ?? undefined}
        autocapture={{ captureScreens: false, captureTouches: true }}
      >
        <ThemeContext.Provider value={darkTheme}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: darkTheme.colors.bgBase },
            }}
          />
        </ThemeContext.Provider>
      </PostHogProvider>
    </QueryClientProvider>
  );
}

/**
 * Outer gate — decides whether the real app boots or whether we show the
 * configuration error screen. Kept separate from RootLayout so RootLayout's
 * hook ordering stays stable regardless of env state.
 */
function App() {
  if (!envValidation.valid) {
    return <ConfigurationErrorScreen missing={envValidation.missing} />;
  }
  return <RootLayout />;
}

// Wrap the root with Sentry's error boundary + navigation instrumentation.
// Sentry.wrap is a no-op when Sentry.init wasn't called (the env-invalid case).
export default Sentry.wrap(App);
