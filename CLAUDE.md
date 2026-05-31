# Bindercle — Codebase Onboarding

**One-liner:** Pinterest for trading-card collectors. Themed binders of Pokémon TCG cards (architected to be game-agnostic). React Native / Expo on iOS+Android, Supabase backend. Solo-founder bootstrapped.

**Status (2026-05-31):** v1.0.0 build 14 **approved by Apple, pending manual release. Targeted public launch: 2026-06-10.** Apple rejected build 12 on 2026-05-27 (2.2 beta-testing features, 4.1(c) "Pokemon" in subtitle); fixes shipped in build 14 — `expo-dev-client` moved to devDeps so dev-launcher pods don't link into prod, App Store Connect subtitle/keywords/description rewritten to scrub brand names, real Bindercle icon + splash wired up.

> ⚠️ **The repo still uses the pre-rebrand name "Foilio" in many places** ([README.md](README.md), [ROADMAP.md](ROADMAP.md), `package.json` name/description, the workspace package scope `@foilio/*`, the EAS slug `foilio`, the Sentry project). See [RENAME-NEXTSTEPS.md](RENAME-NEXTSTEPS.md). User-facing branding is fully "Bindercle". Treat `Foilio == Bindercle`.

---

## Monorepo layout

```
apps/
  mobile/              Expo 56 + RN 0.85 + React 19.2 — the actual app
packages/
  ui/                  Design system: Button, Input, Avatar, CardThumbnail,
                       PageThumbnail, BinderCard, BindercleWordmark,
                       AccentPicker, Surface, Text, HoloGradient, ChipGroup
                       + theme tokens (dark only)
  api-client/          createFoilioClient (Supabase wrapper) + generated DB types
                       + row-type aliases (Profile, Binder, Card, etc.)
supabase/
  migrations/          13 SQL migrations, v1.0 schema (see data model below)
  functions/           tcg-search, delete-account (edge functions)
website/               Static HTML (privacy / terms / support / landing)
scripts/seed.ts        Local DB seeding
```

Tooling: pnpm 10 + Turbo 2.5, Biome 1.9 (lint+format, no ESLint/Prettier), Lefthook (pre-commit biome+typecheck, conventional-commit on commit-msg), TypeScript strict.

## Mobile app structure (`apps/mobile/src/`)

**Routing — expo-router** (typed routes + react compiler both enabled):

- `app/_layout.tsx` — root: Sentry, PostHog, fonts, auth init, route guard
- `app/sign-in.tsx`, `app/onboarding.tsx`
- `app/(tabs)/` — `index` (home feed), `create`, `search`, `notifications`, `profile`
- `app/binders/[id]/` — `index`, `edit`, `comments`, `pages/new`
- `app/binders/new.tsx`
- `app/pages/[pageId]/` — `index`, `edit`, `cards/new`
- `app/cards/[cardId]/` — `index`, `edit`, `move`
- `app/users/[id].tsx`, `app/tags/[slug].tsx`, `app/profile/edit.tsx`, `app/settings.tsx`

**State:** Zustand for auth ([src/stores/auth.ts](apps/mobile/src/stores/auth.ts)), TanStack Query for everything server-side, react-hook-form + zod for forms.

**Components (8):** `BinderPageGrid`, `CardLayout`, `DraggableGrid`, `TcgCardSuggestions`, `TagPicker`, `UserProfileView`, `BinderTemplatePicker`, `ReportSheet`.

**Hooks (36):** read/mutation pairs for every entity (`useBinders`, `useCreateBinder`, `useUpdateBinder`, etc.), engagement (`useBinderEngagement`, `useComments`, `useSavedBinders`), safety (`useBlockUser`, `useReportContent`, `useDeleteAccount`), reorder (`useReorderCards`, `useReorderPages`, `useMoveCardToPage`), search (`useSearch`, `useTcgCardSearch`, `useTagSearch`).

**Lib:** Apple/Google OAuth wrappers, Sentry+PostHog setup ([observability.ts](apps/mobile/src/lib/observability.ts)), Supabase client, `pokemonTcg.ts` API wrapper, `mirrorTcgCard.ts` (mirrors external API rows into local `pokemon_tcg_cards`), `uploads.ts` (compress + Supabase storage), `binderTemplates.ts`, validators/.

## Backend (Supabase)

**Tables (data model):**

- `profiles` (handle, display_name, avatar_url, bio, onboarded_at)
- `binders` (owner, title, cover, layout_type, accent_color, is_public) → `binder_pages` (named pages inside a binder) → `cards` (position-based slot, can have gaps for swap semantics)
- `card_photos` (1:N for cards), `pokemon_tcg_cards` (canonical mirror from pokemontcg.io)
- Social: `follows`, `likes`, `saves`, `comments`, `tags`, `binder_tags`
- Safety: `user_blocks`, `reports`
- Activity: `notifications`
- Future: `wishlists`, `wishlist_items` (schema only)

RLS on everything. Storage buckets for binder covers + card photos.

**Edge functions:** `tcg-search` (proxy to pokemontcg.io), `delete-account` (security-definer cascading delete).

## Build & CI

**EAS profiles** ([apps/mobile/eas.json](apps/mobile/eas.json)): `development`, `development-simulator`, `preview`, `production`. Production has `autoIncrement: true` + `appVersionSource: remote`, so build numbers are managed server-side. Env vars (Supabase, Sentry, PostHog) are baked per profile.

**`expo-dev-client` is in `devDependencies`** (not `dependencies`) — critical for the Apple rejection fix. Don't move it back.

**iOS prebuild is gitignored** (`/ios`, `/android`) — EAS regenerates on every build.

**CI:** Single workflow `.github/workflows/ci.yml` — lint + typecheck on push to main / PR. No tests configured yet (Turbo `test` task exists, no runner).

## Key product/UX rules

- **Binders are visual surfaces, not lists.** 4/9/16-pocket layouts mirror real binders, including empty pocket affordances and gap-tolerant card positions (you can leave slot 1 empty and put a card in slot 4).
- **Row-major, never column-major.** All grids use explicit row chunks + `flex: 1` cells. Never `flexWrap: 'wrap'` + percentage widths. (Bit us twice in production.)
- **Reorganize uses native-feeling drag** (long-press + absolute-positioned card, swap on drop) — not list-style drag.
- **Per-binder uniform layout.** A binder is committed to one pocket layout; pages inherit it; no per-page picker.
- Reference: [BRAND.md](BRAND.md) for design tokens, voice, and "Holo Luxe" aesthetic. [MASTER_PLAN.md](MASTER_PLAN.md) for product strategy. [ROADMAP.md](ROADMAP.md) for week-by-week plan (note: written pre-rebrand).

## Current focus & near-term roadmap

**Now (Phase 5 — pre-launch hold, T-10 days):**

- Build 14 approved, awaiting manual release on **2026-06-10**.
- Launch day: coordinated TikTok/Bluesky/X posts, email waitlist via Resend, creator coordination per [bindercle-social-agent.md](bindercle-social-agent.md).
- **OTA is enabled and verified working** (2026-06-01). [apps/mobile/app.json:70-72](apps/mobile/app.json#L70-L72) has `updates.url` on the `production` channel. The earlier "OTA crashes on launch" was a downstream symptom of EXPO_PUBLIC_* env vars not being injected at bundle-build time (Supabase `createClient(undefined, undefined)` threw at module load, expo-updates' ErrorRecovery caught + re-threw as launch abort); commit `fbb9917` fixed env-var injection in `eas.json` and re-enabled OTA. First publish to `production` channel succeeded against build 14 on TestFlight — features from commit `474fa00` shipped over OTA without a rebuild. **Hotfix path is real.** Native changes still require a new EAS build + Apple review.

**Phases 1-3 are largely complete** per [ROADMAP.md](ROADMAP.md): profiles, binder CRUD, card upload + TCG autocomplete, binder/page detail with real binder semantics, follows/likes/saves/comments, search by user/binder/card/tag, push notifications, block/report.

**Phase 2 "smart features" partly deferred:** ML/OCR card scanning (planned Weeks 9-10), wishlists (schema present, UI deferred), collection stats, profile theming variants beyond accent color.

**Post-launch (months 6-12):** Premium tier via RevenueCat, collaborative binders, DMs, AR holo preview, live binder reveals, possible expansion to MTG/YGO (data model is already game-agnostic — see `TcgGame = 'pokemon' | 'pokemon-japan'` in [pokemonTcg.ts](apps/mobile/src/lib/pokemonTcg.ts)).

## Gotchas for a new session

1. **Foilio == Bindercle.** Don't "fix" the rebrand inconsistency without checking the rename plan.
2. **In-app strings still say "Pokemon"** (placeholders, blurbs). That's *defensibly* nominative use; only App Store metadata had to scrub it. Don't proactively rip those out.
3. **EAS build number is remote.** Don't bump `version` in `app.json` for a re-spin — `autoIncrement` handles build number, `version` is the marketing version.
4. **Lockfile is `--frozen-lockfile`** in CI. Any `package.json` change → run `pnpm install` and commit `pnpm-lock.yaml` in the same PR.
5. **Splash and icon are configured per-platform.** Top-level `icon`/splash `image` applies to both; only override per-platform with a deliberate reason.
6. **Reanimated v4 + react-native-worklets** — drag gestures use shared values + `runOnJS` to commit. Watch for stale-closure footguns in mutations triggered from worklets.
7. **OTA works** (`production` channel, verified 2026-06-01). JS-only changes can ship via `eas update --branch production` without a rebuild. Native changes (new packages, app.json native config, icon/splash) still need a new EAS build + Apple review. Don't promise an OTA hotfix for a change that touches native — check whether the diff is JS-only first.

## Useful commands

```bash
pnpm dev                     # turbo: run dev across workspace
pnpm mobile dev              # mobile dev server only
pnpm typecheck               # tsc across all packages
pnpm lint                    # biome check
pnpm format                  # biome format --write
pnpm --filter @foilio/mobile exec eas build --profile production
```
