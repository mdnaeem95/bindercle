# Smoke-test spec

**Purpose:** the manual pass that must go green on a TestFlight build **before every OTA promotion to `production`**, per the hotfix policy. Fast (~10 min), high-signal, catches the launch-class failures we've actually hit.

> Companion to [`decisions/2026-06-01-hotfix-policy.md`](decisions/2026-06-01-hotfix-policy.md) — that policy mandates a smoke pass on a staging-equivalent before every production OTA; **this is that pass.** For changes to boot-critical code, see that doc's "Boot-critical code has a verification gap" section and §B below, which this spec implements.

---

## When to run

- Before promoting any `eas update` to the `production` channel.
- Run it against the **`staging` channel** first (see Staging gate), not prod.

## §B. Boot-critical changes — extra gate

If the change touches **module-eval / pre-UI code** — env validation ([env.ts](apps/mobile/src/lib/env.ts)), observability init, Supabase client creation, `_layout.tsx` route guards, deep-link or push setup, fonts — a normal "open app, tap around" pass is **insufficient** (it won't fire on a fresh cold launch, which is exactly how the Jun 1 incident slipped through). Per the hotfix policy, also require:

- [ ] **Unit test the init/validation logic** against mocked inputs (e.g. `validateLaunchEnv()` with mocked `process.env`).
- [ ] **Cold-launch on a fresh install** — fully kill and relaunch, don't background→foreground.
- [ ] **Stagger to a non-Sani device** — verify on a second TestFlight tester or sim before promoting.

_v1.0.1 note:_ no change in this wave runs at module-eval, but **B2 alters onboarding navigation/route flow** — treat it as boot-critical-adjacent and run the §B cold-launch + non-Sani-device checks, not just an in-session tap-through.

## 0. Pre-flight — env injection (the launch-day killer)

The two worst outages were both env/bundle, not feature bugs (see CLAUDE.md gotchas #8/#9). Before smoking behavior:

- [ ] OTA bundle was built with `EXPO_PUBLIC_*` sourced into the shell (`set -a && source .env.local && set +a` before `eas update`). **Never** `--environment production`.
- [ ] Metro cache purged if a prior update shipped with empty env (`rm -rf /private/var/folders/*/T/metro-cache apps/mobile/.expo apps/mobile/dist`).
- [ ] App cold-launches past the splash — **not** `ConfigurationErrorScreen`. (If you see it, env didn't inline; do not promote.)
- [ ] PostHog Live shows events arriving on **EU** (`eu.i.posthog.com`). CI's `check-posthog-region.mjs` guards the config, but confirm ingestion is live.

## 1. Auth (the #1 funnel lever)

- [ ] Sign in with Apple completes → lands in-app (not error-1000). _Apple sign-in works on build 14; watch for regressions._
- [ ] Sign in with Google completes.
- [ ] Cold-relaunch → session persists (no bounce to `/sign-in`).
- [ ] PostHog: `sign_in_succeeded` fires with `provider`.

## 2. Onboarding → first binder (v1.0.1 wedge — **B2**)

- [ ] Fresh account: onboarding form shows the new copy (`welcome to bindercle.`, `make my first binder`).
- [ ] Tapping **make my first binder** routes to **`/binders/new`**, NOT the home feed. _(This is the load-bearing B2 change; it touches navigation — cold-launch it, don't just hot-reload.)_
- [ ] No redirect loop: the just-onboarded user is not bounced back to `/onboarding` ([(tabs)/index.tsx](apps/mobile/src/app/(tabs)/index.tsx) gates non-onboarded users — confirm the `completedOnboardingRef` path wins).
- [ ] PostHog: `onboarding_completed` then `binder_created` with `is_first: true` both fire.

## 3. Binder + page + card

- [ ] Create a binder (`start building`) → lands on the binder detail.
- [ ] Add a page → page opens with the empty-pocket overlay (`tap any pocket to add a card.`).
- [ ] **Add a card via an empty pocket** → card lands in that slot.
- [ ] PostHog (v1.0.1 **A1**): `card_added` carries **non-null `binder_id` AND `page_id`**, plus `via: 'empty_slot'`.
- [ ] Duplicate a card → second `card_added` with `via: 'duplicate'` and non-null `binder_id`/`page_id`.

### Add-entry & page-capacity note (from the Jun 7 cold-launch smoke)

The **only** way to add a card is tapping an empty pocket (`onEmptySlotPress` → `/pages/[pageId]/cards/new?position=`). There is no generic "add card" button. Consequence: **page-capacity protection is structural** — a full page exposes no empty slots to tap, so you can't over-fill it, and the **duplicate path** is the route that must respect capacity explicitly (it picks the next free slot). Smoke both:

- [ ] Fill a page to capacity → no empty pockets remain tappable (can't exceed layout size).
- [ ] Duplicate onto a near-full page → lands in the next free slot or is blocked when full (never silently drops or overflows).

## 4. Empty states (v1.0.1 copy)

Spot-check each reads the new copy and **leads with building**, never a dead-end:

- [ ] Home (no binders) · Profile (own, no binders) · Binder (no pages) · Search (no match) · Notifications (empty).

---

## Staging gate (v1.0.1 **D2**)

OTAs get tested off-prod before promotion:

1. Build/install a **`staging`** profile build (`eas build --profile staging`) on a test device — one-time.
2. Push the candidate JS to staging: `set -a && source .env.local && set +a && eas update --branch staging --message "..."`.
3. Run this spec against the staging build.
4. Green → promote the **same** update to `production` (republish from staging, or re-push to `--branch production`).

> Staging shares the production Supabase project and the EU PostHog project — it's for short-lived smoke, not load or data isolation. `EXPO_PUBLIC_ENV=staging` separates Sentry environments.
