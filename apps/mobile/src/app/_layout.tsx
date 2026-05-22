import { useFoilioFonts } from '@/lib/fonts';
import { initializeObservability, posthog } from '@/lib/observability';
import { queryClient } from '@/lib/query';
import { useAuthStore } from '@/stores/auth';
import { ThemeContext, darkTheme } from '@foilio/ui';
import * as Sentry from '@sentry/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect, useRef } from 'react';

// Initialize Sentry + PostHog before any component renders so the very
// first error/event is captured.
initializeObservability();

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

// Wrap the root with Sentry's error boundary + navigation instrumentation.
export default Sentry.wrap(RootLayout);
