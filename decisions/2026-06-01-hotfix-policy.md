# v1.0.1+ hotfix policy

**Status**: Decided 2026-06-01. Effective from Jun 10 release onwards.
**Owner**: Sani (final call on what to ship). PM (triage + recommendation).
**Why now**: OTA path verified end-to-end 2026-05-31 — we can ship JS-only fixes in minutes via `eas update --branch production`. Need a documented severity ladder so PM and Sani don't relitigate "should we hotfix this?" every time something breaks.

## TL;DR

| Priority | Triggers | Response | Ship via |
|---|---|---|---|
| **P0** | Data loss, auth broken, store crash on first launch, security/safety incident | **Hotfix within 24h** | OTA (if JS-only) or emergency build resubmission |
| **P1** | Degraded experience but app functional, affects >10% of users | **Batched into next weekly release** | OTA |
| **P2** | Polish, UX nits, minor cosmetic bugs | **Next minor version (v1.1)** | OTA or native build |
| **P3** | Nice-to-haves, edge cases | **Backlog** | Native build |

OTA is the default for JS-only changes (which is most of them, given the codebase). Native rebuild + Apple review is required only for: native module changes, `app.json` config changes, plist/manifest changes, new asset bundles that aren't dynamically loadable, anything touching Reanimated v4 / RN worklets ABI.

### Calibration data (from the Jun 1 ConfigurationErrorScreen incident)

- **Diagnose-to-fix on a JS-only P0 via OTA: ~20 min** (stress-tested under fire 2026-06-01). This is our real baseline, not a theoretical estimate. Use it for sizing recovery windows in incident comms.
- **OTA propagation** to a device that has the app open: next app launch (background→foreground does not trigger re-fetch by default). Plan comms accordingly — "we shipped a fix" ≠ "users have the fix."
- **The safeguard fired correctly even when broken** — error screen rendered, no native crash. Design boot-critical code so the failure mode degrades to a recoverable surface, not a crash.

---

## Severity definitions

### P0 — Critical, stop-everything-else

**Triggers** (any one is sufficient):

- **Data loss** — a user action results in their data being destroyed or corrupted (e.g. a delete operation cascades incorrectly, an edit silently overwrites prior state, a sync conflict mishandles).
- **Auth completely broken** — users cannot sign in or sign up. Includes: OAuth flow fails for >50% of attempts, session persistence broken, token refresh fails app-wide.
- **App crashes on first launch or first interaction** for >5% of users in any 1-hour window — Sentry alert threshold.
- **App Store / external dependency outage attributable to our code** (e.g. we ship a query that exhausts Supabase rate limits and breaks the backend for all users).
- **Security incident** — exposed credentials, RLS bypass, unauthorized data access reported by a user or detected internally.
- **Safety incident** — content involving minors, illegal content, harassment threat. Per Bindercle CLAUDE.md §8: legal/moderation/safety issues that the current system doesn't handle = immediate escalation.
- **App rejected post-release** by Apple (unusual but possible) — fix the issue, resubmit.

**Response**:
- PM notifies Sani within 30 mins of detection.
- Sani interrupts whatever he's doing.
- Diagnose + fix within 24h. If JS-only → OTA push. If native → emergency build + expedited Apple review request.
- Communicate publicly only if user-facing (App Store update note + social post acknowledging issue + fix). Security incidents: follow disclosure best practice (fix first, then disclose with timeline).

**Examples of P0 in Bindercle context**:
- Onboarding fails to save profile, blocking new users from using the app.
- A binder edit causes other users' binders to update (RLS bug).
- The `delete-account` edge function fails to cascade, leaving orphaned data.
- Push notification handler crashes on receive, killing the app.

### P1 — Degraded experience, ship in next weekly batch

**Triggers**:

- **A specific flow is broken but the app overall works** — e.g. add-card from one entry point fails, but other entry points work.
- **Performance regression** that doesn't crash but makes the app feel sluggish for >10% of users (e.g. binder detail load >5s consistently).
- **A feature is partially broken** — e.g. drag-to-reorder works on 9-pocket but not 16-pocket layouts.
- **Notification delivery failures** (push lands but content is wrong / opens wrong screen).
- **Image upload failures** for a non-trivial fraction of users.
- **Search returns wrong results** for common query patterns.
- **An empty state shows wrong copy or broken layout** but the feature itself works.

**Response**:
- PM logs in `current-state.md` under "Bindercle bugs in flight" with reproduction steps.
- Sani fixes when bandwidth permits (within 1 week).
- Batched into a single OTA push (typically Sunday evening SGT for minimal user disruption) along with any other P1s landed that week.
- No public communication beyond the eventual release.

**Examples**:
- Tag-picker autocomplete is slow.
- A search filter shows duplicates for users with specific data shapes.
- Avatar upload fails when picking from iCloud Photos but works for local.

### P2 — Polish, batch into v1.1 minor version

**Triggers**:

- **Cosmetic bug** that doesn't affect functionality (spacing off, color drift, animation jank).
- **Edge-case interaction bug** that affects <1% of usage paths (e.g. rare race condition in dropdown dismissal).
- **Copy / wording improvements** beyond clear bugs.
- **Minor UX inconsistencies** between features.

**Response**:
- Add to a `v1.1.0-candidates` list in `backlog.md` (file to be created when first item lands).
- Ship as part of v1.1 (typically 3-6 weeks post-v1.0 launch — TBD).

### P3 — Nice-to-have, backlog

**Triggers**:

- **Feature requests** dressed as bugs.
- **Personal preferences** voiced by one user.
- **Hypothetical edge cases** not yet observed in production.

**Response**:
- Note in `backlog.md` with timestamp and source (review, DM, etc.).
- Review during quarterly roadmap planning.

---

## OTA vs native rebuild decision matrix

**Default to OTA** for any JS-only change. OTA is fast (minutes), free (no Apple review), and verified working (2026-05-31). The list of things that **REQUIRE a native rebuild**:

| Change type | Why native rebuild required |
|---|---|
| Adding/removing a native module (anything in `package.json` dependencies that has a native podspec) | Native code must be re-linked + re-signed |
| Changing `app.json` — bundle identifier, iOS plist additions, app icon, splash screen image | These are baked into the binary |
| Changing `runtimeVersion` policy | OTA channel compatibility is tied to runtime version |
| Adding/changing custom URL schemes or universal links | Info.plist registration |
| Push notification entitlement changes | Provisioning profile must be re-signed |
| Reanimated v4 / RN worklets ABI changes | Native shared-library layer |
| Any asset NOT loaded dynamically (e.g. a new font file referenced statically in code) | Asset bundle is baked in |

**Anything else** — UI changes, logic fixes, copy edits, new screens, hook changes, validation tweaks, observability events, even most navigation changes — is JS-only and OTA-shippable.

**Critical**: every OTA push must come AFTER a smoke test pass on TestFlight. We don't push to production without verifying on a staging-equivalent.

### Boot-critical code has a verification gap

Standard smoke-testing ("install on TestFlight, tap through the app") cannot validate code that runs at module-eval before any UI renders — env-var validation, observability init, Supabase client creation, deep-link parsing. The Jun 1 incident is the canonical example: the validation function had a Metro inlining bug that made it always-fail on a fresh install. A normal in-session smoke test (open the app, tap around) wouldn't catch it because the bug only triggered on cold launch from background.

**Verification requirements for boot-critical OTA pushes**:

1. **Unit test the validation/init logic** against mocked inputs. E.g. `validateLaunchEnv()` called in a test with mocked `process.env` values.
2. **Cold-launch verification on a fresh TestFlight install** before promoting to production. Not just "I have the app open and it works" — actually kill the app and re-launch from scratch.
3. **Stagger the rollout** if at all possible — push to a test branch first, verify on a non-Sani device (a second TestFlight tester, a sim), then promote to production.

Boot-critical code: env validation, observability init, Supabase client creation, route guards in `_layout.tsx`, deep-link handling, push notification setup, fonts loading. Anything that runs before the user sees a screen they can interact with.

---

## Rollback policy

If an OTA push introduces a regression (rare, but possible):

1. **Detect**: Sentry alert spike or PostHog event-rate drop, typically within 1-2 hours of push.
2. **Decide**: rollback or roll-forward? Rule of thumb: if the regression affects >5% of users AND the fix isn't immediately obvious, rollback.
3. **Rollback**: republish the prior commit and `eas update --branch production --message "Rollback to <SHA>"`. Users get the prior JS bundle on next app open.
4. **Post-mortem**: write up what happened, why smoke test didn't catch it, what changes to the smoke test process would. Save to `releases/postmortems/<date>-<description>.md`.

If the regression is in the NATIVE binary (build 14 itself, post-launch):
- OTA can't fix a native bug. You'd need a build 15.
- If the bug is severe enough → emergency Apple review + build resubmit (~24-72h).
- If not severe → ride it until the next planned build.

---

## Decision authority

| Decision | Who calls it |
|---|---|
| Is this P0/P1/P2/P3? | PM proposes; Sani confirms |
| Ship the hotfix now? | Sani |
| Roll back an OTA push? | Sani (PM can recommend) |
| Pull build from sale (App Store removal)? | Sani only |
| Public communication about an incident? | Sani only (Marketing drafts copy) |
| Emergency Apple review request? | Sani only |

PM is the day-to-day triage filter. Sani is the publishing authority.

---

## What this policy does NOT cover

- **Feature requests** — handled in `backlog.md` (to be created) + quarterly roadmap planning.
- **Strategic product decisions** (Premium feature line, game expansion, AR holo) — handled per Bindercle CLAUDE.md §8 escalation list.
- **Marketing/social incidents** (a viral negative post, a creator complaint, a press miss) — Marketing manager scope.
- **App Store algorithm changes / Apple policy changes** — Marketing + PM jointly.

---

_Decided 2026-06-01 by Bindercle PM, signed off implicitly via the CLAUDE.md §9 onboarding sequence. Revisit if classification edge cases recur or if rollback frequency suggests the policy is too aggressive/permissive._
