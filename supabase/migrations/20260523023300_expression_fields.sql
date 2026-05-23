-- =====================================================================
-- Foilio — expression fields (Phase 1 Week 8 pivot)
--
-- Three additions that move the app from "premium TCG showcase" toward
-- "cute themed collection" — per the strategic shift to lean on collection-
-- level expression rather than card-level chrome.
--
-- - binders.layout_type   — how the card grid renders (default 'grid')
-- - binders.accent_color  — per-binder personality color (curated palette)
-- - cards.caption         — short prominent storytelling line (140 chars)
-- =====================================================================

alter table public.binders
  add column layout_type text not null default 'grid',
  add column accent_color text;

alter table public.cards
  add column caption text;

-- Constrain layout_type to the implemented set. Add new ones to this
-- list as the layout library grows.
alter table public.binders
  add constraint layout_type_values check (
    layout_type in ('grid', 'nine_pocket', 'scrapbook', 'spread')
  );

-- Constrain accent_color to a curated palette (mapped to hex in the app).
-- A bounded set keeps the design coherent — users pick a vibe, not a free
-- hex code that could fight the dark canvas.
alter table public.binders
  add constraint accent_color_values check (
    accent_color is null or accent_color in (
      'pink', 'mint', 'cherry', 'lemon', 'lavender', 'sky',
      'peach', 'sage', 'rose', 'coral', 'aqua', 'butter'
    )
  );

-- Captions are short by design — the story should be one sentence.
alter table public.cards
  add constraint caption_length check (caption is null or char_length(caption) <= 140);

comment on column public.binders.layout_type is
  'How the card grid renders. See packages/ui layout components.';

comment on column public.binders.accent_color is
  'Curated palette token (pink/mint/...). Mapped to hex in apps/mobile.';

comment on column public.cards.caption is
  'Short storytelling line shown prominently on the card. Max 140 chars.';
