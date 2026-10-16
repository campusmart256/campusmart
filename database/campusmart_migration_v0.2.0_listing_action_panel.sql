-- CampusMart Phase 31 — listing report support for the new item action panel
-- Run this only if item reports fail because reports.listing_id is missing.

alter table public.reports
  add column if not exists listing_id uuid references public.listings(id) on delete set null;

create index if not exists reports_listing_id_idx on public.reports(listing_id);

grant select, insert on table public.reports to authenticated;

notify pgrst, 'reload schema';
