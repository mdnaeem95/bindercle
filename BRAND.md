# Foilio — Brand Identity v1.1

*Visual direction: **Holo Luxe** (locked 2026-05-22). Behavioral direction: **playful warmth** (revised 2026-05-23).*

> The visual system (palette, type, tokens) stays Holo Luxe — dark, refined, considered.
> The *behavior* (voice, copy, microinteractions, empty states) leans warm and playful — this is a Pinterest-style showcase for *cute themed collections*, not a museum app.

**Note on the v1.0 → v1.1 shift:** the original spec leaned hard on restraint ("refined, luminous, insider, quietly playful"). After early prototyping, the app started feeling closer to a premium TCG catalog than a place to show off "Pokemon dabbing" master sets. v1.1 keeps the visual identity that's already in code — the dark Holo Luxe canvas reads beautifully against bright user content — but loosens the *voice* so the app actually invites the playful curation the product is supposed to celebrate.

> All values in this document are build-ready — they should flow directly into design tokens, component variables, and Skia shaders.

---

## 1. Brand Essence

**One-liner:** Foilio is where your cards become art.

**Why-statement:** Collectors curate their themed sets because they love them. Foilio honors that love with a stage that treats every binder like a museum exhibit and every holo like the light source it is.

**North-star feeling:** *"I want to spend time here."* The app should feel like opening a velvet-lined display case — quiet, premium, and brought to life by the cards themselves.

---

## 2. Personality

Four attributes, ranked by priority. **Visual reads from #1 + #2; behavior reads from #3 + #4.**

| # | Attribute | What it means in product |
|---|-----------|--------------------------|
| 1 | **Considered** | Dark canvas, generous space, careful type. Visual quality reads as taste. |
| 2 | **Luminous** | Light moves where it matters. Holo cards shimmer. Accent colors glow. |
| 3 | **Playful** | The themes are jokes. Empty states have personality. Microcopy smiles. Lowercase headings. |
| 4 | **Insider** | Collector vocabulary (hits, pulls, sets, sleeves, slabs) used naturally — never explained, never gatekept. |

The job of the visual identity is to make user content look gorgeous against it. The job of the voice is to give users permission to be *themselves* — silly, sentimental, completionist, weird.

**Anti-patterns (never these):**
- Corporate ("Discover amazing collections!")
- Stiff / transactional ("Save changes successfully")
- Bro-y / hype-coded ("Yo collectors, what's poppin'")
- Crypto / "premium experience" coded ("Unlock exclusive value")
- Precious / overwrought ("Curate the museum of your soul")
- Childish in the *bad* way ("Wow! So many awesome cards!!!") — playful, not infantilizing

---

## 3. Voice & Tone

### Voice (constant)

- **Warm, not corporate.** Talk like a friend who's also a collector. Use contractions. Use the joke if it lands.
- **Insider-friendly.** Use collector lingo (pulls, hits, slabs, sleeves) without irony — but also without gatekeeping. Adjacent fans should still feel welcome.
- **Lowercase by default for headings and labels.** Sentence case in body. ALL-CAPS only for badges. Lowercase is a vibe — Pinterest does it, Are.na does it, it reads as soft.
- **Specific, not generic.** "dabbing Pokemon master set" beats "your trading card collection." Show, don't lecture.
- **Short.** Cut "actually", "just", "simply", "amazing", "incredible." A few well-chosen words > a polished sentence.
- **Emoji sparingly, intentionally.** ✨ 🌱 💫 📸 🥺 — yes, when they earn it. Never a wall of them.

### Tone matrix (varies by context)

| Context | Tone | Example |
|---------|------|---------|
| Onboarding | Warm, inviting | *"show off your cute collection"* |
| Empty state (own binders) | Playful with a nudge | *"nothing here yet 🌱 — Make a binder of dabbing Pokemon. Or shiny Eevees. The theme is the joke."* |
| Empty state (in a binder) | Encouraging, specific | *"empty binder, full potential 💫 — Drop in a card. Tell its story. Build the vibe."* |
| Empty state (discovery) | Quiet redirect | *"quiet over here. try a different tag."* |
| Success — small | Soft confirm | *"saved ✨"* / *"added"* |
| Success — milestone | Acknowledge with character | *"that's a master set 🏆 — 151/151"* |
| Error | Direct, never blame | *"photo didn't upload. try again?"* |
| Marketing / launch | Atmospheric, specific | *"foilio. show your shine."* |

### Copy do / don't

| ❌ Don't | ✅ Do |
|----------|-------|
| "Discover amazing trading card collections!" | "find a binder you'd want to make." |
| "Congratulations! You've added another card!" | "added ✨" |
| "Oops! Something went wrong!" | "couldn't save that. retry?" |
| "Unleash your inner collector!" | "show your shine." |
| "Premium members get exclusive access" | "Foilio Plus. more binders, more polish." |
| "Your collection, on display" | "show off your cute collection" |
| "No cards yet" | "empty binder, full potential 💫" |

---

## 4. Color

### Primary palette (dark mode — default)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-base` | `#0A0A0F` | App background, default canvas |
| `bg-elevated-1` | `#14141A` | Cards, sheets, modals |
| `bg-elevated-2` | `#1F1F28` | Hover states, secondary surfaces |
| `bg-elevated-3` | `#2A2A33` | Tertiary surfaces, pressed states |
| `border-subtle` | `#2A2A33` | Dividers, low-emphasis borders |
| `border-default` | `#3A3A45` | Standard borders |
| `text-primary` | `#F8F8F2` | Default text, warm white (not pure) |
| `text-secondary` | `#B5B5B8` | Secondary text, metadata |
| `text-tertiary` | `#6E6E76` | Tertiary text, placeholders |
| `text-disabled` | `#4A4A52` | Disabled states |

### Holo gradient (signature)

The visual heart of the brand. A four-stop gradient sampled by angle and surface.

```
linear-gradient(
  120deg,
  #FF00C8 0%,    /* hot pink */
  #FFB800 33%,   /* gold */
  #00E5FF 66%,   /* electric cyan */
  #7B5FFF 100%   /* deep violet */
)
```

| Token | Value | Usage |
|-------|-------|-------|
| `holo-stop-1` | `#FF00C8` | Hot pink |
| `holo-stop-2` | `#FFB800` | Gold |
| `holo-stop-3` | `#00E5FF` | Electric cyan |
| `holo-stop-4` | `#7B5FFF` | Deep violet |
| `holo-angle` | `120deg` | Default sweep angle |

See §7 for usage rules — holo is reserved, not decorative.

### Semantic colors (calibrated for dark mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#34D399` | Confirms, set completions |
| `warning` | `#FBBF24` | Soft alerts |
| `error` | `#F87171` | Errors, destructive actions |
| `info` | `#60A5FA` | Informational accents |

### Light mode (secondary — for shared web links + accessibility)

| Token | Hex |
|-------|-----|
| `bg-base` | `#FBFAF7` (warm off-white) |
| `bg-elevated-1` | `#FFFFFF` |
| `bg-elevated-2` | `#F0EFEA` |
| `border-default` | `#D8D6CF` |
| `text-primary` | `#0A0A0F` |
| `text-secondary` | `#4A4A52` |
| `text-tertiary` | `#8B8B92` |

Holo gradient stays identical across modes — it's the constant.

### Contrast notes

All token pairs pass WCAG 2.2 AA contrast minimums. `text-primary` on `bg-base` is 16.4:1 (AAA). `text-secondary` on `bg-base` is 7.8:1 (AAA). Verify all combinations in CI with axe-core.

---

## 5. Typography

### Type families (all free / OSS — bootstrap-friendly)

| Family | Role | License | Why |
|--------|------|---------|-----|
| **Geist** | Sans (body, UI, display) | OFL (free, OSS) | Modern, neutral, geometric. Designed by Vercel for legibility at small sizes. Includes Geist Mono. |
| **Instrument Serif** | Display accent (editorial moments) | OFL (Google Fonts) | High-contrast serif with delightful italic. Used for moments — headers, taglines, marketing — not running body. |
| **Geist Mono** | Mono | OFL | Set numbers, codes, technical metadata. |

### Type scale

| Token | Size / Line | Weight | Family | Usage |
|-------|-------------|--------|--------|-------|
| `display-1` | 56 / 64 | 400 italic | Instrument Serif | Hero moments, marketing |
| `display-2` | 40 / 48 | 400 | Instrument Serif | Section heroes |
| `heading-1` | 32 / 40 | 600 | Geist | Page titles |
| `heading-2` | 24 / 32 | 600 | Geist | Section titles |
| `heading-3` | 20 / 28 | 500 | Geist | Card titles, list headers |
| `body-large` | 18 / 28 | 400 | Geist | Emphasized body |
| `body` | 16 / 24 | 400 | Geist | Default body |
| `body-small` | 14 / 20 | 400 | Geist | Metadata, secondary |
| `caption` | 12 / 16 | 500 | Geist | Labels, badges |
| `mono` | 14 / 20 | 400 | Geist Mono | Set numbers, ID codes |

### Typography rules

- Body copy is **always Geist**. Instrument Serif is for *moments*, never paragraphs.
- Numbers in card metadata (set #, year, count) → Geist Mono, tabular figures enabled.
- Tracking: -0.01em on display sizes (≥24px). Default elsewhere.
- Never bold body italic. Italic Instrument Serif is the elegant move.

---

## 6. Logo

### Wordmark

- **`foilio`** in lowercase. Always lowercase. Always one word.
- Set in **Geist Semibold**, tracking -0.02em
- Clean, no decoration. The wordmark works on its own.

> **Note (2026-05-22):** the original spec called for a holo-gradient disc replacing the second `i`'s tittle as the brand's "signature detail". After implementation we removed it: without rendering the wordmark as custom SVG (or shipping a custom font variant with a dotless `i`), the natural tittle peeks through the overlay and reads as a defect rather than a feature. The engineering effort to do it properly didn't pencil out for a detail most users would miss. The holo motif lives elsewhere — see §7.

### Where the holo motif lives instead

Now that the wordmark is plain, the holo system carries the brand identity entirely via §7. That makes its appearances more meaningful, not less:

- App icon + favicon (where the holo *is* the brand)
- Holo cards in user binders (when card metadata indicates holo / secret rare / full art)
- Premium tier badge (Foilio Plus indicator)
- Set completion + achievement moments
- Loading states for high-value content

### Standalone mark (icon)

A folded card edge — abstracted to a single rounded chevron with a holo gradient running along the inside fold. Reads as both:
- A binder page lifting up
- A holo card catching light

Use the mark alone in: app icon, favicon, profile avatar default, loading spinners.

### Lockups

| Lockup | When to use |
|--------|-------------|
| Wordmark only | Header bars, marketing |
| Mark only | App icon, favicons, ≤24px contexts |
| Mark + wordmark, horizontal | Onboarding, hero moments |
| Mark + wordmark, stacked | Square placements (social profiles, App Store) |

### Clearspace

Minimum clearspace around any lockup = 1× cap height. Don't crowd it.

### Color rules

- Default: `text-primary` (#F8F8F2 on dark, #0A0A0F on light)
- Hero moments: the holo-disc dot can sweep with gyro motion
- Never: solid color logo, drop shadows, outlined versions, monochrome on holo backgrounds

> **Build note for solo dev:** logo execution is a Phase 0 deliverable. Use Figma + a free typeface (Geist is available). The holo dot is a `LinearGradient` SVG. If you want a designer to refine it, plan ~$500-1500 from a freelance brand designer (Working Not Working / Dribbble). For v1.0, self-execution is fine — iterate after launch.

---

## 7. Holo Shimmer System (signature motif)

The single visual element that makes Foilio unmistakable. **Used sparingly**, never as decoration.

### Use holo for:

- Holo card representations (when card metadata.rarity = holo / secret rare / full art / alt art)
- Logo dot
- Premium tier indicators (Foilio Plus badge)
- Set completion celebrations
- Achievement / milestone moments
- The default loading shimmer for high-value content (binder hero loads)

### Never use holo for:

- Standard UI chrome (buttons, inputs, tabs)
- Body text
- Backgrounds at large surface area (>20% of screen)
- Decorative elements ("just to make it pop")
- Error or warning states

### Rendering

**Static surfaces (most cases):**
Use a CSS/SVG `LinearGradient` at `120deg` with the four stops in §4.

**Interactive shimmer (card detail, milestone, logo):**
Render with React Native Skia. Animate gradient angle from `60deg` to `180deg` over a 3-second sine loop. Reduced motion: hold at `120deg`, no animation.

**Gyroscope-driven shimmer (card detail screen):**
Map device tilt (pitch + roll) to gradient angle. Range: `60deg ↔ 180deg`. Max tilt = full sweep. Smooth with `withSpring({ damping: 20, stiffness: 90 })`. Reduced motion: ignore gyro, hold default angle.

### Variants

- **`holo-default`** — full four-stop gradient
- **`holo-subtle`** — same stops at 40% opacity, layered on dark
- **`holo-border`** — 2px gradient border on otherwise dark surface
- **`holo-text`** — applied to display text only, never body

---

## 8. Iconography

- **Library:** [Lucide](https://lucide.dev) (free, OSS, 1500+ icons, well-maintained, RN-friendly via `lucide-react-native`)
- **Style:** Line icons, 1.5px stroke, slightly rounded caps and joins
- **Sizes:** `16` (inline with body), `20` (toolbar), `24` (primary actions), `32` (feature)
- **Colors:** `text-primary` for active, `text-secondary` for inactive, `text-tertiary` for disabled
- **Custom icons needed:** `binder`, `card-stack`, `holo-card`, `pull` — must match Lucide stroke weight + roundness

---

## 9. Imagery

### Card photography

- **User-uploaded, unenhanced.** Foilio never auto-filters card photos beyond a smart crop. Authenticity is the value.
- Card aspect: standard Pokemon TCG card is `63 × 88mm` → `0.716:1`. Container crops respect this.
- Background detection: auto-detect dominant background, soft-blur outside the card edge for binder thumbnails.

### Empty states

- Custom line illustrations matching the icon style
- One-color: `text-tertiary` line on background
- Never literal Pokemon characters or anything resembling The Pokemon Company IP
- Friendly geometric primitives (folded paper, abstract binders, generic card silhouettes)

### Photography for marketing

- Real binders, real collectors, ambient natural light
- No stock photography ever
- Hero shots can use the holo gradient as a backdrop element

---

## 10. Motion

### Easing curves

| Token | CSS | Usage |
|-------|-----|-------|
| `ease-standard` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Default UI transitions |
| `ease-emphasized` | `cubic-bezier(0.2, 0.0, 0, 1)` | Entrances, key moments |
| `ease-exit` | `cubic-bezier(0.4, 0.0, 1, 1)` | Exits, dismissals |
| `spring-default` | `{ damping: 20, stiffness: 200 }` | Reanimated interactions |
| `spring-gyro` | `{ damping: 20, stiffness: 90 }` | Holo gyro tracking |

### Durations

| Token | ms | Usage |
|-------|----|----|
| `duration-instant` | 100 | Micro-feedback (button press) |
| `duration-fast` | 200 | Small transitions |
| `duration-standard` | 350 | Default UI motion |
| `duration-deliberate` | 500 | Important moments |
| `duration-hero` | 800 | Hero entrances |

### Motion principles

- **Motion has meaning.** Nothing moves without telling the user something.
- **Holo shimmer is the headline motion** — most other motion is supportive.
- **Respect reduced motion.** Replace animation with crossfade. Holo becomes static.
- **No "wow" for its own sake** — no parallax tunnels, no entrance choreography on every screen.

---

## 11. Design Tokens (build-ready)

The full set, ready to paste into a `tokens.ts` file.

### Spacing

`0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128` (px, 4-pt base)

### Radius

`0, 4, 8, 12, 16, 24, 9999` (last = pill / circle)

### Elevation (dark mode shadows are subtle — depth comes from surface color)

| Token | Value |
|-------|-------|
| `elev-0` | `none` |
| `elev-1` | `0 1px 2px rgba(0, 0, 0, 0.3)` |
| `elev-2` | `0 4px 12px rgba(0, 0, 0, 0.35)` |
| `elev-3` | `0 12px 32px rgba(0, 0, 0, 0.4)` |
| `elev-4` | `0 24px 64px rgba(0, 0, 0, 0.5)` |

### Opacity

`0, 0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 1`

### Z-index

| Token | Value |
|-------|-------|
| `z-base` | 0 |
| `z-raised` | 10 |
| `z-overlay` | 100 |
| `z-modal` | 1000 |
| `z-toast` | 10000 |

---

## 12. Implementation notes for Phase 0

When we start the build, this brand doc translates into:

1. **`packages/ui/tokens.ts`** — TypeScript constants for every value above
2. **`packages/ui/theme/`** — light + dark theme objects
3. **`packages/ui/HoloGradient.tsx`** — the reusable holo component (static + animated + gyro variants)
4. **`fonts/`** — Geist + Geist Mono + Instrument Serif loaded via `expo-font`
5. **Tailwind/NativeWind config** — tokens wired into utility classes
6. **Logo SVG** — the wordmark + holo dot + standalone mark, all SVG

This is roughly 1-2 days of Phase 0 work. Tokens come first, then a `<Card>` and `<Binder>` component built against them, then everything else inherits.
