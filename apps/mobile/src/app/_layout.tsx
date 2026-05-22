import { useFoilioFonts } from '@/lib/fonts';
import { initializeObservability } from '@/lib/observability';
import { useAuthStore } from '@/stores/auth';
import { ThemeContext, darkTheme } from '@foilio/ui';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

// Initialize Sentry + PostHog before any component renders so the very
// first error/event is captured.
initializeObservability();

function RootLayout() {
  const [fontsLoaded] = useFoilioFonts();
  const authStatus = useAuthStore((s) => s.status);

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

  // Keep the splash up until fonts AND the initial auth check are both done
  if (!fontsLoaded || authStatus === 'unknown') {
    return null;
  }

  return (
    <ThemeContext.Provider value={darkTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: darkTheme.colors.bgBase },
        }}
      />
    </ThemeContext.Provider>
  );
}

// Wrap the root with Sentry's error boundary + navigation instrumentation.
export default Sentry.wrap(RootLayout);
