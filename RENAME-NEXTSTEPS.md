# Rename to Bindercle — manual next steps

The code-side rename is done (`feat(rename): foilio → bindercle`). But the
bundle identifier and URL scheme changed, which requires updates to
external services that the codebase can't touch directly. Walk through
these in order before the next build.

---

## 1. Apple Developer Portal

The bundle ID went from `app.foilio.mobile` to `app.bindercle.mobile`.
Apple treats this as a different app entirely.

- [Y] Sign in to <https://developer.apple.com/account>
- [Y] **Identifiers → +** → App IDs → App → Bundle ID `app.bindercle.mobile`
      → enable **Sign In with Apple** capability
- [Y] (Optional but recommended) leave the old `app.foilio.mobile`
      registration alone — Apple charges nothing for unused identifiers
      and removing it doesn't help anything

---

## 2. Supabase — Apple OAuth provider

The Apple OAuth provider in Supabase is tied to the iOS bundle ID. It
needs the new value before Apple Sign In will work end-to-end.

- [Y] Supabase dashboard → Authentication → Providers → Apple → edit
- [Y] **Audience / Client IDs** — add `app.bindercle.mobile` (you can keep
      the old `app.foilio.mobile` listed if you want — Supabase accepts
      multiple, but cleaner to remove the old one after testing)
- [Y] Save

---

## 3. Google Cloud Console — OAuth client redirect URIs

The Google OAuth client redirects to the app via a custom URL scheme
(`foilio://auth-callback`). The scheme changed to `bindercle://`.

- [Y] Google Cloud Console → APIs & Services → Credentials → your OAuth
      2.0 Client ID for iOS
- [Y] **Authorized redirect URIs** — add `bindercle://auth-callback`
- [Y] You can leave the old `foilio://auth-callback` for now in case any
      dev clients with the old bundle ID are still running; remove once
      everyone's on the new build

---

## 4. App Store Connect (only when ready to submit)

If you already created an App Store Connect record for `app.foilio.mobile`
during earlier prep, you can't rename it. Create a fresh record for
`app.bindercle.mobile` when you go to submit. The old one can stay
dormant — Apple doesn't bill for unsubmitted apps.

---

## 5. Build a new dev client

The dev client on your phone has bundle ID `app.foilio.mobile`. The
new code won't run inside it. You need a fresh client:

```sh
cd apps/mobile
eas build --platform ios --profile development
```

After install:
- [ ] Old dev client (Foilio icon) — delete from device
- [ ] New dev client (Bindercle icon) — install via TestFlight link or
      camera-scan QR from `eas build` output

---

## 6. Re-sign-in flow

Apple Sign In ID tokens are scoped to the bundle ID's audience. Existing
sign-ins from the old `app.foilio.mobile` bundle won't validate against
the new bundle. On the new dev client:

- [ ] Sign out of your existing dev accounts (or just sign in fresh — the
      old session will be invalid and you'll be redirected to sign-in)
- [ ] You may also want to delete the prior `naeemsani95@...` /
      `muhdnaeem95@...` rows from `auth.users` in Supabase if they're
      tied to the old Apple identifier and you don't need them. The
      `useDeleteAccount` flow in the app does this cleanly, OR you can
      delete from Supabase Auth → Users in the dashboard.

---

## 7. Internal-name cleanup (deferred, low priority)

These are NOT user-facing and don't affect functionality. They're left
alone in this rename for surgical scope. Worth doing as a separate pass
when you feel like it:

- [ ] Monorepo workspace names: `@foilio/mobile`, `@foilio/ui`,
      `@foilio/api-client` → `@bindercle/...`. Lots of import sites.
- [ ] Function names: `useFoilioFonts`, `createFoilioClient`
- [ ] File-level comments in `apps/mobile/src/lib/*` and migrations
      (cosmetic, the SQL still runs)
- [ ] Supabase project name (in dashboard) — purely cosmetic; the URL
      stays the same
- [ ] Sentry / PostHog project names — keep for data continuity unless
      you specifically want a fresh start
- [ ] GitHub repo name — `gh repo rename bindercle` once you're sure

---

## 8. Domain

Don't forget:

- [ ] Buy `bindercle.app` (and optionally `bindercle.com`, `bindercle.io`)
      from a registrar (Namecheap, Porkbun, Cloudflare Registrar are good).
      All three were available when last screened.
- [ ] Point them at GitHub Pages or wherever you're hosting the
      Privacy / Terms / Support pages.
