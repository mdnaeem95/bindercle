-- =====================================================================
-- Foilio — initial schema
-- Phase 0 Week 2 per ROADMAP.md
--
-- Domain model:
--   - profiles    1 user
--   - binders     n themed collections per profile (public or private)
--   - cards       n cards per binder, optionally linked to a Pokemon TCG ID
--   - tags        free-form, attached to binders
--   - follows     directed social graph
--   - likes/saves engagement primitives on binders
--   - comments    threaded one level deep
--   - wishlists   "cards I want" — parallel to binders
--   - pokemon_tcg_cards  local mirror of the upstream TCG API
--
-- RLS philosophy: public reads are gated by an `is_public` flag on the
-- parent binder/wishlist; writes are always gated by ownership.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------

create extension if not exists pgcrypto;     -- gen_random_uuid()
create extension if not exists pg_trgm;      -- fuzzy text search (smart card scan + search)

-- ---------------------------------------------------------------------
-- Helper: auto-update updated_at on any row change
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- Tables
-- =====================================================================

-- profiles ------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  handle        text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  link          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint handle_format check (handle ~ '^[a-z0-9_]{3,20}$'),
  constraint bio_length    check (char_length(bio) <= 280),
  constraint display_name_length check (char_length(display_name) <= 50)
);

comment on table public.profiles is
  'Public user profiles. One row per auth.users row.';

-- tags ----------------------------------------------------------------
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  created_at  timestamptz not null default now(),

  constraint slug_format check (slug ~ '^[a-z0-9-]{1,60}$')
);

comment on table public.tags is
  'Free-form tags for binders. Slug is the canonical lowercase form.';

-- binders -------------------------------------------------------------
create table public.binders (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles (id) on delete cascade,
  title             text not null,
  description       text,
  cover_image_url   text,
  is_public         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint title_length       check (char_length(title) between 1 and 100),
  constraint description_length check (char_length(description) <= 1000)
);

comment on table public.binders is
  'Themed card collections. Public binders are discoverable; private binders are owner-only.';

-- binder_tags ---------------------------------------------------------
create table public.binder_tags (
  binder_id   uuid not null references public.binders (id) on delete cascade,
  tag_id      uuid not null references public.tags (id) on delete cascade,
  created_at  timestamptz not null default now(),

  primary key (binder_id, tag_id)
);

-- pokemon_tcg_cards (referenced by cards.tcg_card_id) ---------------
create table public.pokemon_tcg_cards (
  id              text primary key,    -- TCG API ID, e.g. "base1-4"
  name            text not null,
  set_id          text not null,
  set_name        text not null,
  number          text not null,
  rarity          text,
  image_small     text,
  image_large     text,
  illustrator     text,
  release_year    integer,
  raw_json        jsonb not null,
  synced_at       timestamptz not null default now()
);

comment on table public.pokemon_tcg_cards is
  'Mirror of pokemontcg.io. Synced via an Edge Function (service role).';

-- cards ---------------------------------------------------------------
create table public.cards (
  id           uuid primary key default gen_random_uuid(),
  binder_id    uuid not null references public.binders (id) on delete cascade,
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  tcg_card_id  text references public.pokemon_tcg_cards (id),
  name         text not null,
  set_code     text,
  set_number   text,
  rarity       text,
  condition    text,
  notes        text,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint name_length      check (char_length(name) between 1 and 100),
  constraint notes_length     check (char_length(notes) <= 1000),
  constraint condition_values check (
    condition is null
    or condition in ('mint', 'near-mint', 'excellent', 'good', 'fair', 'played')
  )
);

comment on table public.cards is
  'Individual cards within a binder. tcg_card_id links to the TCG API mirror when matched.';

-- card_photos ---------------------------------------------------------
create table public.card_photos (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references public.cards (id) on delete cascade,
  url          text not null,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now()
);

-- follows -------------------------------------------------------------
create table public.follows (
  follower_id   uuid not null references public.profiles (id) on delete cascade,
  followed_id   uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),

  primary key (follower_id, followed_id),
  constraint cannot_follow_self check (follower_id <> followed_id)
);

-- likes ---------------------------------------------------------------
create table public.likes (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  binder_id   uuid not null references public.binders (id) on delete cascade,
  created_at  timestamptz not null default now(),

  primary key (user_id, binder_id)
);

-- saves ---------------------------------------------------------------
create table public.saves (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  binder_id   uuid not null references public.binders (id) on delete cascade,
  created_at  timestamptz not null default now(),

  primary key (user_id, binder_id)
);

-- comments ------------------------------------------------------------
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  binder_id   uuid not null references public.binders (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  parent_id   uuid references public.comments (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint body_length check (char_length(body) between 1 and 500)
);

comment on table public.comments is
  'Threaded comments — one level deep. A comment with parent_id is a reply.';

-- wishlists -----------------------------------------------------------
create table public.wishlists (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  title        text not null,
  description  text,
  is_public    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint title_length       check (char_length(title) between 1 and 100),
  constraint description_length check (char_length(description) <= 1000)
);

-- wishlist_items ------------------------------------------------------
create table public.wishlist_items (
  id            uuid primary key default gen_random_uuid(),
  wishlist_id   uuid not null references public.wishlists (id) on delete cascade,
  tcg_card_id   text not null references public.pokemon_tcg_cards (id),
  note          text,
  created_at    timestamptz not null default now(),

  constraint note_length check (char_length(note) <= 280)
);

comment on table public.wishlist_items is
  'Items must reference a known TCG card (no free-form wishlist items in v1).';

-- =====================================================================
-- Indexes
-- =====================================================================

-- profiles
create index profiles_handle_lower_idx on public.profiles (lower(handle));

-- binders
create index binders_owner_id_idx        on public.binders (owner_id);
create index binders_public_created_idx  on public.binders (is_public, created_at desc) where is_public;
create index binders_updated_at_idx      on public.binders (updated_at desc);

-- binder_tags
create index binder_tags_tag_id_idx on public.binder_tags (tag_id);

-- cards
create index cards_binder_position_idx on public.cards (binder_id, position);
create index cards_owner_id_idx        on public.cards (owner_id);
create index cards_tcg_card_id_idx     on public.cards (tcg_card_id);
create index cards_name_trgm_idx       on public.cards using gin (name gin_trgm_ops);

-- card_photos
create index card_photos_card_order_idx on public.card_photos (card_id, order_index);

-- follows
create index follows_followed_id_idx on public.follows (followed_id, created_at desc);

-- likes / saves
create index likes_binder_id_idx on public.likes (binder_id);
create index saves_binder_id_idx on public.saves (binder_id);

-- comments
create index comments_binder_created_idx on public.comments (binder_id, created_at desc);

-- wishlists / wishlist_items
create index wishlists_owner_id_idx           on public.wishlists (owner_id);
create index wishlist_items_wishlist_id_idx   on public.wishlist_items (wishlist_id);

-- pokemon_tcg_cards
create index pokemon_tcg_cards_name_trgm_idx on public.pokemon_tcg_cards using gin (name gin_trgm_ops);
create index pokemon_tcg_cards_set_id_idx    on public.pokemon_tcg_cards (set_id, number);

-- =====================================================================
-- Triggers — auto-update updated_at
-- =====================================================================

create trigger profiles_updated_at  before update on public.profiles  for each row execute function public.set_updated_at();
create trigger binders_updated_at   before update on public.binders   for each row execute function public.set_updated_at();
create trigger cards_updated_at     before update on public.cards     for each row execute function public.set_updated_at();
create trigger comments_updated_at  before update on public.comments  for each row execute function public.set_updated_at();
create trigger wishlists_updated_at before update on public.wishlists for each row execute function public.set_updated_at();

-- =====================================================================
-- Profile auto-creation on signup
--
-- When a new user signs in via OAuth, create a placeholder profile row.
-- The handle picker in the onboarding flow updates it.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_handle text;
begin
  -- Start with a derived handle from email local-part or random
  candidate_handle := lower(regexp_replace(
    coalesce(split_part(new.email, '@', 1), 'user_' || substr(new.id::text, 1, 8)),
    '[^a-z0-9_]', '_', 'g'
  ));
  -- Truncate to fit constraint
  candidate_handle := substr(candidate_handle, 1, 20);
  -- If too short or already taken, append random suffix
  if char_length(candidate_handle) < 3 or exists (select 1 from public.profiles where handle = candidate_handle) then
    candidate_handle := 'user_' || substr(new.id::text, 1, 8);
  end if;

  insert into public.profiles (id, handle, display_name)
  values (new.id, candidate_handle, null);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
