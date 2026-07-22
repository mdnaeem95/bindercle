-- =====================================================================
-- w27 Item 1a — anonymous read of public content
--
-- Context: the app was built forced-auth *at the client* (the route guard
-- bounced every unauthenticated user to /sign-in). The RLS layer, however,
-- was already written with public-read semantics:
--   - every SELECT policy here is `to public` (no TO clause), so it already
--     applies to the `anon` role, and
--   - each one collapses to its `is_public` branch when auth.uid() is null
--     (an anonymous request), and is_blocked_between(null, _) returns false.
-- So public rows are already *policy*-visible to anon. What this migration
-- does is make the ROLE GRANTS explicit and defensive, so the anon-browse
-- surface can't silently drift:
--
--   1. Grant SELECT to `anon` on exactly the public-read tables.
--   2. Revoke every other privilege (INSERT/UPDATE/DELETE) from `anon` on
--      those tables — writes stay auth-gated; anon is read-only, belt and
--      suspenders on top of the write policies.
--   3. Revoke ALL from `anon` on the private tables (notifications,
--      user_blocks, reports, wishlists, wishlist_items). Their RLS already
--      denies anon (policies require auth.uid()), but removing the default
--      grant means anon can't even attempt the read. Defense in depth.
--
-- No new policies are added: the existing `to public` + is_public policies
-- already express the correct row-level filter for anon. Private binders,
-- private profiles' rows, and any auth.uid()-gated table stay invisible.
--
-- profiles note: the table has NO email column (email lives in auth.users,
-- which anon cannot touch). Granting anon SELECT on profiles exposes only
-- handle / display_name / avatar_url / bio / link — all public profile
-- fields. Nothing sensitive to column-restrict.
-- =====================================================================

-- Anon needs schema usage to reach any table (idempotent; Supabase grants
-- this by default, restated here so the migration is self-contained).
grant usage on schema public to anon;

-- ---------------------------------------------------------------------
-- 1. Public-read surface — anon gets SELECT, nothing else.
-- ---------------------------------------------------------------------

-- profiles: public profile fields (no email in this table)
revoke all on public.profiles from anon;
grant select on public.profiles to anon;

-- tags + binder_tags: discovery taxonomy
revoke all on public.tags from anon;
grant select on public.tags to anon;
revoke all on public.binder_tags from anon;
grant select on public.binder_tags to anon;

-- binders: policy filters to is_public for anon
revoke all on public.binders from anon;
grant select on public.binders to anon;

-- binder_pages: policy mirrors parent binder visibility
revoke all on public.binder_pages from anon;
grant select on public.binder_pages to anon;

-- cards + card_photos: gated through parent binder's is_public
revoke all on public.cards from anon;
grant select on public.cards to anon;
revoke all on public.card_photos from anon;
grant select on public.card_photos to anon;

-- pokemon_tcg_cards: canonical catalog, already publicly readable
revoke all on public.pokemon_tcg_cards from anon;
grant select on public.pokemon_tcg_cards to anon;

-- engagement graph: counts + lists are public (policies use(true))
revoke all on public.follows from anon;
grant select on public.follows to anon;
revoke all on public.likes from anon;
grant select on public.likes to anon;
revoke all on public.saves from anon;
grant select on public.saves to anon;
revoke all on public.comments from anon;
grant select on public.comments to anon;

-- ---------------------------------------------------------------------
-- 2. Private surface — anon gets nothing. RLS already denies these for
--    a null auth.uid(); revoking the default grant is defense in depth.
-- ---------------------------------------------------------------------

revoke all on public.notifications  from anon;
revoke all on public.user_blocks    from anon;
revoke all on public.reports        from anon;
revoke all on public.wishlists      from anon;
revoke all on public.wishlist_items from anon;

-- ---------------------------------------------------------------------
-- 3. Verification (run manually with the ANON key, not service_role):
--
--   -- should return public binders + their pages/cards/photos/tags:
--   select id from binders;                 -- only is_public = true rows
--   select id from binder_pages;            -- only pages of public binders
--   select id from cards;                   -- only cards of public binders
--   -- should return the public profile fields, never email (not a column):
--   select handle, display_name, bio from profiles;
--   -- should return ZERO rows / permission denied for anon:
--   select * from notifications;            -- RLS + no grant
--   select * from reports;                  -- RLS + no grant
--   select * from wishlists;                -- RLS + no grant
--   -- private binders must NOT appear:
--   select id from binders where is_public = false;   -- 0 rows for anon
--
-- Over-exposure is the risk; test the private cases explicitly.
-- ---------------------------------------------------------------------
