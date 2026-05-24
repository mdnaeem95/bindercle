-- =====================================================================
-- profiles.onboarded_at — tracks whether a user has completed the
-- first-run onboarding flow (handle picker, optional display name, etc).
-- NULL means "still needs onboarding"; a timestamp means they're done.
-- =====================================================================

alter table public.profiles
  add column onboarded_at timestamptz;

-- Treat every existing user as already-onboarded so we don't bounce them
-- into the welcome flow retroactively. Only auth users created after this
-- migration get the NULL sentinel that triggers onboarding.
update public.profiles
   set onboarded_at = coalesce(updated_at, created_at, now())
 where onboarded_at is null;

comment on column public.profiles.onboarded_at is
  'When the user completed first-run onboarding (handle picker etc). NULL = still needs onboarding.';
