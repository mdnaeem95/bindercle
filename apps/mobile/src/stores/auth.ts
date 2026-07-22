import { signInWithApple, signInWithGoogle, signOut } from '@/lib/auth';
import { clearUserIdentity, identifyUser, trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;

  // Lifecycle — called once from the root layout to bootstrap from any stored session.
  initialize: () => Promise<() => void>;

  // Sign-in flows
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

function identifyFromSession(session: Session | null) {
  if (session?.user) {
    // identify() stitches the current anonymous PostHog distinct_id onto the
    // user (anon→identified merge), so the pre-auth funnel legs (app open,
    // feed_viewed, signin_prompt_shown, …) chain continuously into the
    // signed-in identity. See w27 Item 1d.
    identifyUser(session.user.id, {
      email: session.user.email ?? null,
      provider: session.user.app_metadata.provider ?? null,
    });
  }
  // NB: intentionally no reset() here for the null-session case. A session-less
  // launch is an anonymous browser (value-before-wall) — resetting on every
  // cold start would mint a fresh anon id each launch and fragment the
  // pre-auth funnel. We only reset on an explicit SIGNED_OUT (below).
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  session: null,
  user: null,

  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    identifyFromSession(session);
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        // Only wipe the PostHog/Sentry identity on an explicit sign-out; the
        // viewer becomes a fresh anonymous browser afterwards.
        clearUserIdentity();
      } else {
        identifyFromSession(nextSession);
      }
      if (event === 'SIGNED_IN' && nextSession?.user) {
        trackEvent('sign_in_succeeded', {
          provider: nextSession.user.app_metadata.provider ?? null,
        });
      }
      set({
        session: nextSession,
        user: nextSession?.user ?? null,
        status: nextSession ? 'authenticated' : 'unauthenticated',
      });
    });

    return () => subscription.unsubscribe();
  },

  signInWithApple: async () => {
    await signInWithApple();
  },

  signInWithGoogle: async () => {
    await signInWithGoogle();
  },

  signOut: async () => {
    await signOut();
  },
}));
