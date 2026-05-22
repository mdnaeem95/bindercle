# Foilio — Solo Founder Roadmap

*From zero to public launch in ~22 weeks of focused full-time work, plus a 90-day post-launch operating rhythm.*

> **How to use this document:**
> - Open it every Monday morning. Pick the week you're in.
> - Each week has: **Goal · Code tasks · Founder tasks · Community tasks · Definition of Done.**
> - Check items off as you go. Don't skip the DoD review — that's how you know you're actually done.
> - If a week slips by more than 2 days, read the *Slip Protocol* at the bottom of this doc before just adding hours.
> - Founder rhythms, metrics, and health safeguards live at the bottom — re-read those monthly.

---

## Table of contents

- [Week -2 to 0: Founder setup (pre-build)](#week--2-to-0-founder-setup)
- [Phase 0: Foundation (Weeks 1-2)](#phase-0--foundation-weeks-1-2)
- [Phase 1: Collection core (Weeks 3-8)](#phase-1--collection-core-weeks-3-8)
- [Phase 2: Smart features (Weeks 9-12)](#phase-2--smart-features-weeks-9-12)
- [Phase 3: Social layer (Weeks 13-16)](#phase-3--social-layer-weeks-13-16)
- [Phase 4: Polish & private beta (Weeks 17-19)](#phase-4--polish--private-beta-weeks-17-19)
- [Phase 5: Public launch (Weeks 20-22)](#phase-5--public-launch-weeks-20-22)
- [Phase 6: Post-launch operating (Months 6-12)](#phase-6--post-launch-operating-months-6-12)
- [Parallel: Creator outreach workstream (Weeks 8 → launch)](#parallel-workstream--creator-outreach)
- [Founder rhythms](#founder-rhythms)
- [Metrics that matter](#metrics-that-matter)
- [Health & sustainability](#health--sustainability)
- [Slip protocol](#slip-protocol)
- [Decision log](#decision-log)

---

## Week -2 to 0 — Founder setup

**Goal:** Legal, financial, IP, and operational foundations in place *before* a line of code. Aim for ~5 working days end-to-end.

### Business & legal

- [ ] Form single-member LLC in your state of residence (or Delaware if planning to raise later — but bootstrap doesn't need DE)
  - Service options: IncFile (~$50 + state fee), ZenBusiness (~$150), or DIY directly with state (~$50-300 depending on state)
  - **Recommendation:** DIY if your state's portal is decent; otherwise IncFile
- [ ] Get EIN from IRS (free, online, takes 5 minutes at irs.gov)
- [ ] Open business bank account
  - **Recommendation:** Mercury (tech-friendly, free, fast onboarding)
  - Alternative: local credit union
- [ ] Set up bookkeeping
  - **Recommendation:** Wave (free) for Year 1, migrate to Xero/QuickBooks when revenue starts
- [ ] Set up business email
  - Google Workspace `hello@foilio.com` (~$6/mo) — needed for App Store contact email

### Trademark & domains

- [ ] Final USPTO TESS search on "Foilio" in Class 9 (mobile apps) + Class 42 (social networking services)
- [ ] File USPTO trademark application
  - DIY at uspto.gov (~$250-350 per class)
  - Or LegalZoom (~$700) or Trademark Engine (~$500)
  - **Recommendation:** DIY — TESS + TEAS forms are doable, save the $400+
- [ ] Buy domains (Cloudflare Registrar recommended — no markup, free privacy):
  - [ ] `foilio.com` (primary)
  - [ ] `foilio.app` (mobile deep linking)
  - [ ] `getfoilio.com` (marketing fallback)
  - [ ] `foilio.io` (defensive)
  - [ ] `foilio.co` (defensive)
- [ ] Claim social handles *today* (squatters move fast on clean names):
  - [ ] TikTok @foilio
  - [ ] Instagram @foilio
  - [ ] X/Twitter @foilio
  - [ ] Threads @foilio
  - [ ] Bluesky @foilio.com (or @foilio.bsky.social)
  - [ ] YouTube /@foilio
  - [ ] Reddit u/foilio
  - [ ] Discord (reserve a server name)
  - Backup handles to claim if primary is taken: @foilioapp, @getfoilio, @foilio.app

### Tools & accounts

- [ ] GitHub account + create `foilio` org (free)
- [ ] Supabase account + project (free tier)
- [ ] Sentry account (free tier — 5k errors/mo)
- [ ] PostHog account (free tier — 1M events/mo)
- [ ] Expo account + EAS Build (free for now, ~$29/mo when builds ramp up)
- [ ] Apple Developer Program ($99/yr) — needed for TestFlight
- [ ] Google Play Developer ($25 one-time)
- [ ] RevenueCat account (free up to $2.5k MTR)
- [ ] Resend account (free 100 emails/day)
- [ ] Figma (free for solo work)
- [ ] 1Password or Bitwarden for credential storage
- [ ] Linear (free) or GitHub Projects for issue tracking

### Personal & workspace

- [ ] Calculate runway in months: `(personal savings + any income) ÷ monthly burn` — write the number down
- [ ] Health insurance plan secured (marketplace, COBRA, partner's plan)
- [ ] Workspace set up (chair, monitor, lighting — you'll spend 1,000+ hours here)
- [ ] Tell partner/family/close friends about the commitment and the 22-week target
- [ ] Set up a personal "founder OS" (Notion, Obsidian, or Apple Notes) for daily journal + weekly reviews

### DoD for pre-build

- LLC exists, has an EIN, has a bank account
- Trademark application filed
- All 5 domains owned, all 7+ social handles claimed
- All tool accounts created and verified
- Runway number is written down somewhere you'll see it weekly

---

## Phase 0 — Foundation (Weeks 1-2)

**Phase goal:** A scaffolded codebase that can build to TestFlight, with auth, design tokens, and CI all working.

### Week 1 — Scaffolding & design tokens

**Goal:** Boot the app, show the Foilio wordmark in Instrument Serif on the dark canvas.

**Code:**
- [ ] `npx create-expo-app foilio --template` with TypeScript template, new architecture enabled in `app.config.ts`
- [ ] Set up monorepo: Turborepo at root, with `apps/mobile`, `packages/ui`, `packages/types`, `packages/api-client`
- [ ] Configure **Biome** (single tool for lint + format — replaces ESLint + Prettier)
- [ ] Configure **Lefthook** pre-commit hooks (lint, type-check, biome format)
- [ ] TypeScript strict mode enabled (`"strict": true`, `"noUncheckedIndexedAccess": true`)
- [ ] Install dependencies:
  - `expo-router`, `expo-font`, `expo-image`, `expo-camera`, `expo-image-picker`
  - `react-native-reanimated`, `@shopify/react-native-skia`
  - `nativewind` (or `@tamagui/core` — pick one, don't add both)
  - `zustand`, `@tanstack/react-query`
  - `react-hook-form`, `zod`, `@hookform/resolvers`
  - `@supabase/supabase-js`
- [ ] Load fonts via `expo-font`: Geist (Regular, Medium, Semibold), Geist Mono, Instrument Serif (Regular + Italic)
- [ ] Create `packages/ui/tokens.ts` — paste design tokens from `BRAND.md`
- [ ] Create `packages/ui/theme/dark.ts` and `light.ts`
- [ ] Build `<HoloGradient />` (static SVG version — animated comes later)
- [ ] Build minimal `<Text>` wrapper that uses theme tokens
- [ ] App entry shows: `foilio` wordmark (Geist Semibold) + holo dot on the second `i` (SVG)

**Founder:**
- [ ] Push first commit to GitHub
- [ ] Write a one-paragraph `README.md` (no marketing copy yet — just "Foilio. Pokemon TCG collection showcase. WIP.")
- [ ] Set up the daily journal habit — even 3 bullets at end of day

**Community:**
- [ ] Post a single "I'm building Foilio" Twitter/Bluesky post (low pressure — just announce existence)

**DoD:**
- App boots on iOS + Android simulator
- Wordmark renders correctly with holo dot
- `npx tsc --noEmit` passes
- `biome check .` passes

---

### Week 2 — Supabase, schema, auth, CI

**Goal:** Sign in with Apple/Google, land on a placeholder home screen, sign out cleanly. CI green on every PR.

**Code:**
- [ ] Create Supabase project (region: closest to expected primary user base — US East if uncertain)
- [ ] Run initial migration with these tables (use `supabase migration new init`):
  ```
  profiles            (id, handle, display_name, avatar_url, bio, created_at)
  binders             (id, owner_id, title, description, cover_image_url, is_public, created_at, updated_at)
  cards               (id, binder_id, owner_id, name, set_code, set_number, rarity, condition, notes, position, created_at)
  card_photos         (id, card_id, url, order_index, created_at)
  follows             (follower_id, followed_id, created_at)
  likes               (user_id, binder_id, created_at)
  saves               (user_id, binder_id, created_at)
  comments            (id, binder_id, user_id, body, parent_id, created_at)
  tags                (id, slug, name)
  binder_tags         (binder_id, tag_id)
  wishlists           (id, owner_id, title, created_at)
  wishlist_items      (id, wishlist_id, card_ref_id, note, created_at)
  pokemon_tcg_cards   (id, name, set_id, set_name, number, rarity, image_small, image_large, illustrator, release_year, raw_json)
  ```
- [ ] Write **RLS policies** for every table — none should be readable/writable without them
  - Profiles: public read, self write
  - Binders: public read if `is_public`, owner read/write always
  - Cards: tied to binder access
  - Follows/likes/saves: self-write, public read
- [ ] Configure Supabase Auth:
  - [ ] Apple Sign In
  - [ ] Google Sign In
  - [ ] (Passkeys: defer to Phase 1 — Supabase passkey support varies; verify availability)
- [ ] Wire `@supabase/supabase-js` into Expo with `expo-secure-store` for token storage
- [ ] Build auth flow: sign in screen → OAuth round-trip → home placeholder → sign out
- [ ] GitHub Actions workflow: `lint` + `typecheck` + `test` on every PR
- [ ] Configure EAS Build for iOS + Android (`eas.json` with `development`, `preview`, `production` profiles)
- [ ] Install + verify Sentry SDK (throw a test error, see it in dashboard)
- [ ] Install + verify PostHog SDK (fire a test event, see it land)

**Founder:**
- [ ] App Store Connect: create app entry (Foilio bundle ID: `app.foilio.mobile` or similar)
- [ ] Google Play Console: create app entry
- [ ] Privacy policy v0 (Notion page is fine for now — make it real before submission)

**Community:**
- [ ] Nothing required — head down on infra

**DoD:**
- Sign in with Apple and Google both work end-to-end
- A signed-in user can sign out and back in without state corruption
- CI is green on `main`
- First TestFlight build of the placeholder app exists and installs on your physical device

---

## Phase 1 — Collection core (Weeks 3-8)

**Phase goal:** A solo user can create binders, upload cards with photos, get accurate metadata via the Pokemon TCG API, and view binders in a beautiful detail screen. No social yet.

### Week 3 — Profile creation & editing

**Goal:** User has a profile with handle, display name, avatar, bio.

**Code:**
- [ ] Profile creation flow on first sign-in (handle picker with availability check)
- [ ] Profile edit screen (avatar upload to Supabase Storage, bio with character counter)
- [ ] Handle validation: lowercase, 3-20 chars, alphanumeric + underscores, no profanity (basic block list)
- [ ] Profile view screen (own profile placeholder — full version in Phase 3)
- [ ] Build core UI components in `packages/ui/`: `<Button>`, `<Input>`, `<Avatar>`, `<Sheet>` (bottom sheet)
- [ ] Add unit tests for handle validation logic

**Founder:**
- [ ] Mock up 3 sample profiles in Figma (your own + 2 fictional collectors) for visual reference
- [ ] Document your `tokens.ts` setup so future-you doesn't get confused

**Community:**
- [ ] Spend 30 min/day for 3 days of the week lurking r/PokemonTCG, TCG TikTok, collector Discords — building your *mental model* of the audience

**DoD:**
- User can sign in, set a handle, upload an avatar, write a bio, save it
- Returning to the app shows the saved profile
- Handle conflicts return a clean error (not a crash)

---

### Week 4 — Binder CRUD

**Goal:** Create, edit, delete a binder. Cover image upload. Tags.

**Code:**
- [ ] Binder list screen (your own binders, grid layout)
- [ ] Create binder flow: title, description, cover image upload, public/private toggle, tag picker
- [ ] Edit binder screen (same form, pre-filled)
- [ ] Delete binder with confirmation
- [ ] Tag picker component (autocomplete against `tags` table + free-form input that creates new tags)
- [ ] `<BinderCard>` component (cover image + title + card count) for the grid
- [ ] Image upload pipeline: pick → resize client-side → upload to Supabase Storage with signed URL
- [ ] Add `Storage` bucket: `binder-covers` with RLS

**Founder:**
- [ ] Curate a list of 50 *real-world* theme ideas users might create (helps you test edge cases): "Dabbing Pokemon", "Shadowless Base Set", "All Pikachus", "Hat-Wearing Pokemon", "Cards I Pulled From Each Birthday Pack", etc.

**Community:**
- [ ] Continue lurking — note which themes get the most engagement on TikTok

**DoD:**
- User can create, edit, delete a binder
- Cover image uploads work with a clean loading state
- Grid view of own binders looks like the Figma mock

---

### Week 5 — Card upload (manual entry)

**Goal:** Add cards to a binder with photos + manual metadata.

**Code:**
- [ ] Add card flow: take photo OR pick from library → preview → metadata form → save
- [ ] Multi-photo support per card (front, back, holo angles — up to 6 photos)
- [ ] Smart cropping: detect card edges + crop with `expo-image-manipulator` (basic; full ML cropping comes later)
- [ ] Metadata form: name (text), set (text), set number (text), rarity (dropdown), condition (dropdown), notes (textarea)
- [ ] Storage bucket: `card-photos` with RLS
- [ ] Position field on `cards` for drag-to-reorder (will be exposed in Week 7)
- [ ] `<CardThumbnail>` component for card grid in binder
- [ ] Card detail screen (placeholder, full version Week 7)

**Founder:**
- [ ] Sit down and add 30+ cards from your own collection. *You will find every UX flaw.* Note them in your journal.

**Community:**
- [ ] Make a private TikTok account from a burner — start understanding the algorithm without revealing your real identity

**DoD:**
- User can add a card with photo + metadata
- Multiple photos per card work
- Card appears in the binder grid
- You've added 30 of your own cards and the friction wasn't unbearable

---

### Week 6 — Pokemon TCG API integration

**Goal:** Replace manual metadata entry with autocomplete + autofill from pokemontcg.io.

**Code:**
- [ ] Get free API key from [pokemontcg.io](https://dev.pokemontcg.io/)
- [ ] Build sync job that mirrors the Pokemon TCG API into the `pokemon_tcg_cards` table (Supabase Edge Function, runs daily)
- [ ] Initial backfill: pull all sets + cards once (~18,000 cards as of 2026 — feasible in one Edge Function run with pagination)
- [ ] Card search/autocomplete component: searches local `pokemon_tcg_cards` table
- [ ] Autofill: selecting a card from autocomplete pre-fills name, set, number, rarity, illustrator, release year
- [ ] Keep manual entry as fallback (for non-TCG-API cards: customs, errors, signed)
- [ ] Show official TCG card art in autocomplete results
- [ ] Caching: TanStack Query with stale-while-revalidate

**Founder:**
- [ ] Review pokemontcg.io ToS — confirm we can mirror data + show official images (verify before going live)

**Community:**
- [ ] First *real* TikTok post (still soft-launch): show a short clip of the autocomplete flow. Caption: "Building this. Pokemon collectors, what would you want it to do?"

**DoD:**
- Typing "Char" in card creation autocompletes Charizard variations across sets with their official art
- Adding via autocomplete pre-fills all metadata correctly
- The local mirror table is in sync (manual smoke test: spot-check 10 cards against the API)

---

### Week 7 — Binder detail view + Skia holo

**Goal:** The binder detail screen is the showcase moment. Make it feel premium.

**Code:**
- [ ] Binder detail screen layout:
  - Hero: large cover image with parallax on scroll
  - Title (Instrument Serif), description (Geist), tag chips, card count
  - Grid of cards below
  - Owner profile chip at top
- [ ] Card detail screen: pinch-to-zoom, swipe through multiple photos, metadata sheet on swipe-up
- [ ] **Skia-powered holo shimmer** on holo-rarity cards:
  - Read `rarity` field; if matches `holo|secret|fullart|altart` → render shimmer
  - Gyroscope-driven gradient sweep (Reanimated + `useAnimatedSensor`)
  - Reduced motion: static gradient
- [ ] Drag-to-reorder cards in binder grid (Reanimated `Sortable`)
- [ ] Empty state for binder with 0 cards (use BRAND.md line illustration style)

**Founder:**
- [ ] Record a 30-second screen capture of the holo card detail. Watch it. Does it look premium? If not, iterate before moving on.

**Community:**
- [ ] Post the holo card screen recording on TikTok. *This is the first piece of marketing content that does the brand work.*

**DoD:**
- Binder detail view feels like opening a museum case
- Holo cards visibly shimmer when you tilt the phone
- Drag-to-reorder works without jank
- The TikTok post exists publicly

---

### Week 8 — Settings, polish, & start creator outreach

**Goal:** Phase 1 closes out. App is feature-complete for a single user. Creator outreach begins.

**Code:**
- [ ] Settings screen:
  - Account: email, change handle, delete account
  - Privacy: who can see your binders default, who can comment
  - Notifications: (placeholder, real toggles in Phase 3)
  - Data: export your data (JSON download), delete account (with 7-day grace period)
- [ ] Data export endpoint (Supabase Edge Function returns all user data as JSON)
- [ ] Account deletion flow (soft delete → 7 days → hard delete via cron)
- [ ] Bug bash: fix everything you noted in your journal from weeks 3-7
- [ ] Performance pass: open Reactotron / Flipper, profile main flows, fix anything >50ms blocking

**Founder:**
- [ ] Build creator target list (this kicks off the parallel workstream — see below)
- [ ] First monthly review: read your journal entries from weeks 1-8

**Community (start of creator outreach workstream):**
- [ ] Build a spreadsheet of 50 creator targets across TikTok (10k-100k followers), YouTube, Reddit mods, Discord admins
- [ ] Columns: name, platform, handle, audience size, content style, contact method, status, notes

**DoD:**
- Phase 1 features all work
- You've used the app daily for a week to add cards from your own collection
- Creator target list has 50 entries
- Phase 1 retro written in your journal: what worked, what didn't, what to change

---

## Phase 2 — Smart features (Weeks 9-12)

**Phase goal:** Smart card scanning, wishlists, collection stats, profile customization. The "magic" pass.

### Week 9 — Smart card scan, part 1 (OCR pipeline)

**Goal:** Take a photo → OCR card name + set number → fuzzy-match against `pokemon_tcg_cards`.

**Code:**
- [ ] Set up Google Cloud Vision API (or AWS Textract — Vision is generally better for card OCR)
- [ ] Supabase Edge Function: receives image URL → calls Vision API → returns extracted text
- [ ] Build the fuzzy-match logic:
  - Extract card name + set number from OCR text (regex for "XXX/YYY" patterns)
  - Fuzzy match against `pokemon_tcg_cards.name` using PostgreSQL `pg_trgm` extension
  - Return top 3 candidates with confidence scores
- [ ] Wire the function into the card-add flow: photo capture → OCR → suggested matches

**Founder:**
- [ ] Watch your billing: Vision API is pay-per-call. Monitor cost during testing — set a budget alert at $50/mo.

**Community:**
- [ ] Begin creator outreach DMs. 5/day, personalized only. Track responses in the spreadsheet.

**DoD:**
- Photographing a card produces a list of top-3 likely matches
- Confidence score >85% on clean photos in good lighting (test on 20 of your own cards)

---

### Week 10 — Smart scan, part 2 (UX & fallback)

**Goal:** The match flow feels magic. Manual override is always one tap away.

**Code:**
- [ ] Match selection UI: bottom sheet shows top 3 candidates with card art preview
- [ ] "None of these" → falls back to manual autocomplete (Phase 1 flow)
- [ ] "Edit details" option in case OCR got something wrong
- [ ] Track scan accuracy: log every scan + whether user accepted top match → analytics dashboard

**Founder:**
- [ ] Test smart scan on edge cases: bad lighting, partial photos, holo glare, foreign-language cards. Note failure modes.

**Community:**
- [ ] Outreach: 5 DMs/day. Track responses.

**DoD:**
- Smart scan accepted rate ≥80% on photos you'd realistically expect users to take
- Manual fallback is one tap, not buried

---

### Week 11 — Wishlists

**Goal:** "Cards I want" as a parallel collection type.

**Code:**
- [ ] Wishlist CRUD (similar pattern to binders but simpler)
- [ ] Add card to wishlist: same autocomplete flow but no photo upload required (use TCG API art)
- [ ] Wishlist detail view (similar to binder but distinct visual identity — maybe a dashed border treatment)
- [ ] Wishlist sharing (same public/private toggle as binders)

**Founder:**
- [ ] Add a wishlist of your own. Verify the UX feels distinct enough from a binder.

**Community:**
- [ ] Outreach: 5 DMs/day. Some responses by now — schedule a few calls with interested creators.

**DoD:**
- Wishlists work end-to-end
- Visually distinct from binders (no accidental confusion in UI)

---

### Week 12 — Collection stats & profile customization

**Goal:** Stats motivate users. Customization makes the profile feel theirs.

**Code:**
- [ ] Profile stats panel: total cards, total binders, sets in progress, completion %, time collecting
- [ ] Set completion view: pick any Pokemon set → see which cards you have vs. need
- [ ] Optional pricing: TCGPlayer API integration for opt-in card valuations
- [ ] Profile customization (moderate scope per locked decision):
  - 4 theme presets (Holo Luxe is default; add 3 variants — e.g., "Bright", "Forest", "Ocean")
  - Accent color picker (8 options that work with the dark canvas)
  - Profile badge slots (achievements — placeholders for now, filled in Phase 4)
  - Layout: grid vs. masonry preference for own binders

**Founder:**
- [ ] Phase 2 retro: feature done? Smart scan good enough? Stats motivating? Write it down.

**Community:**
- [ ] First creator demo call. Record it (with permission). Listen for surprise moments.

**DoD:**
- Stats panel renders with real data
- Profile customization options all work
- Phase 2 retro complete

---

## Phase 3 — Social layer (Weeks 13-16)

**Phase goal:** Multiplayer. Feed, follow, like, comment, search, push. The platform becomes a network.

### Week 13 — Follow system & social schema

**Goal:** Users can follow each other. Activity is recorded.

**Code:**
- [ ] Follow/unfollow flow
- [ ] Followers/following lists
- [ ] Notification scaffolding (DB table for in-app notifications)
- [ ] Activity feed schema (`activities` table — for ranked feed in Week 14)
- [ ] Following count + followers count on profile

**Community:**
- [ ] Outreach: continue 5/day. Aim for 10 committed beta interests by Week 16.

**DoD:**
- Follow/unfollow works
- Profile shows counts
- Activity records on key events (binder created, card added, etc.)

---

### Week 14 — Masonry feed

**Goal:** The Pinterest-style discovery feed. Beautiful, infinite-scroll, performant.

**Code:**
- [ ] Masonry layout (use `@shopify/flash-list` with custom layout calc — or write your own)
- [ ] Two tabs: "For You" + "Following"
- [ ] "Following" feed: chronological from users you follow
- [ ] "For You" feed: simple ranking v1 — recency + popularity (likes + saves) + tag affinity (from your followed users)
- [ ] Pre-load images aggressively but with bandwidth awareness
- [ ] Cold-start handling: if user follows 0 people, show curated content (you'll seed it)

**Founder:**
- [ ] Curate 100 "seed" binders manually (own + creator beta users) so the discovery feed is never empty

**Community:**
- [ ] Continue creator outreach. By end of week 14, you should have 5+ committed beta users.

**DoD:**
- Feed renders at 60fps on mid-tier devices
- Both tabs work
- Cold start shows seeded content

---

### Week 15 — Likes, saves, comments

**Goal:** Engagement primitives.

**Code:**
- [ ] Like button on binder + animation (haptic + scale spring)
- [ ] Save button (heart vs bookmark — save = "I want to find this again", like = "I appreciate this")
- [ ] Comments thread on binder detail
- [ ] Reply to comment (one level deep, no infinite nesting)
- [ ] Like/unlike on comments
- [ ] Optimistic UI on all interactions
- [ ] Block / report on every social surface

**Founder:**
- [ ] Add a `reports` table + an internal-only admin view for moderation review

**Community:**
- [ ] Outreach continues. Some creators committing to beta now.

**DoD:**
- Like + save + comment all work with optimistic UI
- Block and report flows work end-to-end (test by having a friend try to message themselves)
- Notifications fire to the in-app notification table

---

### Week 16 — Search, tags, push notifications

**Goal:** Discovery works. Re-engagement works.

**Code:**
- [ ] Search screen: tabs for users, binders, cards (Pokemon TCG card name search)
- [ ] PostgreSQL full-text search with `pg_trgm` (Meilisearch / Typesense is overkill for v1.0)
- [ ] Tag detail pages: `/tag/dabbing-pokemon` → all public binders with that tag
- [ ] Trending tags surface on the For You tab
- [ ] Push notifications via Expo Push:
  - New follower
  - Comment on your binder
  - Like on your binder (batched — "5 people liked your binder")
  - New post from creators you follow (opt-in)
- [ ] Notification preferences screen (granular toggles per type)
- [ ] Server-side: Edge Function triggers on activity table inserts → sends push if user has permitted

**Founder:**
- [ ] Test push notifications across iOS + Android, both foreground and background
- [ ] Phase 3 retro

**Community:**
- [ ] Outreach: cap at 15 committed beta users for Phase 4. Quality > quantity.

**DoD:**
- Search works on users, binders, and Pokemon cards
- Tag pages load and are populated
- Push notifications arrive reliably on real devices

---

## Phase 4 — Polish & private beta (Weeks 17-19)

**Phase goal:** Quality. Beta cohort onboarded. Real-world feedback drives final polish before public launch.

### Week 17 — Onboarding flow + cold-start + moderation

**Goal:** First-time UX feels great. Empty isn't desolate. Bad actors get caught.

**Code:**
- [ ] Onboarding flow:
  - Screen 1: "Welcome in" (Foilio essence)
  - Screen 2: "Pick what you collect" (tags / theme interests for cold-start feed)
  - Screen 3: "Follow your first creators" (showcase 6-10 hand-picked seed accounts)
  - Screen 4: "Create your first binder" or "Look around"
- [ ] Cold-start algorithm: based on chosen interests, prefill For You feed with curated content
- [ ] Content moderation pipeline:
  - On image upload: AWS Rekognition for NSFW + Cloudflare CSAM scanning
  - On text content: word block list + perspective API for toxicity (optional)
  - Reports route to admin queue
- [ ] Set up internal moderation admin (simple Next.js dashboard on Vercel reading directly from Supabase with admin RLS)
- [ ] Age gate at signup (self-attested with COPPA flow if <13)

**Founder:**
- [ ] Read every line of your privacy policy + terms of service. Get them legally reviewed if budget allows (~$200-500 for a basic review).

**Community:**
- [ ] Beta invites go out via TestFlight (iOS) + Google Play Internal (Android) — start with 10 users

**DoD:**
- Onboarding feels intentional
- A brand-new account has a non-empty For You feed
- Moderation pipeline catches a test NSFW upload
- 10 beta users have access

---

### Week 18 — Performance pass + accessibility

**Goal:** Production-ready performance. WCAG 2.2 AA conformance.

**Code:**
- [ ] Bundle audit: `npx expo-bundle-analyzer` — under 50MB initial install target
- [ ] Image lazy loading verified on feed (use `expo-image` with placeholder)
- [ ] App start time under 2 seconds (measure with `expo-startup-time`)
- [ ] Time-to-interactive under 3 seconds for home + feed
- [ ] Frame profiling on feed scroll (Reanimated Devtools) — hold 60fps minimum
- [ ] Memory profile — no leaks after 5 minutes of normal usage
- [ ] Accessibility audit:
  - [ ] Screen reader: all interactive elements have accessible labels
  - [ ] Dynamic type: app respects system text size
  - [ ] Color contrast: all token pairs verified (axe-core in tests)
  - [ ] Reduced motion: respected throughout (especially holo shimmer)
- [ ] Crash-free rate: aim for >99% across 1 week of beta usage

**Founder:**
- [ ] Daily feedback review: read every beta user's message. Reply to all within 24h.
- [ ] App Store screenshots + preview video (you can mock these in Figma, but record actual interactions)

**Community:**
- [ ] Beta expands to 30 users by end of week

**DoD:**
- Performance metrics all in target
- Accessibility audit complete with all critical issues fixed
- Crash-free >99%

---

### Week 19 — Beta iteration

**Goal:** Final iteration cycle. Last week to fix things that aren't right.

**Code:**
- [ ] Address top 10 feedback themes from beta users
- [ ] Fix every P0 bug
- [ ] Fix as many P1 bugs as time allows (don't block launch on P2/P3)
- [ ] App Store / Play Store metadata finalized:
  - Description (tested with 3 beta users for "would you download?")
  - Keywords
  - Screenshots (one per key feature, with on-image copy)
  - Preview video (30 seconds, atmospheric, shows the holo card moment)
  - Privacy policy URL
  - Support URL

**Founder:**
- [ ] Marketing landing page deployed at foilio.com (Next.js on Vercel — keep it simple, single page, email waitlist)
- [ ] Launch press kit: 1 PDF with brand assets, screenshots, app description, your bio, contact

**Community:**
- [ ] Beta cohort grows to 50-100 active users
- [ ] Final creator alignment: which creators will post on launch day?

**DoD:**
- All P0 + P1 bugs fixed
- App Store + Play Store listings ready to submit
- Landing page live
- Press kit ready

---

## Phase 5 — Public launch (Weeks 20-22)

**Phase goal:** Live in App Store + Google Play. First 72 hours operating smoothly.

### Week 20 — Submission

**Goal:** App in review. Marketing prepped.

**Code:**
- [ ] iOS submission to App Store Connect
- [ ] Android submission to Google Play Console
- [ ] Both reviewer-facing notes filled out clearly (explain auth flow, image moderation, anything unusual)
- [ ] Production environment fully hardened:
  - Sentry filters tuned (no PII leaking into errors)
  - PostHog dashboards created for launch metrics
  - Database backups verified (Supabase daily by default, but verify)
  - Rate limiting on all auth + write endpoints

**Founder:**
- [ ] Schedule launch date (typically 1-2 weeks after submission to allow for review)
- [ ] Draft launch posts for each platform (TikTok script, X/Bluesky threads, Reddit posts)
- [ ] Coordinate with creators for launch day coverage

**Community:**
- [ ] Pre-launch tease: 1 post on each platform, "Foilio. Coming [date]."

**DoD:**
- Both apps in review
- Launch posts drafted (not posted)
- Creator alignment confirmed in writing

---

### Week 21 — Review responses, final prep

**Goal:** Handle App Store / Play Store review feedback. Pre-launch readiness.

**Code:**
- [ ] Address any review feedback. Resubmit if needed. (Apple rejects 30-50% of first submissions — don't panic.)
- [ ] Set up status page (statuspage.io free tier, or self-host)
- [ ] Pre-fill 100 curated seed binders so day-one feed is populated
- [ ] Final smoke test on 5+ real devices (iOS old + new, Android old + new, tablet)

**Founder:**
- [ ] Confirm payment + tax info in App Store Connect and Google Play (needed even if free, for future IAP)
- [ ] Set up customer support email + response template: support@foilio.com via Resend or just Gmail
- [ ] Schedule a quiet week ahead — launch is exhausting

**Community:**
- [ ] Final tease: 24h countdown post on each platform

**DoD:**
- Apps approved and ready to release
- Seed content in place
- You've slept 8 hours/night this week

---

### Week 22 — Launch

**Goal:** Public launch. Survive the first 72 hours.

**Day of launch (block out the whole day):**
- [ ] 9 AM: Release on both stores
- [ ] 10 AM: Post launch content on all platforms simultaneously
- [ ] 10:30 AM: Email waitlist (Resend campaign)
- [ ] Throughout day: respond to every comment, DM, support email within 30 min
- [ ] Throughout day: monitor Sentry for crashes, PostHog for funnel
- [ ] 6 PM: Founder log — what worked, what broke

**Days 2-3:**
- [ ] Same engagement pace
- [ ] Hotfix any P0 issues (have EAS OTA ready)
- [ ] Coordinate creator follow-up posts (those who didn't post day 1)

**Days 4-7:**
- [ ] Begin to throttle response time as volume scales
- [ ] First retention check: who's coming back day 2? day 3? day 7?

**DoD for Week 22:**
- Apps live on both stores
- >100 organic signups (modest target — viral takes time)
- Crash-free >99.5%
- You're still standing

---

## Phase 6 — Post-launch operating (Months 6-12)

**Goal:** Find product-market fit signal. Iterate fast. Grow community.

### First 30 days

- [ ] Weekly: read every single piece of user feedback (in-app, App Store reviews, social DMs)
- [ ] Bi-weekly: ship a small improvement based on feedback
- [ ] Weekly: post on TikTok / Bluesky / X — atmospheric content, no hard sells
- [ ] Daily: monitor crash rate, retention curve, key conversion events

### Months 2-3 (post-launch v1)

- [ ] Smart scan v2 (begin ML model training if accuracy ceiling has been hit)
- [ ] Begin work on Phase 6 features: collaborative binders, DMs (with safety defaults), AR holo preview
- [ ] First "where are we" community update (post + email)

### Months 4-6 (premium tier prep)

- [ ] Build premium tier infrastructure (RevenueCat integration, gated features)
- [ ] Internal alpha of premium for ~30 days
- [ ] Premium tier launch (per Linear-style philosophy from BRAND.md)
- [ ] Affiliate revenue exploration (TCGPlayer, eBay)

### Months 7-12 (sustain & grow)

- [ ] Live binder reveals feature
- [ ] Creator program v1 (badges, monetization for top creators)
- [ ] Consider expanding to MTG or YGO if Pokemon community is saturated *and* the data model allows
- [ ] Annual security audit (~$3k-10k)

---

## Parallel workstream — Creator outreach

*Runs alongside Phases 1-5, from Week 8 onward. ~4-6 hrs/week.*

### Week 8-12: Target list + content readiness

- [ ] Build creator spreadsheet — 50 names, columns: name, platform, handle, audience, content style, contact, status
- [ ] Build a 60-second product demo video (use Week 7 Skia holo content as the hook)
- [ ] Draft personalized outreach templates (3 variants by platform: TikTok DM, YouTube email, Reddit DM)

### Week 13-16: Outreach + relationships

- [ ] 5 personalized DMs/day, M-F (= 25/week)
- [ ] Track every response in the spreadsheet
- [ ] Schedule 2-3 video calls/week with most-engaged responders
- [ ] By Week 16: 10-15 committed beta users

### Week 17-19: Beta + feedback

- [ ] Invite committed creators to TestFlight / Internal Testing
- [ ] Weekly 1:1 calls with the most active beta creators
- [ ] Document feature requests + objections — feed back into Phase 4 iteration

### Week 20-22: Launch coordination

- [ ] Send creators a launch kit (mockups, talking points, embargo timing)
- [ ] Day-of: coordinate posts (~5 creators posting in a 4-hour window beats 5 spread across a week)
- [ ] Post-launch: thank-you note + permanent "founding creator" badge in-app

---

## Founder rhythms

### Daily

- [ ] 7-9 AM: morning routine (no screens for first 30 min) + breakfast
- [ ] 9 AM-12:30 PM: **deep work block** — code, no Slack, no email
- [ ] Lunch + walk
- [ ] 1:30-4 PM: deep work or shallow work depending on energy
- [ ] 4-5 PM: founder/ops hour — community, outreach, admin
- [ ] End of day: 3-bullet journal — what I did, what I learned, what's tomorrow's top task
- [ ] Stop work by 6 PM. No exceptions for 4 weeks.

### Weekly

- [ ] **Monday morning:** open this roadmap, review current week, mark today's first task
- [ ] **Wednesday afternoon:** mid-week pulse check — am I on track for the week's DoD?
- [ ] **Friday afternoon:** week wrap — close out tasks, write a one-paragraph weekly retro, plan Monday
- [ ] **Sunday evening:** rest. Don't open the codebase. If you can't help opening it — read this line again.

### Monthly

- [ ] **First of the month:** read your daily journals from the prior month. What patterns?
- [ ] **First Sunday:** financial review — bank balance, runway months remaining, upcoming bills
- [ ] **Mid-month:** community check — what's my user feedback theme?

### Quarterly

- [ ] Take **one full week off** every quarter. Phone off. No code.
- [ ] Re-read the *Master Plan* and ask: is this still the right plan?

---

## Metrics that matter

### During build (Phases 0-3)

| Metric | Target | Where to track |
|--------|--------|----------------|
| Weekly velocity (DoD met?) | Yes | This doc |
| Build success rate | >95% | GitHub Actions |
| Type errors | 0 | tsc in CI |
| Test coverage | >60% (unit) | Vitest |
| Hours/week | 40 ±5 | Personal journal |

### Beta (Phase 4)

| Metric | Target |
|--------|--------|
| Beta users active in last 7 days | >50 |
| Crash-free sessions | >99% |
| Avg session length | >3 min |
| Day-1 retention | >50% |
| Day-7 retention | >30% |
| Feedback themes addressed | Top 10 |

### Launch (Phase 5+)

| Metric | Target (M1) | Target (M3) | Target (M6) |
|--------|-------------|-------------|-------------|
| Total signups | 1,000 | 5,000 | 25,000 |
| MAU | 400 | 2,500 | 12,000 |
| Day-7 retention | >25% | >30% | >35% |
| Day-30 retention | >15% | >20% | >25% |
| Avg binders/user | 1.5 | 2.5 | 3.5 |
| App Store rating | >4.0 | >4.3 | >4.5 |
| Crash-free | >99.5% | >99.7% | >99.8% |

---

## Health & sustainability

> **The product fails if you fail.** Solo dev burnout is the #1 reason indie products die before launch. These are not optional.

### Non-negotiables

- [ ] Sleep 7-8 hours/night, every night. No "I'll catch up on the weekend."
- [ ] One full rest day per week (Sunday recommended). No code. No social posts about the product.
- [ ] One full week off per quarter
- [ ] Move your body 30+ min/day — walk counts
- [ ] One real human conversation per day that isn't a work call
- [ ] Eat lunch away from your desk
- [ ] Annual physical + dentist + eye exam (these slip when you're heads-down)

### Burnout warning signs

If any of these are true for >5 consecutive days, take 48 hours off:

- Dreading opening the IDE
- Sleep quality degrading
- Snapping at people close to you
- Skipping meals or eating poorly without noticing
- Feeling like nothing you ship is good enough
- Inability to remember the last fun thing you did

### Loneliness mitigation

Solo founder loneliness is real, especially before launch when there's no community yet to engage with.

- [ ] Find or join 2-3 indie founder communities (IndieHackers, MicroConf Connect, Founder Cafe, builders Discord servers)
- [ ] Schedule one peer call/week with another solo founder building something
- [ ] Maintain non-product relationships intentionally — they will erode if you don't

---

## Slip protocol

When a week's DoD isn't met by Friday:

1. **Don't add hours.** Saturday-Sunday work is the burnout slope.
2. **Diagnose:** was the scope wrong, or did you lose time to something you didn't see coming?
3. **If scope wrong:** trim the next week's scope by the same amount you slipped. Don't compound.
4. **If lost time:** what was it? Add it to the *Decision log* below so future-you sees the pattern.
5. **If the same week slips twice in a row:** the plan needs revision. Re-read this roadmap critically. Talk to a peer founder before continuing.

---

## Decision log

*Append decisions and learnings here as you go. Future-you will thank present-you.*

### 2026-05-22 — Plan locked, brand sprint complete

- Name: Foilio. Brand: Holo Luxe. Backend: Supabase. Bootstrap funded.
- See `MASTER_PLAN.md` and `BRAND.md`.

---

*Last updated: 2026-05-22*
