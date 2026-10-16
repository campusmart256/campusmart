-- CampusMart Phase 48: Saved items (bookmarks)
-- Run in Supabase SQL Editor before testing the page.
-- This does not modify existing listings or reviews.

begin;

create table if not exists public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists saved_listings_user_recent_idx
  on public.saved_listings (user_id, created_at desc);

alter table public.saved_listings enable row level security;

drop policy if exists saved_listings_select_own on public.saved_listings;
drop policy if exists saved_listings_insert_own on public.saved_listings;
drop policy if exists saved_listings_delete_own on public.saved_listings;

create policy saved_listings_select_own on public.saved_listings
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy saved_listings_insert_own on public.saved_listings
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.status = 'active'
        and l.seller_id <> (select auth.uid())
    )
  );

create policy saved_listings_delete_own on public.saved_listings
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.saved_listings from anon;
revoke all on table public.saved_listings from authenticated;
grant select, insert, delete on table public.saved_listings to authenticated;

notify pgrst, 'reload schema';
commit;
