# Foilio — TestFlight Submission Guide

Step-by-step for getting the first build into TestFlight. Aimed at a solo
dev doing this for the first time. After the initial run, subsequent
submissions are mostly `pnpm mobile eas build && eas submit`.

---

## 1. Pre-flight checks (one-time)

### Apple Developer account
- [ ] Active Apple Developer Program membership ($99/yr).
- [ ] Bundle ID `app.foilio.mobile` registered at
      <https://developer.apple.com/account/resources/identifiers/list>
      with **Sign In with Apple** capability enabled.

### App Store Connect record
- [ ] Create a new app at <https://appstoreconnect.apple.com> → My Apps → "+".
- [ ] Platform: iOS. Name: **Foilio**. Bundle ID: `app.foilio.mobile`.
      SKU: anything (e.g. `foilio-mobile-1`). Primary language: English.
- [ ] After creation, grab the **Apple ID** (a numeric ID, sometimes
      called "ascAppId") from App Information. Save it for later if you
      want fully non-interactive submits.

### Required metadata (before external testing)
You can build + submit to TestFlight **internal** testing without these,
but external testers (or App Store release) need them.

- [ ] **Privacy Policy URL** — host one. Replace `https://foilio.app/privacy`
      in `apps/mobile/src/app/settings.tsx`.
- [ ] **Terms of Service URL** — same. Replace `https://foilio.app/terms`.
- [ ] **Support URL / email** — `mailto:support@foilio.app` is the current
      placeholder.
- [ ] **App description** — written copy for the App Store listing.
- [ ] **Keywords** (≤100 chars) — comma-separated.
- [ ] **Screenshots** — at least one set at 6.5″ (iPhone 14 Pro Max-ish) and
      one at 5.5″ (iPhone 8 Plus-ish). Up to 10 each. Take from the iOS
      simulator: ⌘S in the simulator menu after navigating to good shots.
- [ ] **App icon** — 1024×1024 already in place at `apps/mobile/assets/images/icon.png`.

### Apple-required notes for review
- [ ] **Content moderation plan** — text field in App Information. State:
      "Reports filed via the in-app Report flow are reviewed daily and
      action is taken (content removal, account ban) within 24 hours per
      Apple guideline 1.2."
- [ ] **Sign-in test account** — TestFlight reviewers need credentials to
      log in. Either Apple Sign In with a sandbox tester account, OR
      create a Google account specifically for review and provide it in
      App Review Information.

---

## 2. Build for TestFlight

```sh
cd apps/mobile
pnpm eas:build:production   # if you have a script alias, otherwise:
eas build --platform ios --profile production
```

`production` profile from `eas.json` will:
- Auto-increment the build number (set via `autoIncrement: true`)
- Use the EAS-managed channel `production`
- Build a signed `.ipa` ready for App Store Connect

Build time: ~15-25 min on `m-medium`. EAS streams logs.

---

## 3. Submit to App Store Connect

```sh
eas submit --platform ios --latest
```

First time: it'll ask for your Apple ID + app-specific password
(generate one at <https://appleid.apple.com> → Sign-In and Security →
App-Specific Passwords). It'll also ask which App Store Connect app to
submit to — pick the one you created in step 1.

After this works, optionally add `submit.production.ios.ascAppId` to
`eas.json` so future submits are fully non-interactive.

---

## 4. TestFlight processing

- App Store Connect takes ~10-30 min to process the binary.
- You'll get an email when it's ready.
- **Internal testers** (users in your App Store Connect team) can install
  immediately, no review required.
- **External testers** (anyone via TestFlight invite or public link)
  require a one-time Beta App Review by Apple (~24 hr).

### Add internal testers
- App Store Connect → TestFlight → Internal Testing → "+"
- Pick App Store Connect users (max 100)

### Add external testers (after Beta App Review)
- App Store Connect → TestFlight → External Testing → New Group
- Add testers by email, or generate a public link
- For the first build, you'll need to submit it for Beta App Review.
  Fill in:
  - Beta App Review Information (contact info, demo account, notes)
  - What to test (1-2 sentences per build)
- Review usually takes 24-48 hr.

---

## 5. Things to test on the actual TestFlight build

The in-app checklist (`MASTER_CHECKLIST.md`) covers most of it, but
specifically on TestFlight builds:

- [ ] **Cold launch** — splash shows, then home or sign-in. No flash of
      unstyled content.
- [ ] **Apple Sign In** — production audience requires this to work
      end-to-end. The dev-client `nobile` typo is fixed, verify on a
      real device.
- [ ] **Google Sign In** — browser redirect, then back to app, lands on
      home (or onboarding for new account).
- [ ] **Push notifications** (if/when added — not in v1).
- [ ] **Account deletion** — DO NOT run this on your real account during
      testing. Make a throwaway, then run `Settings → Delete account`
      and confirm the row in `auth.users` is gone (check via Supabase
      dashboard).
- [ ] **Report flow** — submit a test report, verify it lands in the
      `reports` table.
- [ ] **Block + RLS** — block a seed account, confirm their content
      disappears from Discover, comments, and they can't follow you
      back.
- [ ] **Production observability** — Sentry receives errors with
      `environment: 'production'`. PostHog sees screen events.

---

## 6. Iterating

For each new build:

```sh
# Make your changes, commit, then:
cd apps/mobile
eas build --platform ios --profile production
eas submit --platform ios --latest
```

EAS auto-increments the build number. Don't bump the marketing version
(in `app.json`) unless you're releasing a new feature set publicly.

---

## Known gaps before App Store Connect release

Things TestFlight is forgiving about but the App Store reviewer will
flag:

- [ ] Real TOS + Privacy URLs (currently placeholders in Settings).
- [ ] Age rating — set to **12+** minimum (UGC + social).
- [ ] App Privacy section in App Store Connect — declare what data you
      collect. Foilio collects:
      - Email + name (Apple/Google OAuth) → used for account, not linked
        to ads
      - User content (binders, cards, comments) → linked to identity, not
        used for tracking
      - Diagnostics (Sentry) + analytics (PostHog) → linked to identity,
        not tracking
- [ ] Privacy Manifest — Expo SDK 56 + dependencies should auto-generate
      `PrivacyInfo.xcprivacy`. If Apple flags a missing reason on
      submission, add via `expo-build-properties` plugin.
