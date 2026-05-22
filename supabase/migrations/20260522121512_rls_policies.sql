-- =====================================================================
-- Foilio — Row-Level Security policies
--
-- Conventions:
--   - Every table has RLS enabled. No exceptions.
--   - Reads are gated by ownership OR (`is_public` of the parent resource).
--   - Writes are always gated by ownership: `auth.uid() = owner_id`.
--   - Engagement primitives (likes, saves, comments) require the parent
--     binder to be readable by the actor.
--   - pokemon_tcg_cards is read-only to clients (writes via service role).
-- =====================================================================

-- =====================================================================
-- Enable RLS on everything
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.tags              enable row level security;
alter table public.binders           enable row level security;
alter table public.binder_tags       enable row level security;
alter table public.cards             enable row level security;
alter table public.card_photos       enable row level security;
alter table public.follows           enable row level security;
alter table public.likes             enable row level security;
alter table public.saves             enable row level security;
alter table public.comments          enable row level security;
alter table public.wishlists         enable row level security;
alter table public.wishlist_items    enable row level security;
alter table public.pokemon_tcg_cards enable row level security;

-- =====================================================================
-- profiles
-- =====================================================================

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- =====================================================================
-- tags — public read, authenticated insert, no updates/deletes
-- =====================================================================

create policy "tags are publicly readable"
  on public.tags for select
  using (true);

create policy "authenticated users can create tags"
  on public.tags for insert
  to authenticated
  with check (true);

-- =====================================================================
-- binders
-- =====================================================================

create policy "public binders or owner reads"
  on public.binders for select
  using (is_public or auth.uid() = owner_id);

create policy "owner can insert binder"
  on public.binders for insert
  with check (auth.uid() = owner_id);

create policy "owner can update binder"
  on public.binders for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner can delete binder"
  on public.binders for delete
  using (auth.uid() = owner_id);

-- =====================================================================
-- binder_tags — readable if parent binder readable; writable by owner
-- =====================================================================

create policy "binder_tags readable with parent"
  on public.binder_tags for select
  using (
    exists (
      select 1 from public.binders b
      where b.id = binder_id and (b.is_public or b.owner_id = auth.uid())
    )
  );

create policy "owner can attach tag to own binder"
  on public.binder_tags for insert
  with check (
    exists (select 1 from public.binders b where b.id = binder_id and b.owner_id = auth.uid())
  );

create policy "owner can detach tag from own binder"
  on public.binder_tags for delete
  using (
    exists (select 1 from public.binders b where b.id = binder_id and b.owner_id = auth.uid())
  );

-- =====================================================================
-- cards
-- =====================================================================

create policy "cards readable with parent binder"
  on public.cards for select
  using (
    exists (
      select 1 from public.binders b
      where b.id = binder_id and (b.is_public or b.owner_id = auth.uid())
    )
  );

create policy "owner can insert card into own binder"
  on public.cards for insert
  with check (
    auth.uid() = owner_id
    and exists (select 1 from public.binders b where b.id = binder_id and b.owner_id = auth.uid())
  );

create policy "owner can update own card"
  on public.cards for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner can delete own card"
  on public.cards for delete
  using (auth.uid() = owner_id);

-- =====================================================================
-- card_photos — gated through cards
-- =====================================================================

create policy "card_photos readable with parent card"
  on public.card_photos for select
  using (
    exists (
      select 1 from public.cards c
      join public.binders b on b.id = c.binder_id
      where c.id = card_id and (b.is_public or b.owner_id = auth.uid())
    )
  );

create policy "owner can add photos to own card"
  on public.card_photos for insert
  with check (
    exists (select 1 from public.cards c where c.id = card_id and c.owner_id = auth.uid())
  );

create policy "owner can update own card photos"
  on public.card_photos for update
  using (
    exists (select 1 from public.cards c where c.id = card_id and c.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.cards c where c.id = card_id and c.owner_id = auth.uid())
  );

create policy "owner can delete own card photos"
  on public.card_photos for delete
  using (
    exists (select 1 from public.cards c where c.id = card_id and c.owner_id = auth.uid())
  );

-- =====================================================================
-- follows
-- =====================================================================

create policy "follows are publicly readable"
  on public.follows for select
  using (true);

create policy "user can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "user can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- =====================================================================
-- likes
-- =====================================================================

create policy "likes are publicly readable"
  on public.likes for select
  using (true);

create policy "user can like a readable binder"
  on public.likes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.binders b
      where b.id = binder_id and (b.is_public or b.owner_id = auth.uid())
    )
  );

create policy "user can unlike"
  on public.likes for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- saves
-- =====================================================================

create policy "saves are publicly readable"
  on public.saves for select
  using (true);

create policy "user can save a readable binder"
  on public.saves for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.binders b
      where b.id = binder_id and (b.is_public or b.owner_id = auth.uid())
    )
  );

create policy "user can unsave"
  on public.saves for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- comments
-- =====================================================================

create policy "comments readable with parent binder"
  on public.comments for select
  using (
    exists (
      select 1 from public.binders b
      where b.id = binder_id and (b.is_public or b.owner_id = auth.uid())
    )
  );

create policy "user can comment on a readable binder"
  on public.comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.binders b
      where b.id = binder_id and (b.is_public or b.owner_id = auth.uid())
    )
  );

create policy "user can update own comment"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user can delete own comment"
  on public.comments for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- wishlists
-- =====================================================================

create policy "public wishlists or owner reads"
  on public.wishlists for select
  using (is_public or auth.uid() = owner_id);

create policy "owner can insert wishlist"
  on public.wishlists for insert
  with check (auth.uid() = owner_id);

create policy "owner can update wishlist"
  on public.wishlists for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner can delete wishlist"
  on public.wishlists for delete
  using (auth.uid() = owner_id);

-- =====================================================================
-- wishlist_items — gated through parent wishlist
-- =====================================================================

create policy "wishlist_items readable with parent"
  on public.wishlist_items for select
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and (w.is_public or w.owner_id = auth.uid())
    )
  );

create policy "owner can add to own wishlist"
  on public.wishlist_items for insert
  with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.owner_id = auth.uid())
  );

create policy "owner can update own wishlist items"
  on public.wishlist_items for update
  using (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.owner_id = auth.uid())
  );

create policy "owner can remove from own wishlist"
  on public.wishlist_items for delete
  using (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.owner_id = auth.uid())
  );

-- =====================================================================
-- pokemon_tcg_cards — public read, writes via service role only
-- =====================================================================

create policy "tcg cards publicly readable"
  on public.pokemon_tcg_cards for select
  using (true);

-- No insert/update/delete policies → service role is the only writer.
