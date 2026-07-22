-- =====================================================================
-- w27 Item 2 — page-export storage bucket
--
-- The `page-export` edge function composes a page PNG server-side (Path B,
-- OTA-safe) and uploads it here; the client shares the resulting public CDN
-- URL via the RN Share sheet. Public-read so the share target (Messages,
-- socials, etc.) can fetch it without auth.
--
-- Writes come ONLY from the edge function's service-role client, so there is
-- no anon/authenticated INSERT policy — a client can never write here directly.
--
-- Path convention: `exports/{page_id}-{nonce}.png`. Objects are ephemeral
-- share artifacts; a later cleanup job / bucket lifecycle can prune them
-- (tracked as a post-launch follow-up — not load-bearing for correctness).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('exports', 'exports', true, 10 * 1024 * 1024, array['image/png'])
on conflict (id) do nothing;

-- Public read for the exports bucket (mirrors the pattern for the other
-- public buckets, added as its own policy so we don't disturb the existing one).
create policy "public read on exports bucket"
  on storage.objects for select
  using (bucket_id = 'exports');
