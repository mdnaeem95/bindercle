-- =====================================================================
-- Bugfix to 20260524200000_block_enforcement.sql:
--
-- The is_blocked_between() helper queries user_blocks, but user_blocks
-- has RLS that limits each user to seeing only their OWN blocks. When
-- holohunter calls a SELECT on pichuparty's binders, the policy invokes
-- is_blocked_between(holo.uid, pichu.uid), which checks for a block
-- where blocker_id = pichu. Pichu's block row is invisible to holo
-- under RLS — so the function returns false and the block doesn't
-- enforce.
--
-- Fix: mark the function `security definer` + set the search_path. The
-- function now runs with the function-owner's privileges (typically
-- the postgres role) and can read all user_blocks rows. Since the
-- function only returns a boolean, this doesn't leak block details.
-- =====================================================================

create or replace function public.is_blocked_between(viewer uuid, other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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
