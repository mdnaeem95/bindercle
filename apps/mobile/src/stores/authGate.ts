import { trackEvent } from '@/lib/observability';
import { useAuthStore } from '@/stores/auth';
import { router } from 'expo-router';
import { create } from 'zustand';

/**
 * w27 Item 1c — the wall at the ACTION, not the door.
 *
 * Browsing is free (see the route guard + anon RLS). The sign-in prompt fires
 * only when an anonymous viewer reaches for an action that needs an identity:
 * like / save / follow / comment / "build your own". This store centralizes
 * that wall so the copy + instrumentation live in exactly one place.
 *
 * Usage at a call site:
 *
 *   const requireAuth = useRequireAuth();
 *   onPress={() => requireAuth('save', () => toggleSave.mutate({ ... }))}
 *
 * If the viewer is already signed in, `action` runs immediately. If not, the
 * gate sheet opens; on a successful sign-in the intent RESUMES (see the sheet's
 * resume effect) — the save completes and the viewer stays in place; "build
 * your own" routes through onboarding into /binders/new (the wedge).
 */
export type AuthIntent =
  | 'like'
  | 'save'
  | 'follow'
  | 'comment'
  | 'create_binder'
  | 'add_card'
  | 'duplicate_card'
  | 'view_profile'
  | 'view_notifications';

interface AuthGateState {
  visible: boolean;
  intent: AuthIntent | null;
  /** The action to replay after a successful sign-in (engagement intents). */
  pendingAction: (() => void) | null;
  /**
   * Run `action` when signed in; otherwise open the contextual sign-in prompt
   * and stash the action to resume. Returns true if it ran immediately.
   */
  requireAuth: (intent: AuthIntent, action: () => void) => boolean;
  /** Close the prompt without acting (user tapped "maybe later" / backdrop). */
  dismiss: () => void;
  /**
   * Called by the gate sheet once auth succeeds. Replays the stashed intent:
   * create_binder → onboarding wedge; everything else → the pending action.
   */
  resume: () => void;
}

export const useAuthGate = create<AuthGateState>((set, get) => ({
  visible: false,
  intent: null,
  pendingAction: null,

  requireAuth: (intent, action) => {
    if (useAuthStore.getState().status === 'authenticated') {
      action();
      return true;
    }
    set({ visible: true, intent, pendingAction: action });
    trackEvent('signin_prompt_shown', { trigger: intent });
    return false;
  },

  dismiss: () => {
    // A dismissed prompt is a measurable drop-off in the funnel.
    const { intent } = get();
    if (intent) trackEvent('signin_prompt_dismissed', { trigger: intent });
    set({ visible: false, intent: null, pendingAction: null });
  },

  resume: () => {
    const { intent, pendingAction } = get();
    set({ visible: false, intent: null, pendingAction: null });
    if (intent === 'create_binder') {
      // The wedge: a just-signed-in builder goes through onboarding (which ends
      // at /binders/new and captures acquisition attribution), not the feed.
      router.replace('/onboarding');
      return;
    }
    // Engagement intents: complete the action and stay in place.
    pendingAction?.();
  },
}));

/** Ergonomic accessor for call sites. */
export function useRequireAuth() {
  return useAuthGate((s) => s.requireAuth);
}
