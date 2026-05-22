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

function applySession(session: Session | null) {
  if (session?.user) {
    identifyUser(session.user.id, {
      email: session.user.email ?? null,
      provider: session.user.app_metadata.provider ?? null,
    });
  } else {
    clearUserIdentity();
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  session: null,
  user: null,

  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    applySession(session);
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(nextSession);
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
