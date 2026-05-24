-- =====================================================================
-- Bidirectional block enforcement at the RLS layer.
--
-- Before this migration:  blocks were only client-side filters (the
-- blocker stopped seeing the blocked user's content, but the blocked
-- user could still see + interact with the blocker).
--
-- After this migration:  RLS prevents the blocked user from reading the
-- blocker's binders, commenting on them, liking them, saving them, or
-- following the blocker. The relationship is symmetric — either side
-- having blocked the other cuts off the interaction.
--
-- Apple App Store guideline 1.2 requires blocking to actually prevent
-- the blocked user from interacting; client-side filters alone aren't
-- sufficient.
-- =====================================================================

-- Helper: is there a block in EITHER direction between these two users?
create or replace function public.is_blocked_between(viewer uuid, other uuid)
returns boolean
language sql
stable
as $$
  select case
    when viewer is null or other is null then false
    else exists (
      select 1 from public.user_blocks
      where (blocker_id = viewer and blocked_id = other)
         or (blocker_id = other and blocked_id = viewer)
    )
  end;
$$;

comment on function public.is_blocked_between is
  'True if either user has blocked the other. Used by RLS policies to enforce blocks bidirectionally.';

-- 1. binders SELECT — drop blocked owners
drop policy if exists "public binders or owner reads" on public.binders;
create policy "public binders or owner reads"
  on public.binders for select
  using (
    (is_public or auth.uid() = owner_id)
    and not public.is_blocked_between(auth.uid(), owner_id)
  );

-- 2. comments SELECT — drop comments authored by anyone you're blocked with
drop policy if exists "comments readable with parent binder" on public.comments;
create policy "comments readable with parent binder"
  on public.comments for select
  using (
    exists (
      select 1 from public.binders b
      where b.id = binder_id and (b.is_public or b.owner_id = auth.uid())
    )
    and not public.is_blocked_between(auth.uid(), user_id)
  );

-- 3. comments INSERT — can't comment on a binder owned by someone you're blocked with
drop policy if exists "user can comment on a readable binder" on public.comments;
create policy "user can comment on a readable binder"
  on public.comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.binders b
      where b.id = binder_id
        and (b.is_public or b.owner_id = auth.uid())
        and not public.is_blocked_between(auth.uid(), b.owner_id)
    )
  );

-- 4. likes INSERT
drop policy if exists "user can like a readable binder" on public.likes;
create policy "user can like a readable binder"
  on public.likes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.binders b
      where b.id = binder_id
        and (b.is_public or b.owner_id = auth.uid())
        and not public.is_blocked_between(auth.uid(), b.owner_id)
    )
  );

-- 5. saves INSERT
drop policy if exists "user can save a readable binder" on public.saves;
create policy "user can save a readable binder"
  on public.saves for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.binders b
      where b.id = binder_id
        and (b.is_public or b.owner_id = auth.uid())
        and not public.is_blocked_between(auth.uid(), b.owner_id)
    )
  );

-- 6. follows INSERT — can't follow someone you're blocked with
drop policy if exists "user can follow others" on public.follows;
create policy "user can follow others"
  on public.follows for insert
  with check (
    auth.uid() = follower_id
    and not public.is_blocked_between(auth.uid(), followed_id)
  );
