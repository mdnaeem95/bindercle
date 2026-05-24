-- =====================================================================
-- Switch binder + page layouts from grid / scrapbook / spread / nine_pocket
-- to the real-world pocket sizes:  four_pocket  /  nine_pocket  /  sixteen_pocket.
--
-- Pre-existing rows are migrated to nine_pocket (the closest real-binder
-- equivalent of the legacy grid/scrapbook/spread free-form layouts).
-- =====================================================================

-- 1. Drop the old check constraints so the UPDATE below isn't rejected.
alter table public.binders
  drop constraint if exists layout_type_values;

alter table public.binder_pages
  drop constraint if exists binder_page_layout_values;

-- 2. Re-map any legacy values to nine_pocket.
update public.binders
   set layout_type = 'nine_pocket'
 where layout_type in ('grid', 'scrapbook', 'spread');

update public.binder_pages
   set layout_type = 'nine_pocket'
 where layout_type in ('grid', 'scrapbook', 'spread');

-- 3. Re-add the constraints with the new enum + roll the default forward.
alter table public.binders
  alter column layout_type set default 'nine_pocket',
  add constraint layout_type_values check (
    layout_type in ('four_pocket', 'nine_pocket', 'sixteen_pocket')
  );

alter table public.binder_pages
  alter column layout_type set default 'nine_pocket',
  add constraint binder_page_layout_values check (
    layout_type in ('four_pocket', 'nine_pocket', 'sixteen_pocket')
  );
