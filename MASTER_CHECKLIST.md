# Foilio — Master Test Checklist

A comprehensive walk-through of every feature shipped so far. Use this as a pre-release sanity pass.

**Before you start:**
1. Run `pnpm seed` (needs `SUPABASE_SERVICE_ROLE_KEY` in `apps/mobile/.env.local`). This creates 5 fake personas — `@pichuparty`, `@holohunter`, `@setarchivist`, `@misprintmuse`, `@midnightpulls` — with binders, pages, cards, follows, likes, saves, and comments. They'll also follow / like / comment on **your** stuff so notifications light up.
2. Build a dev client and sign in with your real account.
3. Work through the sections below in order. Each item is meant to be tappable on device.

---

## 1. Auth & Sign-in

- [Y] Cold-launch the app → splash holds until fonts + auth resolve (no flash of sign-in then redirect)
- [Y] **Apple Sign In** works (native sheet, no nonce mismatch error)
- [Y] **Google Sign In** works (browser pops, redirects back, ends up on Home)
- [Y] After sign-in, your `@handle` is auto-derived from your email and the profile row exists
- [Y] Force-quit the app and relaunch → still signed in (session persisted via SecureStore)
- [N - no sign out button anywhere] Sign out (from profile editor) → redirected to `/sign-in`

## 2. Profile

- [Y] Tap your avatar in the Home header → opens `/profile/edit`
- [Y] **Handle** validation: shows "Available" / "Checking…" / "Handle is taken" / "Lowercase letters, numbers, underscores"
- [Y] Edit display name, bio (≤280 chars), link → Save persists and Home updates
- [Y] **Change photo** → picker opens, photo uploads, avatar updates everywhere (Home, comments, notifications)
- [Somewhat - form doesnt actually allow any character past 280] Try a too-long bio → form blocks save with an error
- [Y - but should put some stats here. And clicking on the Avatar should lead to this stats first before having a button that allows to edit.] Visit `/users/<your-own-id>` directly → routes to the "this is you" notice (no follow button)

## 3. Binders — CRUD

- [Y] **+ button** on Home → template picker appears with 8 themed vibes, each with a Lucide icon (no emoji)
- [Y] Pick a template → new binder form is prefilled (title, description, tags, accent, layout)
- [Y] "Start blank" also works → empty form
- [Y] Cover picker shows the **ImagePlus icon + "Tap to pick a cover"** placeholder; pick an image → cover appears
- [Y] Accent picker shows all 12 colors; binder card border + title tint update accordingly
- [Y] Tag picker: type → suggestions appear; tap chip to add; Enter creates a new tag; tap chip to remove
- [Y] Save → binder appears at the top of "Mine"
- [Y] Edit existing binder → all fields rehydrate; Save updates everywhere
- [Somewhat - requires a cold start. It should be optimistic or we should have a pull to refresh. And also, default should be private instead of public] Toggle **Public / Private** → respected on Discover feed (private binders never appear)
- [Y] Delete binder → confirmation alert, then it's gone (cascades to pages + cards)

## 4. Pages

- [Y] Open a binder → Pages grid (2-col) with thumbnails + card count + page name (or "Page N" fallback)
- [Y] **+ Add page** → form with name + layout picker → new page appears
- [Y] Open page → header shows page name + binder title; cards render per the page's layout type
- [Y] **Edit page**: rename, change layout (grid → nine_pocket → scrapbook → spread), delete
- [Somewhat - deleting leads me to the binder details. But when I swipe left/back, that page is still available even though I just deleted it. We should disable back navigation after deletion.] Delete page with cards → alert warns "All cards on this page will be removed too"; confirm wipes them
- [Y] **Reorganize pages**: when ≥2 pages, tap Reorganize → pages wiggle Springboard-style → long-press + drag → tap Done → order persists
- [Y - but it appears on their individual pages, even though it doesnt save it, we should remove it.] Reorganize button doesn't appear on someone else's binder
- [Y] Empty binder shows the `BookOpen` icon + "No pages yet" copy

## 5. Cards

- [Y] **+ Add card** on a page → form opens
- [Y] Type a name → TCG suggestions appear (debounced ~350ms, EN/JP toggle); pick one → set/number/rarity autofill, official art appears in a "Linked to TCG card" row with CheckCircle icon
- [Y] Add multi-line caption → ≤140 chars enforced
- [Y] Add photos: pick from library OR camera; multi-photo carousel renders on detail
- [Y] Set / number / rarity / condition / notes → all save
- [Y] Save → card lands at the end of the page; thumbnail shows the photo (or TCG art if no photo, or name fallback)
- [Y] Card detail screen: hero image (your photo wins; falls back to TCG `image_large`); back arrow icon respects Dynamic Island safe area
- [N - Update photos does not appear in editing cards.] **Edit card** → all fields rehydrate; can Unlink TCG card; can update photos
- [Y] **Move to Page** button (above Delete) — opens picker, current page disabled, card counts shown
- [Y] Try Move with dirty form → "Save your changes first" alert
- [Y] Move → card appears on target page at the end; source page no longer shows it; you're routed to the target page
- [Somewhat - deleting leads me to the page details. But when I swipe left/back, that card details page is still available even though I just deleted it. We should disable back navigation after deletion.] Delete card → confirmation, gone, route back to page detail
- [Y] **Reorganize cards** on a page: tap Reorganize when ≥2 cards → cards wiggle in 3-col grid → long-press + drag → cards shuffle to make space → Done persists

## 6. Discover

- [Y] Switch to **Discover** tab → public binders appear (you should see the 5 seed personas' binders)
- [Y] Each card has author avatar + handle/display-name underneath
- [Y] Tap author chip → routes to `/users/<id>` (NOT the binder)
- [Y] Tap binder cover → opens binder detail
- [Y] Scroll near the bottom → next page auto-loads (you should have at least 10+ binders if seed ran)
- [Y] Discover empty state ever — try as a brand-new user before seeding: shows `Compass` icon + "Quiet in here"

## 7. Saved

- [Y] Discover → tap a binder → tap the bookmark icon in the header overlay → it fills in
- [N - Nope bookmarked binders does not appear at all.] Switch to **Saved** tab → that binder appears
- [N - can't test due to previous issue.] Un-save (tap bookmark again) → Saved tab updates (binder gone)
- [Y] Empty Saved state: `Bookmark` icon + "Nothing saved yet"

## 8. Public profiles

- [Y] From Discover, tap the author chip on a seed binder → their profile loads
- [Y] Header shows: avatar (88px), display name, @handle, bio, link (with `LinkIcon`)
- [Y] **Follower / following counts** show under the avatar
- [Y] **Follow button**: tap → label changes to "Following" instantly (optimistic), follower count bumps by 1; tap again → reverts
- [Y] Below the header: grid of that user's public binders
- [Y] Tap one of their binders → binder detail loads (read-only — no Edit, no Reorganize, no + Add page)
- [Y] On someone else's binder, the header overlay shows **Heart + Bookmark** (with counts on the heart) instead of Edit
- [Y] Like a binder → heart fills in (♥), count goes up by 1
- [Y] Save a binder → bookmark fills in
- [Y] Returning to your own binder → header shows Edit (no like/save)

## 9. Comments

- [Y] On any binder, scroll to the **Comments** row below the description/tags → it shows `MessageCircle` icon + "N comments" or "Be the first to comment"
- [Y] Tap → opens comments screen
- [Y] Pre-existing comments from seed personas render: avatar + handle + body + time-ago
- [Y] Tap an avatar → routes to that user's profile
- [Y] Compose at the bottom: type → Send button activates (filled white) → tap → comment appears in the list, draft clears
- [Y] Comment with >500 chars → "Too long" alert
- [Y] Your own comments have a small trash icon → confirm dialog → deletes
- [Y] Empty comments state: `MessageCircle` icon + "No comments yet" / "Be the first to say something nice."
- [Y] Keyboard avoidance: composer slides up when keyboard appears, content scrolls
- [Y] Posting a comment on someone else's binder triggers a notification on their end (verify in their account if you have one, or check the notification triggers fired by querying SQL editor)

## 10. Notifications

- [Y] Bell icon visible in Home header next to + button
- [Y] After running seed, you should have unread notifications (seed personas liked / saved / followed / commented on your stuff)
- [Y] Bell shows a **small pink dot** when unread > 0
- [Y] Tap bell → notifications screen
- [Y] Rows show: actor avatar + small badge icon (`Heart` pink for likes, `Bookmark` for saves, `MessageCircle` green-ish for comments, `UserPlus` blue for follows), action verb, binder title, time-ago, binder thumbnail on the right
- [Y] Unread rows have a tinted background
- [Y] On open, unread badge clears (within a moment) and all rows mark read
- [Y] Tap a like / save / comment notification → routes to the binder (comment notifications go to `/binders/<id>/comments`)
- [Y] Tap a follow notification → routes to the actor's profile
- [Y] Like a seed user's binder, then unlike → notification should appear then disappear (verify on a second account if you have one)
- [Y] Empty notifications state: `Bell` icon + "No notifications yet"
- [Y] Background polling: leave the app on Home for 60s → unread count refetches

## 11. Brand & visuals

- [Y] **No emoji anywhere** in the app chrome (run a quick scan or just visually check empty states, headers, buttons)
- [Y] All icons are crisp on both iOS and Android (lucide-react-native SVGs)
- [Y] Header titles are Title Case ("Edit Card", "Move to Page", "Comments", "Notifications")
- [Y] Body copy keeps the playful warmth ("Cute energy detected", "saved purely for the vibes", "Be the first to comment")
- [Y] Accent colors actually tint things: binder card border, title text, page title, page chip border, follow button (when accent set)
- [Y] Dark canvas is consistent (Holo Luxe palette); no white flashes between screens
- [Y] Geist for sans-serif, Instrument Serif for display, Geist Mono where called for
- [Y] Safe area insets respected on screens with hero images (card detail, binder detail) — nothing tucked under Dynamic Island

## 12. Empty / error states

- [Y] Home → Mine, brand new user (sign up fresh on a test account): `Sprout` icon + "Nothing here yet" + "Make my first binder" CTA
- [Y] Page with 0 cards: `Sparkles` icon + "Empty page, full potential"
- [Y] Binder with 0 pages: `BookOpen` icon + "No pages yet"
- [Y] Discover with 0 public binders (only possible pre-seed): `Compass` icon + "Quiet in here"
- [Y] Saved with 0 saves: `Bookmark` icon + "Nothing saved yet"
- [Y] Comments with 0 comments: `MessageCircle` icon + "No comments yet"
- [Y] Notifications with 0 notifications: `Bell` icon + "No notifications yet"
- [Y] Network error during a mutation (kill wifi mid-save) → user sees a non-cryptic "Couldn't save" / "Couldn't post" / "Couldn't delete" alert with the supabase message
- [Y] Public profile fetch fails (try `/users/bogus-id`) → spinner, then eventually an error or fall-back

## 13. Permissions & RLS

- [Y] You CANNOT edit someone else's binder (even by URL manipulation): `/binders/<their-id>/edit` either loads but Save fails, or RLS blocks the read (private binders aren't visible at all)
- [Y] You CANNOT add a page or card to someone else's binder (UI hides the buttons; even if you mock a request, RLS rejects it)
- [Y] Private binders never appear on Discover or another user's profile
- [Y] Comments by other users on your binder are visible to you; you can delete them only if they're yours (Trash2 only on own rows)
- [Y] Service-role key is NOT in any committed file (`grep -r SUPABASE_SERVICE_ROLE_KEY .` should only hit `apps/mobile/.env.local` and `scripts/seed.ts` comments)

## 14. Observability

- [Y] Sentry: throw a deliberate error (e.g., temporarily make a save fail) → it appears in the Sentry dashboard with a screen-name breadcrumb
- [Y] PostHog: navigation events show up (PostHog dashboard → Live events → screen views like `/`, `/binders/<id>`, `/notifications`)
- [Y] PostHog: discrete events fire — `card_created`, `card_updated`, `card_moved`, `cards_reordered`, `pages_reordered`, `binder_like_toggled`, `binder_save_toggled`, `user_follow_toggled`, `comment_added`, `comment_deleted`

## 15. Cross-device / scaling

- [Y] iPhone with Dynamic Island → headers + hero photos don't crash into it
- [Y] iPhone SE-class (small) → forms still scroll, keyboard doesn't cover the Send button
- [Y] Rotate to landscape mid-binder-detail → re-render is sane (or stays portrait if locked)
- [Y] Android emulator (if available) → icons + layout match iOS

## 16. Performance smell-test

- [Y] Discover scrolling: smooth (60fps-ish), no jank on infinite scroll page boundary
- [Y] Drag-to-reorganize: pickup feels instant, surrounding cards shuffle smoothly, no stutter
- [Y] Opening a binder with 30+ cards: thumbnails appear within ~1s on wifi
- [Y] Opening notifications: list paints within ~500ms, mark-read fires in background

---

## Known gaps (not yet built — don't expect these)

- ❌ Search (by tag, by handle, by binder title)
- ❌ "Following" filter on Discover
- ❌ Real-time notifications (currently polled every 60s)
- ❌ Wishlists UI (schema exists, no screens)
- ❌ OCR card scan (roadmap v1.0 item, not started)
- ❌ Notifications inbox: no swipe-to-delete (you can only mark-all-read on open)
- ❌ Account deletion + content reporting (required for App Store submission)
- ❌ Onboarding flow for brand-new users (handle picker, welcome tour)

If something on this checklist breaks, that's a bug worth fixing before the next feature. If something on the "Known gaps" list feels critical for launch, it should jump the queue.
