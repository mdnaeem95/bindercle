-- =====================================================================
-- Notifications
--
-- Engagement events (like / save / follow) auto-generate a notification
-- row for the affected user via triggers. Insert is restricted to those
-- triggers (no RLS INSERT policy) — users only read & mark-as-read.
--
-- Dedupe: one notification per (recipient, actor, type, binder) tuple,
-- so unlike→re-like doesn't spam. The matching delete-trigger cleans
-- the row up, restoring the "fresh notification" feel on re-engagement.
-- =====================================================================

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  actor_id      uuid not null references public.profiles (id) on delete cascade,
  type          text not null,
  binder_id     uuid references public.binders (id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),

  constraint type_known      check (type in ('like', 'save', 'follow')),
  constraint different_actor check (recipient_id <> actor_id)
);

comment on table public.notifications is
  'Engagement notifications. Inserts come from triggers on likes/saves/follows; users only read & mark-as-read.';

-- Dedupe across the (recipient, actor, type, binder) tuple. binder_id is
-- nullable for follow notifications, so we coalesce to a sentinel UUID so
-- the unique index still treats nulls as equal-by-tuple.
create unique index notifications_dedupe_idx on public.notifications (
  recipient_id, actor_id, type,
  coalesce(binder_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index notifications_recipient_unread_idx
  on public.notifications (recipient_id) where read_at is null;

alter table public.notifications enable row level security;

-- Recipients read & update (mark-read) their own rows. No insert policy:
-- inserts go through security-definer triggers below.
create policy "viewers read their own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "viewers update their own notifications"
  on public.notifications for update
  using (auth.uid() = recipient_id);

create policy "viewers delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = recipient_id);

-- =====================================================================
-- Triggers — create / remove notifications on engagement.
-- =====================================================================

create or replace function public.notify_on_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare binder_owner uuid;
begin
  select owner_id into binder_owner from public.binders where id = new.binder_id;
  if binder_owner is null or binder_owner = new.user_id then
    return new;
  end if;
  insert into public.notifications (recipient_id, actor_id, type, binder_id)
  values (binder_owner, new.user_id, 'like', new.binder_id)
  on conflict do nothing;
  return new;
end $$;

create trigger likes_notify after insert on public.likes
  for each row execute function public.notify_on_like();

create or replace function public.unnotify_on_unlike()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
   where actor_id  = old.user_id
     and binder_id = old.binder_id
     and type      = 'like';
  return old;
end $$;

create trigger likes_unnotify after delete on public.likes
  for each row execute function public.unnotify_on_unlike();

create or replace function public.notify_on_save()
returns trigger language plpgsql security definer set search_path = public as $$
declare binder_owner uuid;
begin
  select owner_id into binder_owner from public.binders where id = new.binder_id;
  if binder_owner is null or binder_owner = new.user_id then
    return new;
  end if;
  insert into public.notifications (recipient_id, actor_id, type, binder_id)
  values (binder_owner, new.user_id, 'save', new.binder_id)
  on conflict do nothing;
  return new;
end $$;

create trigger saves_notify after insert on public.saves
  for each row execute function public.notify_on_save();

create or replace function public.unnotify_on_unsave()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
   where actor_id  = old.user_id
     and binder_id = old.binder_id
     and type      = 'save';
  return old;
end $$;

create trigger saves_unnotify after delete on public.saves
  for each row execute function public.unnotify_on_unsave();

create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.follower_id = new.followed_id then
    return new;
  end if;
  insert into public.notifications (recipient_id, actor_id, type)
  values (new.followed_id, new.follower_id, 'follow')
  on conflict do nothing;
  return new;
end $$;

create trigger follows_notify after insert on public.follows
  for each row execute function public.notify_on_follow();

create or replace function public.unnotify_on_unfollow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
   where recipient_id = old.followed_id
     and actor_id     = old.follower_id
     and type         = 'follow';
  return old;
end $$;

create trigger follows_unnotify after delete on public.follows
  for each row execute function public.unnotify_on_unfollow();
