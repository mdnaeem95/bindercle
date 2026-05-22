import { signInWithApple, signInWithGoogle, signOut } from '@/lib/auth';
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

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  session: null,
  user: null,

  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      set({
        session: nextSession,
        user: nextSession?.user ?? null,
        status: nextSession ? 'authenticated' : 'unauthenticated',
      });
    });

    // Caller stores the unsubscribe and calls it on unmount.
    return () => subscription.unsubscribe();
  },

  signInWithApple: async () => {
    await signInWithApple();
    // onAuthStateChange will update the store
  },

  signInWithGoogle: async () => {
    await signInWithGoogle();
    // onAuthStateChange will update the store
  },

  signOut: async () => {
    await signOut();
    // onAuthStateChange will update the store
  },
}));
