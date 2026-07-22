# Bindercle — Codebase Onboarding

_Source-of-truth technical reference for the Bindercle PM scope. Updated by Sani (with Claude) 2026-07-15 — reflects post-launch state through the **v1.0.2 (w27) OTA**. Re-paste an updated version when the codebase changes materially._

**One-liner:** Pinterest for trading-card collectors. Themed binders of Pokémon TCG cards (architected to be game-agnostic). React Native / Expo on iOS+Android, Supabase backend. Solo-founder bootstrapped.

**Status (2026-07-15):** **Live.** v1.0.0 build 14 released on the App Store **2026-06-10**. **v1.0.1** shipped via OTA 2026-06-27 (onboarding wedge + infra hardening). **v1.0.2 — the w27 "value-before-wall" wave — shipped via OTA** (all JS + two DB migrations + one new edge function; **no build 15**, Path B chosen for export). Code lives on branch `w27-value-before-wall` (PR #1); verified on `staging`, migrations applied to prod, `page-export` deployed.

> ✅ **Value-before-wall is live (w27).** The #1 lever from the last review — sign-in friction — is now addressed: **unauthenticated users browse read-only** (feed, public binders/pages/cards, profiles, tags, search) and the **auth wall fires at the action** (like / save / follow / comment / "build your own"), not at the door. The **pre-auth funnel is finally measurable** — anonymous `feed_viewed`/`binder_viewed`/`signin_prompt_shown` now fire, and the anon→identified PostHog stitch is verified continuous. Volume is still low/test-dominated; treat metrics as baseline and watch trends (weekly dashboard **809107**).

> ⚠️ **The repo still uses the pre-rebrand name "Foilio" in many places** (`package.json` name `foilio`, EAS slug `foilio`, workspace scope `@foilio/*`, Sentry project `foilio`, `README.md`, `ROADMAP.md`). See `RENAME-NEXTSTEPS.md`. User-facing branding is fully "Bindercle". **Treat `Foilio == Bindercle`.**

---

## Monorepo layout

```
apps/
  mobile/              Expo 56.0.3 + RN 0.85.3 + React 19.2 — the actual app
packages/
  ui/                  Design system: Button, Input, Avatar, CardThumbnail,
                       PageThumbnail, BinderCard, BindercleWordmark,
                       AccentPicker, Surface, Text, HoloGradient, ChipGroup
                       + theme tokens (dark only)
  api-client/          createFoilioClient (Supabase wrapper) + generated DB types
supabase/
  migrations/          15 SQL migrations (13 launch + 2 from w27: anon-read RLS,
                       exports storage bucket)
  functions/           tcg-search, delete-account, page-export (w27) — edge functions
website/               Static HTML (privacy / terms / support / landing);
                       runs posthog-js on bindercle.app (separate lib from the app)
scripts/
  seed.ts                    Local DB seeding (5 @foilio.test personas)
  check-posthog-region.mjs   v1.0.1 — CI guard: all PostHog hosts must be EU
decisions/
  2026-06-01-hotfix-policy.md  P0–P3 severity ladder + OTA/rollback rules
SMOKE-TESTS.md         Pre-OTA smoke spec (+ boot-critical §B gate) — has a
                       dedicated w27 section (W0–W6) with the anon/RLS/export checks
docs/
  CODEBASE.md          this file
```

**Tooling:** pnpm 10 + Turbo 2.5, Biome 1.9 (lint+format, no ESLint/Prettier), Lefthook (pre-commit biome+typecheck, conventional-commit on commit-msg), TypeScript strict.

## Mobile app structure (`apps/mobile/src/`)

**Routing — expo-router** (typed routes + react compiler both enabled):

- `app/_layout.tsx` — root: env validation gate → Sentry, PostHog, fonts, auth init, route guard, + `AuthGateSheet` / `ToastHost` overlays
- `app/sign-in.tsx` (OAuth-only: Apple + Google, one-tap; has a "keep browsing" escape), `app/onboarding.tsx`
- `app/(tabs)/` — `index` (home feed; anon sees Discover-only), `create`, `search`, `notifications`, `profile`
- `app/binders/[id]/` — `index`, `edit`, `comments`, `pages/new`; `app/binders/new.tsx`
- `app/pages/[pageId]/` — `index` (has the share/export affordance), `edit`, `cards/new`
- `app/cards/[cardId]/` — `index`, `edit`, `move`
- `app/users/[id].tsx`, `app/tags/[slug].tsx`, `app/profile/edit.tsx`, `app/settings.tsx`

**Routing/auth model (w27):** the root guard is a **protected-route blocklist** — anon may reach any read-only surface; only creation/edit/`/settings`/`/profile`/`/notifications` require a session. **Anon bounces land on `/` (browsable home), never a dead-end `/sign-in`.** Sign-out and the you-tabs also route to home / the dismissable gate, not `/sign-in`.

**State:** Zustand (`src/stores/`) — `auth.ts`, **`authGate.ts`** (the `requireAuth(intent)` action-wall + intent-resume), **`toast.ts`** (transient toasts). TanStack Query for all server state; react-hook-form + zod for forms.

**Components (11):** `BinderPageGrid`, `CardLayout`, `DraggableGrid`, `TcgCardSuggestions`, `TagPicker`, `UserProfileView`, `BinderTemplatePicker`, `ReportSheet`, `ConfigurationErrorScreen`, **`AuthGateSheet`** (contextual sign-in prompt, root-mounted), **`ToastHost`** (root-mounted toast).

**Hooks (35):** read/mutation pairs per entity (`useBinders`, `useCreateBinder`, `useUpdateBinder`…), engagement (`useBinderEngagement`, `useComments`, `useSavedBinders`), discovery (`useDiscoverBinders`, `useBindersByTag`), safety (`useBlockUser`, `useReportContent`, `useDeleteAccount`), reorder (`useReorderCards`, `useReorderPages`, `useMoveCardToPage`), cards (`useCreateCard`, `useDuplicateCard`), search (`useSearch`, `useTcgCardSearch`, `useTagSearch`), **export (`usePageExport`)**.

**Lib:** Apple/Google OAuth wrappers (`auth.ts`), `env.ts` (launch-env validation), `observability.ts` (Sentry + PostHog), Supabase client, `pokemonTcg.ts`, `mirrorTcgCard.ts`, `uploads.ts`, `binderTemplates.ts`, validators/.

## Backend (Supabase)

**Tables (data model):**

- `profiles` (handle, display_name, avatar_url, bio, link, onboarded_at) — **no email column** (email lives in `auth.users`)
- `binders` (owner, title, cover, layout_type, accent_color, is_public) → `binder_pages` → `cards` (position-based slot, gap-tolerant for swap semantics)
- `card_photos` (1:N), `pokemon_tcg_cards` (canonical mirror from pokemontcg.io)
- Social: `follows`, `likes`, `saves`, `comments`, `tags`, `binder_tags`
- Safety: `user_blocks`, `reports` · Activity: `notifications` · Future: `wishlists`, `wishlist_items` (schema only)

RLS on everything. Storage buckets: binder covers, card photos, avatars, **`exports`** (w27 — public, holds server-composed page PNGs).

> **Anonymous-read RLS (w27).** The launch policies were already anon-ready: SELECT policies have no `TO` clause (default `PUBLIC`, includes `anon`) and collapse to their `is_public` branch when `auth.uid()` is null. Migration `…anon_read_public_content` therefore adds **explicit `anon` SELECT grants** on the public-read tables + **defense-in-depth revokes** on the private ones (`notifications`, `user_blocks`, `reports`, `wishlists`, `wishlist_items`) — verified: public 200, private binders empty, private tables 401. Writes stay auth-gated; private binders/profiles stay invisible to anon.

> **Auth → profile is trigger-driven (important).** A profile row is created automatically by the `on_auth_user_created` trigger → `handle_new_user()` (security-definer) on every `auth.users` insert. Onboarding only ever **UPDATEs** that row (sets handle + `onboarded_at`); it never inserts. **Consequence:** if anyone completes OAuth, a profile exists — so "0 profiles" only ever means "0 successful sign-ins."

**Edge functions (3):** `tcg-search` (proxy to pokemontcg.io), `delete-account` (security-definer cascading delete), **`page-export`** (w27 — **Path B server-compose**: reconstructs a page grid from catalog/photo URLs under the *caller's* RLS via ImageScript, stamps the wordmark + owner `@handle`, uploads the PNG to the `exports` bucket with the service role, returns a public CDN URL the client shares via RN `Share`). Its default watermark font is a pinned `@expo-google-fonts/inter` TTF — see Gotchas.

## Build, CI & release

**EAS profiles (5)** (`apps/mobile/eas.json`): `development`, `development-simulator`, `preview`, `production`, `staging` (internal-distribution channel for off-prod OTA smoke). Production has `autoIncrement: true` + `appVersionSource: remote`; `runtimeVersion` is 1.0.0 (OTA updates must match the installed build's runtime). Env vars baked per profile.

**`expo-dev-client` is in `devDependencies`** — critical for the Apple-rejection fix. Don't move it back. **iOS/Android prebuild gitignored** — EAS regenerates per build.

**CI** (`.github/workflows/ci.yml`): lint + typecheck + PostHog EU region guard on push to main / PR. Still no test runner (Turbo `test` task exists, unused).

**Release model:** OTA is the default — most changes ship JS-only via `eas update` after a TestFlight/staging smoke pass. **Path B (server-side compose) was chosen for page export specifically to keep the OTA cadence** (a native capture module would have forced build 15 + Apple review). Native rebuild only for native modules, `app.json` native config, icon/splash, entitlements, Reanimated/worklets ABI. Severity ladder + rollback rules in `decisions/2026-06-01-hotfix-policy.md`; smoke checklist in `SMOKE-TESTS.md`. Promote staging→prod by **republishing the tested bundle**, not re-bundling.

## Analytics & instrumentation

- **PostHog project 185260 on EU Cloud** (`eu.i.posthog.com`). A US host = silent ingest drop (bit twice pre-launch) — guarded in CI by `scripts/check-posthog-region.mjs`.
- **App** events use `$lib = posthog-react-native`; **website** (`bindercle.app`) uses `posthog-js` (`$pageview`, `landing_page_view`, `$web_vitals`). Person-based app tiles are scoped to `$lib = posthog-react-native` so web visitors don't inflate app MAU.
- **Pre-auth funnel (w27):** anonymous `feed_viewed` / `binder_viewed`, `signin_prompt_shown {trigger}` (trigger = like/save/follow/comment/create_binder/view_profile/view_notifications), `signin_prompt_dismissed`, `sign_in_attempted {trigger}`, then `sign_in_succeeded` → `onboarding_completed` → `binder_created` → `card_added`. Plus `page_exported {surface, shared}`.
- **Identity stitch now continuous:** the auth store no longer `reset()`s on a session-less launch, and `identify()` on sign-in merges the anonymous distinct_id — verified that one `person_id` carries the anon browse legs through `sign_in_succeeded`. (The old "funnels start at `sign_in_attempted`" limitation is resolved.)
- **Dashboards:** "Activation & Sign-in Health" (777504) and **"Bindercle — Weekly Performance" (809107)** — 15-tile app+website weekly-review board (activation funnel, sign-in health, acquisition, DAU/WAU/MAU app-only, retention, engagement, page-export loop, website pageviews + Core Web Vitals, and a sign-in-failures-by-provider×device watch tile).
- **Note (2026-07-15):** all `sign_in_failed` are Apple + "authorization attempt failed for an unknown reason", concentrated in a prior test week (0 in the last 7d), spread across real iOS devices — treated as test/dev noise; on watch via tiles ③/⑮.

## Key product/UX rules

- **Value-before-wall (w27):** browse read-only creates the want; the sign-in wall lands at the **action**, via one central `requireAuth(intent, action)` gate. On success the **intent resumes** (save/follow complete in place, drafts preserved; "build your own" routes through onboarding → `/binders/new`). Resume runs post-auth via an effect to avoid the worklet/stale-closure footgun.
- **No auth dead-ends:** guard bounces + sign-out + the you-tabs all lead to the browsable home or the dismissable gate, never a stranded `/sign-in`.
- **Binders are visual surfaces, not lists.** 4/9/16-pocket layouts mirror real binders; empty-pocket affordances + gap-tolerant positions.
- **Row-major, never column-major.** Explicit row chunks + `flex: 1` cells. Never `flexWrap: 'wrap'` + percentage widths. (Bit us twice.)
- **Cards are added by tapping an empty pocket** (`onEmptySlotPress`) — no generic "add card" button; page capacity is structurally protected. Duplicate path must respect capacity explicitly.
- **Reorganize uses native-feeling drag** (long-press + absolute-positioned card, swap on drop).
- **Per-binder uniform layout.** A binder commits to one pocket layout; pages inherit it; no per-page picker.
- **Onboarding ends in *building***: first-run routes to `/binders/new`, not the feed. First-card payoff toast + profile/binder empty-state CTAs shipped in w27.
- Reference (repo): `BRAND.md` (Holo Luxe tokens + voice — §2/§3 contradict on heading case; copy follows lowercase), `MASTER_PLAN.md`, `ROADMAP.md` (pre-rebrand).

## Current focus & roadmap

**Now — v1.0.2 (w27) shipped.** The sign-in-friction lever is implemented; focus shifts to **watching the now-measurable pre-auth funnel** (weekly dashboard 809107) and driving real traffic/installs. Open watch items: sign-in completion on real traffic (~35% over 30d, still noise-dominated), content creation (near-zero card adds in the last 2 weeks of test data), install volume.

**Deferred / next gate candidates:** price-freshness edge fn (`tcg-refresh`, gate-bound on a pricing surface), goal pages (wishlist + page-cost), card auto-image default. _(First-card toast + empty-state CTAs are now **done** — shipped in w27.)_

**Phases 1–3 complete:** profiles, binder/card CRUD + TCG autocomplete, real binder/page semantics, follows/likes/saves/comments, search, push, block/report. Plus anon browse + page export (w27).

**Post-launch (months 6–12):** Premium via RevenueCat, collaborative binders, DMs, AR holo, MTG/YGO expansion (data model is game-agnostic — `TcgGame = 'pokemon' | 'pokemon-japan'`).

## Gotchas for a new session

1. **Foilio == Bindercle.** Don't "fix" the rebrand without checking the rename plan.
2. **In-app strings still say "Pokemon"** — defensibly nominative; only App Store metadata had to scrub it. Don't rip them out.
3. **EAS build number is remote.** Don't bump `version` in `app.json` for a re-spin — `autoIncrement` handles it; `version` is marketing.
4. **Lockfile is `--frozen-lockfile`** — any `package.json` change → `pnpm install` + commit `pnpm-lock.yaml` together.
5. **Splash/icon are per-platform.** Override per-platform only deliberately.
6. **Reanimated v4 + worklets** — drag uses shared values + `runOnJS`; watch stale-closure footguns from worklet-triggered mutations. (The `requireAuth` resume deliberately fires from an effect on auth-state change for the same reason.)
7. **OTA works** (production channel, verified). JS-only ships via `eas update`; native changes still need a build + Apple review. Check the diff is JS-only before promising an OTA hotfix.
8. **`eas update` does NOT inherit eas.json's `env`.** Source `.env.local` into the shell first (`set -a && source .env.local && set +a`); **never** `--environment production` (pulls unconfigured EAS server env → ships an empty bundle).
9. **Metro caches Babel transforms — including broken ones.** If an update ran with empty env, purge `/private/var/folders/*/T/metro-cache` (+ `.expo`, `dist`) before retrying or you re-ship the byte-identical broken bundle.
10. **Apple Sign In works; error-1000 / "unknown reason" failures are device/Apple-side** (no iCloud/2FA, sheet dismissal, flaky Apple) — not a code bug. Supabase Apple provider **Client IDs must include the bundle id `app.bindercle.mobile`** (the native token's audience). We only suppress `ERR_REQUEST_CANCELED`, so "unknown reason" surfaces in `sign_in_failed`.
11. **"0 profiles" ≠ broken auth.** Profiles are trigger-created on OAuth success; zero profiles means zero successful sign-ins, usually a *traffic* problem. Cross-check `auth.users` against PostHog `sign_in_succeeded`.
12. **`page-export` needs a valid TTF at runtime** (server-side text rendering). The old `google/fonts@main` path 404'd → plain-bar watermark; default is now the pinned `@expo-google-fonts/inter@0.2.3/Inter_700Bold.ttf`, overridable via the `EXPORT_FONT_URL` secret. Re-deploy the function after changing it and confirm the wordmark renders.
13. **`eas update:republish` flag drift** — on eas-cli 20.x it's `--group <id> --destination-branch production` (NOT `--branch`, which conflicts). Promote the tested staging group rather than re-bundling.
14. **Anon-reachable screens must be session-safe.** Hooks that hit private tables (`useUnreadNotificationCount`, block-set hooks) are `enabled: !!viewerId` so they no-op for anon. New anon-visible screens must not fire owner-only queries unconditionally.

## Useful commands

```bash
pnpm dev                          # turbo: dev across workspace
pnpm typecheck && pnpm lint       # tsc + biome
node scripts/check-posthog-region.mjs   # PostHog EU region guard (also runs in CI)

# Supabase (w27): apply migrations in order, then deploy the export fn
supabase db push
supabase functions deploy page-export

# OTA release (JS-only) — env MUST be in shell, never --environment
cd apps/mobile && set -a && source .env.local && set +a
eas update --branch staging --message "..."          # smoke off-prod first
eas update:republish --group <id> --destination-branch production   # promote tested bundle
```

---

_Updated by Sani (with Claude) 2026-07-15. Re-paste an updated version into this file when the codebase changes materially._
