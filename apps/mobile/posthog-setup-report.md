<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Foilio mobile app (Expo / React Native).

## Summary of changes

- **`src/lib/observability.ts`** — Already contained PostHog initialization, `trackEvent`, `identifyUser`, and `clearUserIdentity` helpers. Updated `EXPO_PUBLIC_POSTHOG_HOST` to the EU endpoint (`https://eu.i.posthog.com`).
- **`src/app/_layout.tsx`** — Added `PostHogProvider` wrapping the app tree (enables `usePostHog()` hook everywhere), plus manual screen tracking with `usePathname` and `useGlobalSearchParams` for Expo Router.
- **`src/app/sign-in.tsx`** — Added `sign_in_attempted` (on button press) and `sign_in_failed` (on non-cancellation errors) events for both Apple and Google providers.
- **`src/app/index.tsx`** — Added `sign_out_tapped` event on the sign-out button press.
- **`src/stores/auth.ts`** — Added `sign_in_succeeded` event on `SIGNED_IN` auth state transitions, capturing the OAuth provider.
- **`.env.local`** — Set `EXPO_PUBLIC_POSTHOG_API_KEY` and updated `EXPO_PUBLIC_POSTHOG_HOST` to `https://eu.i.posthog.com`.

User identification was already in place via `identifyUser` in the auth store (`applySession`), which calls `posthog.identify()` with the user's Supabase ID and email on every session change.

## Event tracking table

| Event | Description | File |
|---|---|---|
| `sign_in_attempted` | User tapped a sign-in button (Apple or Google) | `src/app/sign-in.tsx` |
| `sign_in_succeeded` | User successfully authenticated via OAuth | `src/stores/auth.ts` |
| `sign_in_failed` | Sign-in attempt failed (non-cancellation error) | `src/app/sign-in.tsx` |
| `sign_out_tapped` | User tapped the sign-out button on the home screen | `src/app/index.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/699754)
- [Sign-in attempts over time](/insights/HFsxxYrx) — Daily attempts broken down by provider (Apple vs Google)
- [Sign-in conversion funnel](/insights/KxafizZa) — Conversion rate from sign-in attempted → succeeded
- [Sign-in failures over time](/insights/lz9uYXNM) — Auth error trends broken down by provider
- [Daily active users](/insights/3g2SFZ5l) — Unique users signing in per day
- [Sign-out events over time](/insights/sQNA2aBZ) — Churn signal: how often users sign out

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-expo/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
