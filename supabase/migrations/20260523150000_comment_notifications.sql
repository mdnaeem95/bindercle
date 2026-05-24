-- =====================================================================
-- Extend notifications to support comments.
--
-- New: 'comment' as a notification type, a nullable comment_id reference,
-- and a trigger on `comments` insert that pings the binder owner.
-- Delete cascade on comment_id removes notifications when the comment is
-- deleted, so the unnotify-on-delete is "free" via the FK.
-- =====================================================================

alter table public.notifications
  drop constraint type_known;

alter table public.notifications
  add column comment_id uuid references public.comments (id) on delete cascade;

alter table public.notifications
  add constraint type_known check (type in ('like', 'save', 'follow', 'comment'));

-- The dedupe index now also keys on comment_id so the (recipient, actor,
-- 'comment', binder, comment) tuple is unique per comment — but multiple
-- comments by the same actor still produce distinct notifications.
drop index notifications_dedupe_idx;

create unique index notifications_dedupe_idx on public.notifications (
  recipient_id, actor_id, type,
  coalesce(binder_id,  '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(comment_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Trigger ------------------------------------------------------------

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare binder_owner uuid;
begin
  select owner_id into binder_owner from public.binders where id = new.binder_id;
  if binder_owner is null or binder_owner = new.user_id then
    return new;
  end if;
  insert into public.notifications (recipient_id, actor_id, type, binder_id, comment_id)
  values (binder_owner, new.user_id, 'comment', new.binder_id, new.id)
  on conflict do nothing;
  return new;
end $$;

create trigger comments_notify after insert on public.comments
  for each row execute function public.notify_on_comment();
