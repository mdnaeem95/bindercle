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

- [Y] Sign in with Apple completes → lands in-app (not error-1000). _Apple sign-in works on build 14; watch for regressions._
- [Y] Sign in with Google completes.
- [Y] Cold-relaunch → session persists (no bounce to `/sign-in`).
- [Y] PostHog: `sign_in_succeeded` fires with `provider`.

## 2. Onboarding → first binder (v1.0.1 wedge — **B2**)

- [Y] Fresh account: onboarding form shows the new copy (`welcome to bindercle.`, `make my first binder`).
- [Y] Tapping **make my first binder** routes to **`/binders/new`**, NOT the home feed. _(This is the load-bearing B2 change; it touches navigation — cold-launch it, don't just hot-reload.)_
- [Y] No redirect loop: the just-onboarded user is not bounced back to `/onboarding` ([(tabs)/index.tsx](apps/mobile/src/app/(tabs)/index.tsx) gates non-onboarded users — confirm the `completedOnboardingRef` path wins).
- [Y] PostHog: `onboarding_completed` then `binder_created` with `is_first: true` both fire.

## 3. Binder + page + card

- [Y] Create a binder (`start building`) → lands on the binder detail.
- [Y] Add a page → page opens with the empty-pocket overlay (`tap any pocket to add a card.`).
- [Y] **Add a card via an empty pocket** → card lands in that slot.
- [Y] PostHog (v1.0.1 **A1**): `card_added` carries **non-null `binder_id` AND `page_id`**, plus `via: 'empty_slot'`.
- [Y] Duplicate a card → second `card_added` with `via: 'duplicate'` and non-null `binder_id`/`page_id`.

### Add-entry & page-capacity note (from the Jun 7 cold-launch smoke)

The **only** way to add a card is tapping an empty pocket (`onEmptySlotPress` → `/pages/[pageId]/cards/new?position=`). There is no generic "add card" button. Consequence: **page-capacity protection is structural** — a full page exposes no empty slots to tap, so you can't over-fill it, and the **duplicate path** is the route that must respect capacity explicitly (it picks the next free slot). Smoke both:

- [Y] Fill a page to capacity → no empty pockets remain tappable (can't exceed layout size).
- [Y] Duplicate onto a near-full page → lands in the next free slot or is blocked when full (never silently drops or overflows).

## 4. Empty states (v1.0.1 copy)

Spot-check each reads the new copy and **leads with building**, never a dead-end:

- [Y] Home (no binders) · Profile (own, no binders) · Binder (no pages) · Search (no match) · Notifications (empty).

---

## Staging gate (v1.0.1 **D2**)

OTAs get tested off-prod before promotion:

1. Build/install a **`staging`** profile build (`eas build --profile staging`) on a test device — one-time.
2. Push the candidate JS to staging: `set -a && source .env.local && set +a && eas update --branch staging --message "..."`.
3. Run this spec against the staging build.
4. Green → promote the **same** update to `production` (republish from staging, or re-push to `--branch production`).

> Staging shares the production Supabase project and the EU PostHog project — it's for short-lived smoke, not load or data isolation. `EXPO_PUBLIC_ENV=staging` separates Sentry environments.

---

# w27 — value-before-wall + page export (v1.0.2)

**Ships:** Item 1a = **Supabase migration** (`20260629120000_anon_read_public_content`); Item 2 = migration (`20260629130000_exports_bucket`) + `page-export` edge function; Items 1b/1c/1d/2-client/3 = OTA JS. No native rebuild (Path B).

**Boot-critical (§B):** Item 1b rewrites the `_layout.tsx` route guard (module-adjacent, runs on the guard path). Treat as boot-critical — run the §B cold-launch + non-Sani-device checks, not just an in-session tap-through.

## W0. Deploy prerequisites (do BEFORE the OTA)

- [Y] Apply migrations to the Supabase project **in order**: `...anon_read_public_content` then `...exports_bucket`. (RLS/grants + the `exports` bucket must exist before the OTA calls them.)
- [Y] Deploy the edge function: `supabase functions deploy page-export`. It reuses the project secrets `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (already set for `delete-account`). Anon-key-as-bearer passes `verify_jwt`, so anon export works — do **not** deploy with a stricter verify setting.
- [ ] **Re-deploy `page-export`** after the w27 font fix — the default `EXPORT_FONT_URL` was corrected to `@expo-google-fonts/inter@0.2.3/Inter_700Bold.ttf` (the old Roboto path 404'd → plain-bar watermark). No secret needed now; only set `EXPORT_FONT_URL` to override. Re-run W5 and confirm the wordmark + @handle render.

## W1. Anonymous-read RLS (Item 1a) — verify with the ANON key, not service_role

Over-exposure is the risk. Using the project **anon** key (e.g. a REST call with `apikey: <anon>` and no user JWT):

- [Y] Public content reads: `binders` (only `is_public=true`), their `binder_pages` / `cards` / `card_photos` / `binder_tags`, `profiles` (handle/display_name/avatar_url/bio — **no email column exists**), `follows`/`likes`/`saves`/`comments`, `pokemon_tcg_cards`. _API-verified anon (publishable key, no JWT) 2026-07-10: all 200; `binders` returned only is_public=true; `profiles?select=email` → 400 "column does not exist"._
- [Y] Private binders return **0 rows** for anon (`select id from binders where is_public=false`). _Verified: 200 `[]`._
- [Y] Private tables return **0 rows / permission denied** for anon: `notifications`, `user_blocks`, `reports`, `wishlists`, `wishlist_items`. _Verified: all **401 `42501` permission denied** (defense-in-depth revoke, not just RLS)._

## W2. Anonymous browse (Item 1b — cold-launch / §B)

- [Y] **Fresh install, signed out, cold launch**: app lands on the **Discover feed**, NOT `/sign-in`. (Mine/Saved chips hidden; a "Sign in" button shows in the header.)
- [Y] Anon can open: a public binder detail, a page detail, a card detail, `/users/[id]`, `/tags/[slug]`, search — all read-only, no crash, no permission errors in logs.
- [Y] Anon tapping the **Create**, **Notifications**, or **Profile** tab opens the **dismissable** sign-in prompt and stays on the current tab — none of them strand you on a full-screen `/sign-in` (the original bug). Dismiss → still browsing.
- [Y] **No dead-ends**: from `/sign-in` (reached via the home "Sign in" button) the `just browsing? keep looking around` link returns to the feed; signing **out** from Settings lands on the anon home feed, not `/sign-in`.
- [Y] PostHog: `feed_viewed {anonymous:true}` and `binder_viewed {anonymous:true}` fire while signed out. _API-verified 2026-07-10: feed_viewed anon=5/nonanon=1, binder_viewed anon=4/nonanon=1._

## W3. The wall at the action (Item 1c) + resume

For each, signed **out**, the contextual sheet appears (not a hard redirect), and on sign-in the intent **resumes**:

- [Y] **Like** a binder → prompt → sign in → the like completes, still on the binder.
- [Y] **Save** a binder → prompt → sign in → save completes in place.
- [Y] **Follow** a user (the Follow button now shows to anon) → prompt → sign in → follow completes.
- [Y] **Comment**: type a draft, tap send → prompt → sign in → the **typed draft posts** (not lost).
- [Y] **Build your own** (Create tab) → prompt → sign in → routes through **onboarding → `/binders/new`** (the wedge), acquisition source still captured.
- [Y] PostHog: `signin_prompt_shown {trigger}` fires on each prompt; `sign_in_attempted {trigger}` on the sheet's buttons. _API-verified 2026-07-10: signin_prompt_shown triggers seen = like/follow/comment/create_binder. (sign_in_attempted trigger is null when sign-in comes from the full /sign-in screen rather than the gate — expected.)_

## W4. Continuous funnel (Item 1d — identify stitch)

- [Y] In PostHog, a single anonymous session that signs in shows **one continuous person**: `feed_viewed`(anon) → `signin_prompt_shown` → `sign_in_attempted` → `sign_in_succeeded` … all on the same `person_id` (anon→identified merged). _API-verified 2026-07-10: person `4f2fb497…` carries 3 anon feed_viewed + 2 anon binder_viewed + 5 prompts + the sign_in_succeeded on one person_id — the stitch chains._
- [Y] Cold-relaunch while **signed out** does not mint a brand-new anon id every launch (no `reset()` on a session-less boot) — the anon person persists across launches until sign-in or explicit sign-out.
- [Y] Add to the Activation & Sign-in Health dashboard (777504): success rate = `sign_in_succeeded / sign_in_attempted` vs the ~44% baseline, plus browse→prompt→attempt.

## W5. Page export (Item 2)

- [Y] On a page detail, the **share** icon (header) exports: tap → spinner → OS share sheet opens with the composed PNG URL.
- [Y] **RE-VERIFY after redeploy** — the image is a faithful grid **and carries the wordmark + owner `@handle`** (the distribution payload). _First smoke showed a plain bar: the default font URL 404'd. Fixed — default is now `@expo-google-fonts/inter@0.2.3/Inter_700Bold.ttf` (verified 200 + valid TTF). Redeploy `page-export` and confirm the text renders._
- [Y] **Anon** (signed out) can export a **public** page (share loop works without an account).
- [Y] A **private** page is not exportable by a non-owner (edge fn returns 404 under RLS).
- [Y] PostHog: `page_exported {surface:'page_detail', shared}` fires. _API-verified 2026-07-10: surface=page_detail, both shared=true and shared=false seen._

## W6. Onboarding sub-items (Item 3)

- [Y] **First card**: on the user's very first `card_added`, the toast `first card's in. this is the part that gets good.` appears (only the first time).
- [Y] **Profile empty state** (own, no binders): shows the `new binder` CTA → `/binders/new`.
- [Y] **Binder empty state** (owner, no pages): shows the `add a page` CTA → `/binders/[id]/pages/new`.
