-- =====================================================================
-- Foilio — binder_pages
--
-- Real binders have pages. Each page is a curated unit — a 9-pocket
-- spread, a scrapbook arrangement, a hero card flanked by smaller ones.
-- Pages are individually shareable, individually styleable, and they
-- match how Pokemon TCG collectors actually think about their binders.
--
-- This migration:
--   - Adds the binder_pages table.
--   - Adds cards.page_id (FK to binder_pages).
--   - Backfills: one default "Page 1" per binder, all existing cards
--     reassigned to their binder's default page.
--   - Makes cards.page_id NOT NULL after backfill.
--   - Moves layout_type semantics: per-page layouts now. Binders keep
--     their layout_type as the *default* for new pages in that binder.
--   - RLS: pages mirror their parent binder's visibility; writes are
--     owner-only.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. The pages table
-- ---------------------------------------------------------------------

create table public.binder_pages (
  id           uuid primary key default gen_random_uuid(),
  binder_id    uuid not null references public.binders (id) on delete cascade,
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  name         text,
  layout_type  text not null default 'grid',
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint binder_page_name_length check (name is null or char_length(name) <= 60),
  constraint binder_page_layout_values check (
    layout_type in ('grid', 'nine_pocket', 'scrapbook', 'spread')
  )
);

comment on table public.binder_pages is
  'A curated subset of cards within a binder. Each page has its own layout. Pages are ordered by position within their binder.';

create index binder_pages_binder_position_idx
  on public.binder_pages (binder_id, position);

create trigger binder_pages_updated_at
  before update on public.binder_pages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. Add page_id to cards (nullable for backfill, then NOT NULL)
-- ---------------------------------------------------------------------

alter table public.cards
  add column page_id uuid references public.binder_pages (id) on delete cascade;

-- ---------------------------------------------------------------------
-- 3. Backfill: one default page per binder, copy the binder's
--    layout_type onto the default page so visual behavior is preserved.
-- ---------------------------------------------------------------------

insert into public.binder_pages (binder_id, owner_id, name, layout_type, position)
select id, owner_id, 'Page 1', layout_type, 0
from public.binders;

-- Reassign existing cards to their binder's default page.
update public.cards c
set page_id = bp.id
from public.binder_pages bp
where bp.binder_id = c.binder_id
  and bp.position = 0;

-- ---------------------------------------------------------------------
-- 4. Lock cards.page_id as required
-- ---------------------------------------------------------------------

alter table public.cards
  alter column page_id set not null;

create index cards_page_position_idx on public.cards (page_id, position);

-- ---------------------------------------------------------------------
-- 5. RLS for binder_pages
-- ---------------------------------------------------------------------

alter table public.binder_pages enable row level security;

create policy "pages readable with parent binder"
  on public.binder_pages for select
  using (
    exists (
      select 1 from public.binders b
      where b.id = binder_id and (b.is_public or b.owner_id = auth.uid())
    )
  );

create policy "owner can create page in own binder"
  on public.binder_pages for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.binders b
      where b.id = binder_id and b.owner_id = auth.uid()
    )
  );

create policy "owner can update own page"
  on public.binder_pages for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner can delete own page"
  on public.binder_pages for delete
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------
-- 6. Update the card-insert RLS to also enforce page ownership.
--    (Existing policy only checked binder ownership.)
-- ---------------------------------------------------------------------

drop policy if exists "owner can insert card into own binder" on public.cards;

create policy "owner can insert card into own page"
  on public.cards for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.binders b
      where b.id = binder_id and b.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.binder_pages p
      where p.id = page_id and p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Note on binders.layout_type:
-- We intentionally KEEP this column. It now means "default layout for
-- new pages in this binder" — pick a vibe at binder creation and every
-- new page inherits it, override per-page if you want.
-- ---------------------------------------------------------------------
