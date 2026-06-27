# Bindercle

Pokemon TCG collection showcase mobile app. Pinterest meets card collecting.

**Status:** WIP — Phase 0 (foundation). Not yet public.

## Documents

- [docs/CODEBASE.md](docs/CODEBASE.md) — technical onboarding / current state (post-launch source of truth)
- [MASTER_PLAN.md](MASTER_PLAN.md) — product strategy, scope, business model
- [BRAND.md](BRAND.md) — brand identity (Holo Luxe), design tokens
- [ROADMAP.md](ROADMAP.md) — week-by-week execution plan
- [decisions/2026-06-01-hotfix-policy.md](decisions/2026-06-01-hotfix-policy.md) — severity ladder + OTA/rollback rules
- [SMOKE-TESTS.md](SMOKE-TESTS.md) — pre-OTA smoke spec

## Repo layout

```
foilio/
├── apps/
│   └── mobile/              # Expo + React Native app
└── packages/
    ├── ui/                  # Design system, tokens, primitives
    ├── types/               # Shared TypeScript types
    └── api-client/          # Supabase + TCG API clients
```

## Getting started

```bash
pnpm install
pnpm dev                     # Run all dev tasks in parallel
pnpm mobile dev              # Just mobile dev server
```

## Scripts

```bash
pnpm lint                    # Biome lint
pnpm format                  # Biome format (writes)
pnpm typecheck               # tsc across all packages
pnpm test                    # tests across all packages
```
