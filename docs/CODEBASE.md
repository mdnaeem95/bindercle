# Bindercle — Codebase Onboarding

_Source-of-truth technical reference for the Bindercle PM scope. Updated by Sani (with Claude) 2026-06-27 — reflects post-launch state through the v1.0.1 OTA. Re-paste an updated version when the codebase changes materially._

**One-liner:** Pinterest for trading-card collectors. Themed binders of Pokémon TCG cards (architected to be game-agnostic). React Native / Expo on iOS+Android, Supabase backend. Solo-founder bootstrapped.

**Status (2026-06-27):** **Live.** v1.0.0 build 14 released on the App Store **2026-06-10**. **v1.0.1 shipped via OTA 2026-06-27** (JS-only; no build 15) — instrumentation fixes, onboarding "single-player wedge" (first-run now exits into binder creation, not the feed), and infra hardening (EAS staging channel, PostHog region CI guard, hotfix/smoke docs).

> 📉 **Post-launch reality check (from the 2026-06-22→27 analytics investigation):** auth is **not** broken — Apple/Google sign-in work. The constraint is **top-of-funnel**: of ~21 installs, only a handful ever attempted sign-in, and **sign-in completion is ~44%** sitting in front of **~100% binder activation** (everyone who onboards builds a binder). The DB holds ~7 real accounts (founder + reviewers + a few testers; the 5 `@foilio.test` seed personas were removed 2026-06-24). **The #1 product lever is sign-in conversion, not the product itself.**

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
  migrations/          13 SQL migrations, v1.0 schema (unchanged since launch)
  functions/           tcg-search, delete-account (edge functions)
website/               Static HTML (privacy / terms / support / landing)
scripts/
  seed.ts                    Local DB seeding (5 @foilio.test personas)
  check-posthog-region.mjs   v1.0.1 — CI guard: all PostHog hosts must be EU
decisions/
  2026-06-01-hotfix-policy.md  P0–P3 severity ladder + OTA/rollback rules
SMOKE-TESTS.md         v1.0.1 — pre-OTA smoke spec (+ boot-critical §B gate)
docs/
  CODEBASE.md          this file
```

**Tooling:** pnpm 10 + Turbo 2.5, Biome 1.9 (lint+format, no ESLint/Prettier), Lefthook (pre-commit biome+typecheck, conventional-commit on commit-msg), TypeScript strict.

## Mobile app structure (`apps/mobile/src/`)

**Routing — expo-router** (typed routes + react compiler both enabled):

- `app/_layout.tsx` — root: env validation gate → Sentry, PostHog, fonts, auth init, route guard
- `app/sign-in.tsx` (OAuth-only: Apple + Google, one-tap), `app/onboarding.tsx`
- `app/(tabs)/` — `index` (home feed), `create`, `search`, `notifications`, `profile`
- `app/binders/[id]/` — `index`, `edit`, `comments`, `pages/new`; `app/binders/new.tsx`
- `app/pages/[pageId]/` — `index`, `edit`, `cards/new`
- `app/cards/[cardId]/` — `index`, `edit`, `move`
- `app/users/[id].tsx`, `app/tags/[slug].tsx`, `app/profile/edit.tsx`, `app/settings.tsx`

**State:** Zustand for auth (`src/stores/auth.ts`), TanStack Query for all server state, react-hook-form + zod for forms.

**Components (9):** `BinderPageGrid`, `CardLayout`, `DraggableGrid`, `TcgCardSuggestions`, `TagPicker`, `UserProfileView`, `BinderTemplatePicker`, `ReportSheet`, `ConfigurationErrorScreen` (boot-time env-failure surface — see Gotchas).

**Hooks (34):** read/mutation pairs per entity (`useBinders`, `useCreateBinder`, `useUpdateBinder`…), engagement (`useBinderEngagement`, `useComments`, `useSavedBinders`), discovery (`useDiscoverBinders`, `useBindersByTag`), safety (`useBlockUser`, `useReportContent`, `useDeleteAccount`), reorder (`useReorderCards`, `useReorderPages`, `useMoveCardToPage`), cards (`useCreateCard`, `useDuplicateCard`), search (`useSearch`, `useTcgCardSearch`, `useTagSearch`).

**Lib:** Apple/Google OAuth wrappers (`auth.ts`), `env.ts` (launch-env validation), `observability.ts` (Sentry + PostHog), Supabase client, `pokemonTcg.ts`, `mirrorTcgCard.ts`, `uploads.ts`, `binderTemplates.ts`, validators/.

## Backend (Supabase)

**Tables (data model):**

- `profiles` (handle, display_name, avatar_url, bio, link, onboarded_at)
- `binders` (owner, title, cover, layout_type, accent_color, is_public) → `binder_pages` → `cards` (position-based slot, gap-tolerant for swap semantics)
- `card_photos` (1:N), `pokemon_tcg_cards` (canonical mirror from pokemontcg.io)
- Social: `follows`, `likes`, `saves`, `comments`, `tags`, `binder_tags`
- Safety: `user_blocks`, `reports` · Activity: `notifications` · Future: `wishlists`, `wishlist_items` (schema only)

RLS on everything. Storage buckets for binder covers + card photos.

> **Auth → profile is trigger-driven (important).** A profile row is created automatically by the `on_auth_user_created` trigger → `handle_new_user()` (security-definer) on every `auth.users` insert — it derives a default handle from the email local-part. Onboarding only ever **UPDATEs** that row (sets handle + `onboarded_at`); it never inserts. **Consequence:** if anyone completes OAuth, a profile exists — so "0 profiles" only ever means "0 successful sign-ins."

**Edge functions:** `tcg-search` (proxy to pokemontcg.io), `delete-account` (security-definer cascading delete).

## Build, CI & release

**EAS profiles (5)** (`apps/mobile/eas.json`): `development`, `development-simulator`, `preview`, `production`, `staging` (v1.0.1 — internal-distribution channel for off-prod OTA smoke). Production has `autoIncrement: true` + `appVersionSource: remote`; `runtimeVersion` is 1.0.0 (OTA updates must match the installed build's runtime). Env vars baked per profile.

**`expo-dev-client` is in `devDependencies`** — critical for the Apple-rejection fix. Don't move it back. **iOS/Android prebuild gitignored** — EAS regenerates per build.

**CI** (`.github/workflows/ci.yml`): lint + typecheck + PostHog EU region guard on push to main / PR. Still no test runner (Turbo `test` task exists, unused).

**Release model:** OTA is the default — most changes ship JS-only via `eas update` after a TestFlight/staging smoke pass. Native rebuild (Apple review) only for native modules, `app.json` native config, icon/splash, entitlements, Reanimated/worklets ABI. Severity ladder + rollback rules in `decisions/2026-06-01-hotfix-policy.md`; smoke checklist in `SMOKE-TESTS.md`.

## Analytics & instrumentation

- **PostHog project 185260 on EU Cloud** (`eu.i.posthog.com`). A US host = silent ingest drop (bit twice pre-launch) — now guarded in CI by `scripts/check-posthog-region.mjs`.
- **27 product events**, all firing (2026-06-22 audit: zero dead events). Key funnel: `Application Installed` → `sign_in_attempted` → `sign_in_succeeded` → `onboarding_completed` → `binder_created` → `card_added`.
- **Identity boundary:** `identify()` runs only on sign-in success, so `Application Installed` (anonymous) cannot chain into a sequential funnel — funnels start at `sign_in_attempted`.
- **Dashboard:** "Activation & Sign-in Health" (id 777504).

## Key product/UX rules

- **Binders are visual surfaces, not lists.** 4/9/16-pocket layouts mirror real binders; empty-pocket affordances + gap-tolerant positions.
- **Row-major, never column-major.** Explicit row chunks + `flex: 1` cells. Never `flexWrap: 'wrap'` + percentage widths. (Bit us twice.)
- **Cards are added by tapping an empty pocket** (`onEmptySlotPress`) — no generic "add card" button; page capacity is structurally protected. Duplicate path must respect capacity explicitly.
- **Reorganize uses native-feeling drag** (long-press + absolute-positioned card, swap on drop).
- **Per-binder uniform layout.** A binder commits to one pocket layout; pages inherit it; no per-page picker.
- **Onboarding ends in *building*** (v1.0.1): first-run routes to `/binders/new`, not the feed.
- Reference (repo): `BRAND.md` (Holo Luxe tokens + voice — note its §2/§3 contradict on heading case; v1.0.1 copy follows lowercase), `MASTER_PLAN.md`, `ROADMAP.md` (pre-rebrand).

## Current focus & roadmap

**Now — post-launch, v1.0.1 shipped.** Decision gate **Jun 28–30** for the next batch. Evidence-backed priority: **sign-in friction first** (value-before-wall — let users browse/peek before the auth wall; OAuth is already one-tap), over page export. Other gate candidates: goal pages, card auto-image default.

**Deferred from v1.0.1:** price-freshness edge fn (`tcg-refresh`, gate-bound on a pricing surface), first-card payoff toast, profile/binder empty-state CTAs.

**Phases 1–3 complete:** profiles, binder/card CRUD + TCG autocomplete, real binder/page semantics, follows/likes/saves/comments, search, push, block/report.

**Post-launch (months 6–12):** Premium via RevenueCat, collaborative binders, DMs, AR holo, MTG/YGO expansion (data model is game-agnostic — `TcgGame = 'pokemon' | 'pokemon-japan'`).

## Gotchas for a new session

1. **Foilio == Bindercle.** Don't "fix" the rebrand without checking the rename plan.
2. **In-app strings still say "Pokemon"** — defensibly nominative; only App Store metadata had to scrub it. Don't rip them out.
3. **EAS build number is remote.** Don't bump `version` in `app.json` for a re-spin — `autoIncrement` handles it; `version` is marketing.
4. **Lockfile is `--frozen-lockfile`** — any `package.json` change → `pnpm install` + commit `pnpm-lock.yaml` together.
5. **Splash/icon are per-platform.** Override per-platform only deliberately.
6. **Reanimated v4 + worklets** — drag uses shared values + `runOnJS`; watch stale-closure footguns from worklet-triggered mutations.
7. **OTA works** (production channel, verified). JS-only ships via `eas update`; native changes still need a build + Apple review. Check the diff is JS-only before promising an OTA hotfix.
8. **`eas update` does NOT inherit eas.json's `env`.** Source `.env.local` into the shell first (`set -a && source .env.local && set +a`); **never** `--environment production` (pulls unconfigured EAS server env → ships an empty bundle).
9. **Metro caches Babel transforms — including broken ones.** If an update ran with empty env, purge `/private/var/folders/*/T/metro-cache` (+ `.expo`, `dist`) before retrying or you re-ship the byte-identical broken bundle.
10. **Apple Sign In works; error-1000 failures are device-side** (no iCloud/2FA, sheet dismissal) — not a code bug. Supabase Apple provider **Client IDs must include the bundle id `app.bindercle.mobile`** (the native token's audience).
11. **"0 profiles" ≠ broken auth.** Profiles are trigger-created on OAuth success; zero profiles means zero successful sign-ins, usually a *traffic* problem. Cross-check `auth.users` against PostHog `sign_in_succeeded` before assuming a bug.

## Useful commands

```bash
pnpm dev                          # turbo: dev across workspace
pnpm typecheck && pnpm lint       # tsc + biome
node scripts/check-posthog-region.mjs   # PostHog EU region guard (also runs in CI)

# OTA release (JS-only) — env MUST be in shell, never --environment
cd apps/mobile && set -a && source .env.local && set +a
eas update --branch staging --message "..."          # smoke off-prod first
eas update:republish --group <id> --destination-branch production   # promote
```

---

_Updated by Sani (with Claude) 2026-06-27. Re-paste an updated version into this file when the codebase changes materially._
