import { create } from 'zustand';

/**
 * Minimal transient-toast store. A single toast at a time is enough for the
 * moments we celebrate (first card in, etc.). ToastHost renders it.
 */
interface ToastState {
  message: string | null;
  /** Bumped on every show() so ToastHost can re-trigger its enter animation. */
  token: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set, get) => ({
  message: null,
  token: 0,
  show: (message) => set({ message, token: get().token + 1 }),
  hide: () => set({ message: null }),
}));
