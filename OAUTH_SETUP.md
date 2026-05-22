# OAuth Setup — Foilio

> One-time setup for Apple Sign In (native, via `expo-apple-authentication`) and Google OAuth (browser-based, via `expo-auth-session`).
>
> **Total time:** ~45-60 minutes if it's your first time.
> **Prerequisite:** Apple Developer account ($99/yr) — you have this. Google account — you have this.

Work through the sections in order. The values you collect go into `apps/mobile/.env.local`.

---

## What you'll end up with in `.env.local`

Save these as you go — the OAuth code expects them:

```
EXPO_PUBLIC_SUPABASE_URL=...                          # already done
EXPO_PUBLIC_SUPABASE_ANON_KEY=...                     # already done

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...                  # from Google Cloud Console (step 2)
# Apple Services ID and Key are configured in Supabase Dashboard, not the app.
```

---

## 1. Apple Sign In (~20-25 min)

Two pieces required:
- **App ID** — identifies your iOS app to Apple (bundle: `app.foilio.mobile`)
- **Services ID + Key** — what Supabase uses to verify Apple tokens server-side

### 1A. Register the App ID (Done)

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click the **+** button
3. Select **App IDs** → Continue
4. Select **App** → Continue
5. Fill in:
   - **Description:** Foilio
   - **Bundle ID:** Explicit → `app.foilio.mobile`
6. Scroll down to **Capabilities** and check **Sign in with Apple**
7. Click **Continue** → **Register**

### 1B. Register the Services ID (this is what Supabase uses) (Done)

1. Same Identifiers list → click **+**
2. Select **Services IDs** → Continue
3. Fill in:
   - **Description:** Foilio Auth
   - **Identifier:** `app.foilio.mobile.auth` (this becomes the OAuth client ID)
4. Continue → Register
5. Find your new Services ID in the list, click it
6. Check **Sign in with Apple** → Configure
7. Fill in:
   - **Primary App ID:** select `app.foilio.mobile` (the App ID from step 1A)
   - **Domains and Subdomains:** `rdrtxmhjfikzkfwzdqpr.supabase.co`
   - **Return URLs:** `https://rdrtxmhjfikzkfwzdqpr.supabase.co/auth/v1/callback`
8. Save → Continue → Save

### 1C. Create the Sign in with Apple Key (Done)

1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click the **+** button
3. Fill in:
   - **Key Name:** Foilio Sign in with Apple
4. Check **Sign in with Apple** → Configure
5. Select **Primary App ID:** `app.foilio.mobile`
6. Save → Continue → Register
7. **Download the `.p8` file** (you can only do this once — save it somewhere safe like 1Password)
8. **Note the Key ID** (10 characters — example format: `ABC123DE45`)
9. **Note your Team ID** — find it at https://developer.apple.com/account → Membership Details (10-character ID)

### 1D. Configure Apple in Supabase Dashboard (Done)

1. Go to https://supabase.com/dashboard/project/rdrtxmhjfikzkfwzdqpr/auth/providers
2. Find **Apple** → Enable
3. Fill in:
   - **Client IDs (for OAuth):** `app.foilio.mobile.auth,app.foilio.mobile`
     - **First:** the Services ID (from step 1B) — used by web/browser OAuth
     - **Second:** the App ID / bundle ID (from step 1A) — used by native iOS Sign in with Apple
     - **Both are required.** Apple's native sheet sends the bundle ID as the JWT audience; the web flow sends the Services ID. Supabase rejects either if the matching ID isn't listed.
   - **Secret Key (for OAuth):** *Leave blank — Supabase generates this from the next three fields*
   - **Team ID:** (from 1C step 9)
   - **Key ID:** (from 1C step 8)
   - **Private Key (.p8):** open the `.p8` file in a text editor and paste the *full contents* (including `-----BEGIN PRIVATE KEY-----` lines)
4. Save

> Apple Sign In sheet on iOS doesn't need any of the above to *trigger* — the native sheet works as long as your App ID has the capability. The above is needed for Supabase to *verify* the token server-side and create a session.

---

## 2. Google OAuth (~10-15 min)

### 2A. Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Top bar → click the project dropdown → **New Project**
3. Project name: `Foilio` → Create

### 2B. Configure OAuth consent screen (Done)

1. Left menu → **APIs & Services** → **OAuth consent screen**
2. User Type: **External** → Create
3. Fill in:
   - **App name:** Foilio
   - **User support email:** your email
   - **App logo:** optional (skip)
   - **App domain:** leave blank
   - **Developer contact email:** your email
4. Save and Continue
5. Scopes → Save and Continue (no extra scopes needed; default `email` + `profile` is fine)
6. Test users → Add your own email (so you can test before publishing) → Save
7. Summary → Back to Dashboard
8. **Publish App** when you're ready for real users — for now testing mode is fine

### 2C. Create OAuth Web Client ID (Done)

1. **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `Foilio Web Client`
4. **Authorized redirect URIs** → Add: `https://rdrtxmhjfikzkfwzdqpr.supabase.co/auth/v1/callback`
5. Create
6. **Copy the Client ID and Client Secret** — you'll need both
   - Client ID format: `xxxxx-xxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - Client Secret format: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxx`
   - Paste these directly into the Supabase Dashboard and your `apps/mobile/.env.local` — **never into a tracked file like this one**

### 2D. Configure Google in Supabase Dashboard (Done)

1. Go back to https://supabase.com/dashboard/project/rdrtxmhjfikzkfwzdqpr/auth/providers
2. Find **Google** → Enable
3. Fill in:
   - **Client ID:** (from 2C step 6)
   - **Client Secret:** (from 2C step 6)
4. Save

### 2E. Add Client ID to env.local (Done)

In `apps/mobile/.env.local` add:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<the Client ID from step 2C>
```

---

## 3. Supabase Redirect URLs (Done)

1. Go to https://supabase.com/dashboard/project/rdrtxmhjfikzkfwzdqpr/auth/url-configuration
2. **Site URL:** `foilio://`
3. **Redirect URLs** — add (one per line):
   ```
   foilio://auth-callback
   foilio://
   exp://*
   ```
   (the `exp://*` is for Expo Go dev builds during local testing — remove for production)
4. Save

---

## Verification checklist

When you're done, you should have:

- [Done] App ID `app.foilio.mobile` registered in Apple Developer Console with Sign in with Apple capability
- [Done] Services ID `app.foilio.mobile.auth` registered with Supabase return URL
- [Done] Sign in with Apple Key (`.p8` file) downloaded and stored safely
- [Done] Apple provider enabled in Supabase Dashboard with Services ID + Team ID + Key ID + .p8 contents
- [Done] Google Cloud project `Foilio` created with OAuth consent screen configured
- [Done] Google Web OAuth Client created with Supabase callback URI
- [Done] Google provider enabled in Supabase Dashboard with Client ID + Secret
- [Done] Supabase redirect URLs include `foilio://auth-callback`
- [Done] `apps/mobile/.env.local` has `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

---

## Common gotchas

- **Apple Sign In sheet doesn't appear:** the App ID needs the Sign in with Apple capability AND the Expo app needs the `expo-apple-authentication` plugin in `app.json` (we'll add that next). On simulator, sign in only works on iOS 13+ simulator that's signed into iCloud.
- **"Invalid redirect URI" from Apple:** double-check that the Services ID return URL is *exactly* `https://rdrtxmhjfikzkfwzdqpr.supabase.co/auth/v1/callback` (no trailing slash, https not http).
- **Google sign-in stays on browser:** the redirect URL in Supabase auth config must include `foilio://auth-callback` — otherwise Supabase doesn't know to redirect back to the app.
- **OAuth consent screen "in testing":** for now this is fine. You'll need to publish when you want real users beyond your test list. Publishing is a separate step in Google Cloud Console.
- **Apple Team ID confusion:** Team ID is a 10-character string at https://developer.apple.com/account → Membership Details. NOT the same as your Apple ID email.

---

*Last updated: 2026-05-22*
