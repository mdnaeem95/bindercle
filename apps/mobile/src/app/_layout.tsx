import { AuthGateSheet } from '@/components/AuthGateSheet';
import { ConfigurationErrorScreen } from '@/components/ConfigurationErrorScreen';
import { ToastHost } from '@/components/ToastHost';
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

/**
 * Routes that inherently require a session, even in the value-before-wall world.
 * Everything NOT matched here is browsable anonymously (feed, binder/page/card
 * detail, /users/[id], /tags/[slug], /search, comments viewing, onboarding).
 *
 *   - creation flows end in `/new`  (binders/new, .../pages/new, .../cards/new)
 *   - editing flows end in `/edit`  (binders/[id]/edit, pages/[pageId]/edit, …)
 *   - card reorder ends in `/move`
 *   - the "you" surfaces: create tab, notifications tab, own profile, settings
 */
function isProtectedRoute(path: string): boolean {
  if (path === '/create' || path === '/notifications' || path === '/settings') {
    return true;
  }
  // Own-profile tab (/profile) and profile editor (/profile/edit). Other users'
  // profiles live at /users/[id] and stay public.
  if (path === '/profile' || path.startsWith('/profile/')) {
    return true;
  }
  return path.endsWith('/new') || path.endsWith('/edit') || path.endsWith('/move');
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

  // Global auth guard (w27 Item 1b — value-before-wall).
  //
  // Anonymous users may now BROWSE read-only surfaces (feed, binder/page/card
  // detail, user profiles, tags, search). The wall moved from the door to the
  // action (see requireAuth / the action gate) and to the protected routes
  // below. So we no longer bounce every unauthenticated user to /sign-in —
  // only when they land on a route that inherently requires a session.
  //
  // This is a backstop: the action gate prevents anon users from *reaching*
  // most protected screens, but deep links / stale navigation could still,
  // so the guard catches them. It also handles sign-out while on a protected
  // screen (session invalidated → bounce), while leaving anon on read-only
  // screens in place. The 'unknown' check above keeps the splash up until the
  // initial auth check resolves, so this only fires after a real state change.
  //
  // Bounce to the anon HOME feed, not /sign-in. /sign-in is a full-screen
  // dead-end (no tab bar, no back) — sending a just-signed-out user there
  // stranded them. Home is browsable and carries a "Sign in" affordance, so
  // there's always a way forward. Deliberate sign-in still routes to /sign-in
  // (home header button) or the dismissable action gate.
  useEffect(() => {
    if (authStatus === 'unauthenticated' && isProtectedRoute(pathname)) {
      router.replace('/');
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
          {/* Root-mounted overlays: the contextual sign-in wall + toasts. */}
          <AuthGateSheet />
          <ToastHost />
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
