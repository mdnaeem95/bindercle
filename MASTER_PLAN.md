# Foilio — Master Plan

*Pokemon-first collector showcase app for mobile.*

> **Status:** Draft v0.2 — decisions locked from first review.
> Sections marked **🟡 Decision needed** are the ones where your input will most meaningfully reshape the plan.

## Decisions locked (from review round 1)

- ✅ **Pokemon TCG only** at launch. No multi-TCG architecture work in v1.0.
- ✅ **Supabase** as the backend.
- ✅ **Full-time** development commitment — roadmap re-paced accordingly.
- ✅ **No trading mechanics, ever-in-MVP.** Insight from review: *"These are people's collections — I doubt they'd wanna trade."* Reinforces the showcase-over-transaction thesis. Moved to non-goals.
- ✅ **Combine original MVP + v1.5** into a single Launch v1.0 — the original MVP was too barebones to ship. Section 3 reworked.
- ✅ **Solo dev** end-to-end. No designer, no contractors planned. Implication: design system + branding work is in-scope for build phases; need to lean on excellent component primitives + AI-assisted design tooling to compensate.
- ✅ **Name: Foilio** — portmanteau of *foil* (collector word for holo cards) + *folio* (binder / book of pages). Vetted: no existing app or major brand, USPTO search clean on exact spelling. Formal TM filing + domain registration to happen in Phase 0. *Names ruled out along the way: "Funco" (too close to Funko Pop), "Folio" (NFT social network in 2022 + every relevant domain taken), "BinDex" (collides with 45-year-old Bindex office-supplies brand making lever-arch files — direct category overlap).*
- ✅ **Funding: bootstrap out of pocket.** Single-member LLC structure is sufficient. No outside cap table. Implication: monetization patience is finite — runway is personal savings, so premium tier timing in §8 may need tightening if Phase 1 burns longer than expected.
- ✅ **Profile customization: moderate.** Themes, badges, accent color, layout switches — *not* Linktree/MySpace-style backgrounds and custom CSS. Keeps moderation surface manageable and design quality controlled.
- ✅ **Smart card scan: OCR + Pokemon TCG API fuzzy match** for v1.0. Custom ML model is a v2.0 investment, made only after we have real failure-mode data from production usage.
- ✅ **Beta channel: cold start, no existing TCG creator relationships.** Implication: creator outreach is a *parallel workstream* starting in Phase 1, not a Phase 3 task. Cold outreach is slow and high-rejection — needs runway. Section 11 roadmap updated.
- ✅ **Premium tier feel: Linear-style.** Generous free tier, paid feels polished and worth-it, not exploitative. Free tier should not feel intentionally crippled. Section 8 updated.

---

## 1. Vision & Positioning

**One-liner:** Pinterest for trading card collectors — a social home for showing off curated, themed, and aesthetic-driven collections, not just tracking what you own.

**Why this gap exists:**
- **Collectr / Dex / Card Dex** → optimized for inventory, valuation, and portfolio tracking. They're spreadsheets with cover art.
- **eBay / TCGPlayer** → marketplaces. Transactional, not communal.
- **Reddit / Discord / TikTok** → social, but ephemeral and not card-native. A "dabbing Pokemon master set" deserves better than a comment thread.

**The wedge:** themed collections, binder aesthetics, and personality-driven curation are first-class citizens. Inventory tracking is a *side effect* of showcasing, not the goal.

**Sharpening this further:** the app is about *display*, not *transaction*. Collectors curate their themed sets *because they love them* — they don't want to trade them. This rules out marketplace and trade-matchmaking from the product roadmap (not as v2.0 features, as permanent non-goals) and frees us to invest entirely in showcase quality.

**Tagline candidates (placeholders, not branding):**
- *"Show your stash."*
- *"Binders worth flexing."*
- *"Where collections become art."*

---

## 2. Target Audience

| Tier | Audience | Why they care |
|------|----------|----------------|
| **Primary** | Active TCG collectors with curated themes/aesthetics | They already make TikToks/Reels about their collections. We give them a permanent home. |
| **Secondary** | Lapsed/casual collectors browsing for inspiration | Discovery + nostalgia driver. Pinterest's "lurkers" cohort. |
| **Tertiary** | Card artists and creative communities (alt art, custom cards) | Adjacent creative niche — broadens content variety. |

> **Note on TCG scope:** Pokemon-only at launch (locked). Long-term TCG expansion is a *post-PMF* question, not a v2.0 feature. The data model will be designed to allow it without major rework, but no time is spent on multi-TCG abstractions in v1.0.

**Personas (light):**
- **"Showcase Sam"** (24) — 4 years collecting, builds themed master sets, posts on TikTok. Will be a power creator.
- **"Lurker Lia"** (31) — Saved cards as a kid, scrolls binders for nostalgia. Future re-engager.
- **"Artist Aki"** (28) — Doesn't collect heavily but loves card art and binder aesthetics. Engages on inspiration.

---

## 3. Core Features

### Launch v1.0 — what ships at first public release

The original v1.0/v1.5 split would have produced a barebones launch. Combined into a single, polished v1.0 — the showcase experience needs to feel magical from day one, not iteratively patched together.

1. **Auth & onboarding**
   - Passkeys-first, with Apple/Google social login
   - 4-screen onboarding (vibe-setting, not data collection)
   - Pick favorite themes / sets for cold-start feed
2. **Profile**
   - Avatar, handle, bio, link
   - Grid of public binders
   - Followers / following counts
   - **Profile customization** — themes, badges, layout options
3. **Binders (collections)**
   - Create a themed binder ("Dabbing Pokemon", "Charizards", "Holo Bulbasaurs")
   - Cover image, title, description, tags, public/private
   - Drag-to-reorder cards
4. **Cards**
   - Upload via camera or photo library
   - Multiple photos per card (front, back, holo angles)
   - **Smart card scan** — OCR card name + set number, auto-match against Pokemon TCG API (manual override always one tap away)
   - **TCG API integration** — autocomplete + accurate metadata (set, number, rarity, illustrator, release year) from [pokemontcg.io](https://pokemontcg.io)
   - Condition, personal notes, "where I pulled it" story
5. **Wishlists**
   - "Cards I want" — a separate collection type
   - Helps community engagement loops (find people with similar tastes)
6. **Collection stats**
   - Completion % per set
   - Card count, binder count
   - Time-collecting graph
   - Value tracking (opt-in, via TCGPlayer pricing API)
7. **Feed**
   - Pinterest-style masonry layout
   - Personalized via followed users + tag affinity
   - "For You" and "Following" tabs
8. **Discovery**
   - Search by tag, user, set, card name
   - Trending binders / cards
   - Curated themes (editorial picks for cold-start)
9. **Social primitives**
   - Like, save, comment
   - Follow / unfollow
   - Share to external (TikTok, Instagram, X) — never lose the share lever
10. **Push notifications**
    - Granular preferences from day 1
11. **Settings**
    - Privacy, blocking, data export, account deletion (compliance + trust)

### v2.0 — months 3-9 post-launch

- **Collaborative binders** — multi-user curation (think Pinterest group boards)
- **DMs** — with safety-by-default (off for under-18s)
- **AR features** — virtual binder placement, holo card preview using device gyro
- **Premium tier launches** (see Section 8)
- **Live binder reveals** (event-style sessions, Twitch-lite for new pulls)
- **Smart scan v2** — ML model trained on our own corpus for non-Pokemon-TCG-API-matchable images (alt arts, custom cards, error cards)

### Explicit non-goals (permanent — not deferred features)

- ❌ **Trading / "open to trade" matchmaking.** *Locked: collectors curate their themed sets because they love them, not to trade them. The whole product is about display, not transaction.*
- ❌ **Buying/selling marketplace.** Regulatory + fraud + KYC = different company.
- ❌ **Real-money exchange of any kind** between users.
- ❌ **NFT / crypto integration.** Toxic in TCG community.
- ❌ **Web app as primary experience.** Mobile-first; web is read-only marketing + shared binder links in v1.0.

---

## 4. Tech Stack (2026)

### Mobile

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **React Native** (New Architecture: Fabric + TurboModules) | Your existing skill. New Arch is mature in 2026. |
| Runtime | **Expo SDK (latest)** with EAS | Best DX, OTA updates, prebuild flexibility |
| Language | **TypeScript** (strict mode, no `any`) | Default for serious projects |
| Routing | **Expo Router** (file-based) | Standard, deep-link friendly |
| Styling | **NativeWind** (Tailwind for RN) or **Tamagui** | Tamagui has better perf for design systems; NativeWind is simpler |
| Animations | **Reanimated 4** + **Skia** | Skia for card-art shimmer/holo effects |
| Client state | **Zustand** | Lean, no boilerplate |
| Server state | **TanStack Query** | Cache + optimistic updates baked in |
| Forms | **React Hook Form** + **Zod** | Type-safe end-to-end |
| Local DB | **Expo SQLite** or **WatermelonDB** | Offline-first binder editing |
| Testing | **Vitest** (unit), **Maestro** (E2E) | Maestro is the 2026 standard |
| Crash/error | **Sentry** | Industry default |

### Backend — Supabase ✅

**Decision locked.** Reasons:

- **Postgres handles social graphs natively.** Follows, likes, feed ranking — all relational queries. Firestore/Convex's document model fights this.
- **Row-Level Security** handles most authorization without backend code. Auth policies live next to the data.
- **Bundled services** — auth, storage, realtime, edge functions — cut the vendor count for a solo dev.
- **Low lock-in.** It's just Postgres underneath. If we ever outgrow it, we migrate the DB and keep going. Convex/Firebase migrations are far harder.

**What we'll use:**
- **Postgres** for all relational data (users, binders, cards, follows, likes, comments)
- **Supabase Auth** for passkeys + OAuth + magic links
- **Supabase Storage** for card images (or migrate to Cloudflare R2 if storage costs spike)
- **Supabase Realtime** for live counts (likes, viewers) — sparingly, it's not free at scale
- **Edge Functions** for image-processing webhooks (resize, moderate, generate variants)
- **RLS policies** as the primary authorization layer

**Worth weighing later (not now):**
- Migrate to **Cloudflare R2 + Images** for storage if costs scale faster than user growth
- Add a custom search index (**Meilisearch** or **Typesense**) when Postgres full-text search isn't enough

### Image & media

- **Cloudflare R2** for storage + **Cloudflare Images** for transforms, OR **Cloudinary** for simplicity
- AVIF/WebP with fallbacks, multiple sizes via CDN
- Direct-to-storage uploads via signed URLs (never proxy through API)
- Smart card-crop pipeline (rotate, square, polish)

### Card data

- **[pokemontcg.io](https://pokemontcg.io)** — free, comprehensive, well-maintained API
- Mirror locally to our DB for speed + offline + customization
- Optional: TCGPlayer pricing API for value features (post-MVP)

### Other services

- **Auth:** Supabase Auth (passkeys + OAuth) or Clerk (more polish, more $)
- **Push:** Expo Push Notifications (free, fine for our scale)
- **Payments / IAP:** **RevenueCat** (industry standard for subscription apps)
- **Product analytics:** **PostHog** (open-core, privacy-friendly, session replay)
- **Feature flags:** PostHog (consolidate) or ConfigCat
- **Email:** Resend or Loops
- **Moderation:** AWS Rekognition + Cloudflare CSAM scanning + human review queue

### Repo & tooling

- Monorepo via **Turborepo** or **Nx** (mobile + future web in one place)
- **Biome** or **ESLint + Prettier** in CI
- **Lefthook** for pre-commit hooks
- **GitHub Actions** for CI, **EAS Build/Submit** for native
- **Renovate / Dependabot** for deps

---

## 5. Architecture Principles

- **Offline-first** for binder creation/editing — sync when online
- **Optimistic UI** for all social actions (like, follow, comment)
- **Image-first uploads** — direct to R2/Cloudinary, never via API server
- **Background sync** for queued actions
- **Modular feature folders** — `features/binders/`, `features/feed/`, not `components/screens/utils/`
- **API contracts** — generated types from Postgres schema (Supabase) or tRPC
- **Strict typing** — `any` is a code review block
- **Feature flags** for every risky feature — kill switches save weekends

---

## 6. UI/UX Direction

### Design principles

1. **Cards are the hero.** Chrome recedes; art shines.
2. **Tactile.** Cards have depth, weight, shimmer. Use Skia for holo angle effects.
3. **Effortless creation.** Friction at upload = death of UGC apps.
4. **Inspirational, not informational.** Counts and stats are secondary.
5. **Dark mode primary.** Showcase aesthetic, card art pops on dark backgrounds.

### Key flows

- **Onboarding** — vibe-first, 4 screens max, ends with "follow these binders"
- **Home feed** — masonry, infinite scroll, double-tap to like, hold to peek
- **Binder view** — immersive, hero card on top, parallax scroll, holo cards tilt with device gyro
- **Card detail** — pinch-to-zoom, multiple angles, metadata as a swipe-up sheet
- **Create binder** — template-driven ("themed master set", "rainbow rares", "type collection") with custom option
- **Add card** — camera-first, ML-suggested metadata, manual fallback always one tap away

### Design system

- Build a custom system on top of RN primitives (don't import a UI kit — they all look the same)
- Tokens: 8-pt spacing, 4 elevation levels, 6 type sizes
- Component library lives in `packages/ui/`
- Storybook (web) for component dev
- Accessibility: WCAG 2.2 AA target, full screen reader support, dynamic type

### Animations

- Card flip on tap
- Holo shimmer (Skia + gyro)
- Page transitions via Reanimated shared elements
- 60fps target on iPhone 12 / Pixel 6 and above

### Empty states

- Custom illustrations (Pokemon-adjacent but never IP-infringing)
- Each empty state has a CTA, never a dead end

---

## 7. Branding

### Name — Foilio ✅

**Foil + Folio.** Decided.

- **Foil** is the collector word for holo / shiny cards — the visual hook of the entire hobby. Carries unmistakable TCG resonance.
- **Folio** is the binder / book-of-pages root — the physical object the app is digitizing.
- Pronounced "FOY-lee-oh" (rhymes with Folio).
- Made-up word: no incumbent app or significant brand uses it, USPTO search returned clean on exact spelling.
- TCG-agnostic for future expansion, but Pokemon-first in marketing voice.

### Brand voice & taglines (working)

- *"Foilio — your collection, on display."*
- *"Where your binders become art."*
- *"Foilio. Show your shine."*

### Phase 0 brand to-dos

- USPTO TESS filing in Class 9 (mobile apps) + Class 42 (social networking services)
- Register: `foilio.com`, `foilio.app`, `getfoilio.com` as fallbacks; handles on TikTok / Instagram / X / Threads / Bluesky
- International trademark search (WIPO Madrid) — TCG community is global
- LLC formation (see funding posture in §13)

### Names ruled out along the way

| Name | Why it didn't make it |
|------|------------------------|
| Funco | Too close to Funko Pop (collectibles giant, aggressive TM enforcement) |
| Folio | NFT social network filed in 2022; every relevant domain taken |
| BinDex | Direct category conflict with 45-year-old Bindex office-supplies brand (lever-arch files); "Dex" suffix invites Pokemon Co. scrutiny |
| Bindery, Sleeve, Stash, Pulled, Cabinet, Showcase, Cardio, Setlist, Vault, Showpiece, Holo, Hit, Caught, Glint, Spark, Curio, Shimmer | Earlier shortlists — set aside in favor of Foilio |

### Brand personality

- **Playful but not childish** — adults collect too
- **Aesthetic-focused** — design quality is the marketing
- **Inclusive** — every collection style welcome, no gatekeeping
- **Confident, not corporate** — first-person voice

### Visual identity (starting direction)

- Logo: wordmark + simple geometric mark (think Notion, Linear)
- Palette: bold accent (electric blue or holo-rainbow) + neutral dark base
- Typography: geometric sans (Inter or General Sans) + serif accent for editorial moments
- Illustrations: custom, slightly retro, never literal Pokemon

---

## 8. Business Model

### Phase 1 — Months 0-12: 100% free, focus on PMF

No monetization. Build community, find product-market fit, fix the obvious. Premature monetization kills social apps.

### Phase 2 — Months 12-24: Freemium subscription (Linear-style)

**Design philosophy: free is generous, paid is polished.** The free tier never feels crippled. The paid tier feels worth-it the moment you upgrade — because it adds polish and power, not because the free tier hits a wall designed to frustrate. In a community-driven aesthetic-first app, an aggressive freemium funnel reads as exploitative and erodes trust. The free tier *is* the marketing — every shared binder URL from a free user is a recruiting moment.

- **Free tier (generous):**
  - Unlimited cards
  - Up to 10 public binders
  - Full social features (post, follow, like, comment)
  - Smart card scan
  - Basic stats
  - All core features functional, no artificial walls
- **Premium ($4.99/mo or $39/yr):**
  - Unlimited binders
  - Profile customization (themes, badges, accent colors, layouts) — *moderate scope, not Linktree-style*
  - Advanced analytics (who saved your binders, reach over time, audience insights)
  - Priority feature requests
  - No ads (if ads ever exist — currently no ads planned)
  - Early access to new features (1-2 weeks ahead)
  - Exclusive badges & profile flair
- Billed via App Store / Play Store IAP, managed through **RevenueCat**

> **Note:** Funding is bootstrap out of pocket. If personal runway is tighter than expected, premium tier timing may need to compress from month 12 to as early as month 6-9. Decision will be triggered by burn rate, not arbitrary calendar.

### Phase 3 — Additional revenue streams (Year 2+)

- **Affiliate revenue** — tap a card → buy on TCGPlayer/eBay → we get a cut. Transparent, opt-in.
- **Sponsored content** — clearly labeled, from official card sets/products
- **Creator tools** — Patreon-style tipping for top binder creators (we take small platform fee)

### Things to avoid

- ❌ **Marketplace fees** — different business, different team, different regulatory regime
- ❌ **Pure ad model** — degrades the visual experience that *is* the product
- ❌ **Selling user data** — instant credibility death in a passionate community
- ❌ **NFT / crypto pivots** — toxic in TCG culture

### Unit economics sketch (rough)

- Image storage costs scale ~linearly with active users
- Estimate ~$0.05-0.15/MAU at scale (CDN + storage + compute)
- Premium conversion target: 3-5% (Pinterest is ~1%, niche apps hit 5-10%)
- LTV target: $30-60/user (Premium subscribers)

---

## 9. Security & Privacy

### Auth & access

- Passkeys default, Apple/Google fallback, email magic link as last resort
- Refresh token rotation
- Biometric re-auth for sensitive actions (account deletion, email change)
- Rate limiting on all auth endpoints (per IP + per account)
- Device fingerprinting for anomaly detection

### Data protection

- TLS 1.3 everywhere
- At-rest encryption for DB and storage
- PII minimization — collect only what we need
- Right-to-delete in-app (GDPR + CCPA compliant)
- Data export in-app (JSON download)

### Content safety

- **Image moderation pipeline:** AWS Rekognition (NSFW) + Cloudflare CSAM scanning + human review queue
- Block/report on every user-generated surface
- Hidden-by-default content for accounts < 7 days old
- Anti-spam signals (rate limits, content similarity, behavioral patterns)
- Word filter for usernames, binder titles, comments

### Minors

- **COPPA compliance** — card collecting has many minors
- Under-13: not permitted (or parental gate)
- Under-18: DMs disabled by default, no public discoverability without opt-in
- Age verification at signup (self-attested, escalated if flagged)

### App security

- Certificate pinning in production builds
- JS bundle obfuscation
- Source map redaction (don't ship them)
- Secrets via EAS Secrets, never in code
- SCA via Snyk or Dependabot
- SAST in CI (GitHub Advanced Security or Semgrep)
- Bug bounty program once we have meaningful userbase

### Privacy

- Readable privacy policy (not a legal wall of text)
- Accurate App Store privacy labels + Google Play Data Safety form
- Analytics: anonymized IDs, no PII piped to PostHog
- Session replay: PII redacted by default
- Tracking: minimal, transparent, easily opted out

---

## 10. 2026 Best Practices Checklist

**Mobile development**
- ✅ New Architecture (Fabric + TurboModules)
- ✅ React Compiler enabled
- ✅ Hermes JS engine
- ✅ 60fps on iPhone 12 / Pixel 6+
- ✅ Initial install < 50MB
- ✅ App start < 2s
- ✅ Time to interactive < 3s

**Code quality**
- ✅ TypeScript strict mode
- ✅ Biome or ESLint + Prettier in CI (block on failure)
- ✅ Lefthook pre-commit hooks
- ✅ Conventional commits
- ✅ PR templates with checklist
- ✅ Test coverage: 60% unit minimum, critical paths E2E

**CI/CD**
- ✅ GitHub Actions for CI
- ✅ EAS Build/Submit for native
- ✅ Preview builds per PR (EAS Updates branch deploys)
- ✅ Automated screenshot diffing
- ✅ Trunk-based for solo dev → feature branches when team grows

**Observability**
- ✅ Sentry for crashes/errors
- ✅ PostHog for product analytics + session replay
- ✅ Performance monitoring (cold start, frame drops, API latency)
- ✅ Custom KPI dashboards (DAU, binders/user, save rate, etc.)

**Accessibility**
- ✅ WCAG 2.2 AA target
- ✅ Screen reader testing every release
- ✅ Dynamic type support
- ✅ High contrast mode
- ✅ Respect reduced motion settings

**Compliance**
- ✅ App Store Connect privacy labels
- ✅ Google Play Data Safety form
- ✅ GDPR + CCPA + COPPA from day 1
- ✅ Annual security audit (once at scale)

---

## 11. Development Roadmap

> Re-paced for full-time development with the expanded v1.0 scope (original MVP + v1.5 combined). ~22 weeks to public launch. App Store / Play Store review cycles are built in.

### Phase 0 — Foundation (Weeks 1-2)
- Finalize branding shortlist, trademark + domain + social handles secured
- Design system tokens + core components built (Card, Binder, Avatar, Button, Input, Sheet)
- Supabase project provisioned + initial schema (users, binders, cards, follows, likes, comments, wishlists)
- RLS policies for all tables
- Mobile project scaffolding (Expo + Router + NativeWind + Reanimated + Skia)
- CI/CD: GitHub Actions + EAS Build pipeline working end-to-end
- Sentry + PostHog wired
- Auth working: passkey + Apple + Google

### Phase 1 — Collection core (Weeks 3-8)
- Profile creation + edit
- Create / edit / delete binder (with drag-to-reorder)
- Add card with photo (camera + library)
- **Pokemon TCG API integration** — autocomplete, metadata fetching, local mirror table
- Manual metadata entry with API-backed autocomplete
- Multiple photos per card + holo angles
- Binder detail view with parallax + Skia holo shimmer
- Personal home (your own binders)
- Settings (privacy, account, delete, data export)

### Phase 2 — Smart features (Weeks 9-12)
- **Smart card scan** — Google Vision OCR → fuzzy match to TCG API
- Manual override + correction flow
- **Wishlists** — separate collection type, same UI patterns
- **Collection stats** — completion % per set, count graphs, value (opt-in via TCGPlayer pricing)
- Profile customization (themes, badges)

### Phase 3 — Social layer (Weeks 13-16)
- Discover feed with masonry layout
- Personalized "For You" + "Following" tabs
- Follow / unfollow
- Like, save, comment
- Search + tags + trending
- Curated themes (editorial seeding)
- Push notifications + preferences
- Share to external (TikTok, Instagram, X) with rich previews

### Phase 4 — Polish & private beta (Weeks 17-19)
- Onboarding flow + cold-start feed seeding
- Performance pass — frame profiling, bundle audit, app size budget
- Accessibility audit (WCAG 2.2 AA)
- Content moderation pipeline live
- TestFlight + Google Play Internal Testing
- 50-100 beta users (from the creator outreach workstream — see below)
- Daily feedback iteration

### Phase 5 — Public launch (Weeks 20-22)
- App Store + Play Store submission (allow 1-2 weeks for review)
- Marketing landing page (Next.js on Vercel) + waitlist conversion
- Launch PR: TikTok creators, r/PokemonTCG, r/PokeInvesting, X, Discord
- Press: TCG news outlets (PokeBeach, Bulbapedia community)
- Daily metric review + iteration

### Phase 6 — Post-launch (Months 6-12)
- Collaborative binders
- DMs with safety-by-default
- AR features (gyro holo, virtual binder)
- Premium tier launch
- Live binder reveals
- Smart scan v2 (custom ML model)

### Parallel workstream — Creator outreach (Weeks 8 → launch)

**Why it's parallel:** No existing TCG creator relationships at start. Cold outreach is slow (low response rates, long lag from DM to commitment). Starting in Phase 1 gives ~10 weeks of relationship-building before private beta opens in Phase 4. Starting in Phase 4 would mean an empty beta.

**Allocate ~4-6 hours/week from Week 8 onwards:**

- **Week 8-12 (during Phase 2):** Build creator target list. ~50 names across TikTok (mid-tier TCG creators, 10k-100k followers), YouTube (collection-tour channels), Reddit (mods of r/PokemonTCG, r/PokeInvesting), Discord (admin contacts in top TCG servers).
- **Week 12-16 (during Phase 3):** Begin outreach. Personalized DMs only. Offer: early access + a permanent creator badge + your direct line for feedback. Don't ask for promotion — ask for honest feedback. Promotion follows naturally if the product is good.
- **Week 17-19 (Phase 4 beta):** Convert ~10-15 committed creators + organic beta signups into 50-100 active beta users. Daily 1:1 feedback.
- **Week 20-22 (Phase 5 launch):** Coordinated launch posts from creators who genuinely love the product (no paid promotion in v1 — kills authenticity).

**Personal effort budget:** the 4-6 hours/week comes out of your 40-hour total. Real building time drops to ~34-36 hours/week from Week 8. Account for this in scope.

### Pace assumptions
- ~40 productive hours/week (full-time, ship-focused) — *minus 4-6/week for creator outreach starting Week 8*
- Solo dev — no concurrent work streams beyond the outreach workstream above
- Pre-Phase-0 work (LLC formation, financials, trademark filings) handled in parallel
- Buffer is *not* generous — App Store review delays, illness, scope creep eat slack fast. If a phase slips by >1 week, reassess scope before extending.

---

## 12. Risks & Considerations

### Legal
- **Pokemon / Nintendo IP** — we never sell cards, never claim affiliation, but user uploads of official card photos are everywhere. Likely OK as user-generated content of items they own, but need a clean Terms of Service + clear takedown process.
- **Trademark our own name** carefully — file in US, EU, JP early.
- **DMCA process** — required and must be responsive.

### Community
- TCG / collectibles communities have toxic edges (scammers, gatekeepers, grading drama). Moderation is *essential*, not a v2 feature.
- Slower growth with strong culture > fast growth with chaos. Invest in community management from day 1.

### Product
- **Camera UX** is make-or-break. People abandon photo apps that fight them. Spend disproportionate time here.
- **Cold-start feed** — empty discovery kills sign-ups. Seed with hand-curated content from beta users + creators.
- **Card scanning accuracy** — will fail often early. Manual fallback must be one tap, not buried.

### Technical
- **Image storage costs** scale fast with user growth and high-quality photos. Aggressive compression + lazy loading is mandatory.
- **Background sync edge cases** — offline-first sounds great until you debug merge conflicts.
- **Push notification deliverability** — Apple/Google throttle aggressively. Don't be spammy.

### Business
- **Single-niche risk** — if Pokemon cools, we cool. Architectural TCG-agnosticism from day 1 mitigates this.
- **Monetization timing** — too early kills growth; too late burns runway. Be patient, but not naive.
- **Marketplace temptation** — every successful collection app will be tempted to add buying/selling. Resist until you have product-market fit; even then, consider it a separate product.

---

## 13. Open Questions

**All initial planning questions resolved.** See *Decisions Locked* at the top of the document.

New questions will surface during Phase 0 — visual identity direction, design system specifics, Supabase schema details, etc. — but none of them block the start of work.

---

*Status: plan is fully locked through Phase 1. Phase 0 is ready to begin.*
