import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Required for the browser to dismiss after the auth callback completes on iOS.
WebBrowser.maybeCompleteAuthSession();

/**
 * Foilio auth — bridges native OS providers to Supabase sessions.
 *
 * Apple: native sheet via expo-apple-authentication → identity token → Supabase
 * Google: browser-based OAuth via expo-auth-session → Supabase OAuth flow
 *
 * See OAUTH_SETUP.md for one-time provider configuration in Apple Dev Console,
 * Google Cloud Console, and Supabase Dashboard.
 */

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/**
 * Whether Apple Sign In is available on this device.
 * iOS 13+ with iCloud signed in. Always false on Android / web.
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

/**
 * Trigger native Apple Sign In sheet and exchange the identity token for a Supabase session.
 *
 * Throws on user cancellation, missing identity token, or Supabase exchange error.
 */
export async function signInWithApple() {
  // Hash a random nonce; pass the raw nonce to Apple and the hashed one to Supabase
  // so we can verify the binding at session creation time.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('No identity token returned from Apple');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });

  if (error) throw error;
  return data;
}

/**
 * Trigger Google sign-in via system browser, then exchange the resulting URL
 * for a Supabase session.
 *
 * Uses Supabase's signInWithOAuth → returns a URL → we open it via expo-auth-session
 * → user authenticates with Google → redirects back to `foilio://auth-callback` with
 * tokens in the URL fragment → we extract and set the session.
 */
export async function signInWithGoogle() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. See OAUTH_SETUP.md §2.');
  }

  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'foilio',
    path: 'auth-callback',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned from Supabase');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') {
    throw new Error(`Google sign-in ${result.type}`);
  }

  // Parse tokens from the redirect URL fragment.
  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.slice(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('OAuth callback missing tokens');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) throw sessionError;
  return sessionData;
}

/**
 * Sign out of the current Supabase session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
