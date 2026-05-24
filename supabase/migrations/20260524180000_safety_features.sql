-- =====================================================================
-- Safety features required by Apple App Store review for user-generated
-- content + social apps:
--   - user_blocks : a user can block another user
--   - reports    : a user can flag binders / cards / comments / users
--
-- Apple guideline 1.2 (User Generated Content) requires a way to report
-- objectionable content + block abusive users in-app. 5.1.1(v) requires
-- in-app account deletion (handled by the `delete-account` edge function;
-- no schema change needed since auth.users delete already cascades).
-- =====================================================================

-- user_blocks --------------------------------------------------------

create table public.user_blocks (
  blocker_id   uuid not null references public.profiles (id) on delete cascade,
  blocked_id   uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),

  primary key (blocker_id, blocked_id),
  constraint cannot_block_self check (blocker_id <> blocked_id)
);

comment on table public.user_blocks is
  'Directed block graph. The blocker no longer sees the blocked user''s content.';

create index user_blocks_blocker_idx on public.user_blocks (blocker_id);

alter table public.user_blocks enable row level security;

create policy "blockers read their own blocks"
  on public.user_blocks for select
  using (auth.uid() = blocker_id);

create policy "blockers create their own blocks"
  on public.user_blocks for insert
  with check (auth.uid() = blocker_id);

create policy "blockers delete their own blocks"
  on public.user_blocks for delete
  using (auth.uid() = blocker_id);

-- reports ------------------------------------------------------------

create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles (id) on delete cascade,
  target_type   text not null,
  target_id     uuid not null,
  reason        text not null,
  description   text,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  resolution    text,

  constraint target_type_known check (target_type in ('binder', 'card', 'comment', 'user')),
  constraint reason_known check (
    reason in ('spam', 'harassment', 'inappropriate', 'impersonation', 'other')
  ),
  constraint description_length check (char_length(description) <= 1000)
);

comment on table public.reports is
  'User reports for moderation. Inserted by reporters; only service_role reads them for review.';

create index reports_reporter_idx on public.reports (reporter_id, created_at desc);
create index reports_target_idx   on public.reports (target_type, target_id);
create index reports_pending_idx  on public.reports (created_at desc) where resolved_at is null;

alter table public.reports enable row level security;

-- Reporters can create reports + see their own. No one but service_role
-- can read the full table — moderation happens outside the app.
create policy "reporters create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "reporters see their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);
