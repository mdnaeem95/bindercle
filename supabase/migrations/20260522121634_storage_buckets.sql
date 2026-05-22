-- =====================================================================
-- Foilio — storage buckets
--
-- Three public buckets:
--   - avatars       (profile pictures)
--   - binder-covers (binder cover images)
--   - card-photos   (individual card photos)
--
-- Public buckets serve files via CDN URL without auth. Discoverability
-- is gated at the application layer (RLS on the DB tables that reference
-- these URLs).
--
-- Path convention: `{user_id}/{...}` so RLS policies can verify ownership
-- by parsing the first path segment.
-- =====================================================================

-- Create buckets (idempotent on conflict)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',       'avatars',       true, 5 * 1024 * 1024,  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('binder-covers', 'binder-covers', true, 8 * 1024 * 1024,  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('card-photos',   'card-photos',   true, 12 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic'])
on conflict (id) do nothing;

-- =====================================================================
-- Storage RLS policies
-- =====================================================================

-- Read: public for all three buckets (since they're public)
create policy "public read on storage buckets"
  on storage.objects for select
  using (bucket_id in ('avatars', 'binder-covers', 'card-photos'));

-- Write: owner-only, with auth.uid() matching first path segment
create policy "users can upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('avatars', 'binder-covers', 'card-photos')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users can update their own files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('avatars', 'binder-covers', 'card-photos')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users can delete their own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('avatars', 'binder-covers', 'card-photos')
    and auth.uid()::text = (storage.foldername(name))[1]
  );
