-- CampusMart v0.2.2 — buyer item reviews
-- Run once after applying Phase 39.
-- Buyers can review an item only after the seller marks that listing as sold to them.

create table if not exists public.item_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id),
  unique (buyer_id, listing_id)
);

create index if not exists item_reviews_seller_id_created_at_idx
  on public.item_reviews(seller_id, created_at desc);

create index if not exists item_reviews_buyer_id_created_at_idx
  on public.item_reviews(buyer_id, created_at desc);

alter table public.item_reviews enable row level security;

drop policy if exists "item_reviews_select_authenticated" on public.item_reviews;

create policy "item_reviews_select_authenticated"
  on public.item_reviews
  for select
  to authenticated
  using (true);

grant select on table public.item_reviews to authenticated;

create or replace function public.submit_item_review(
  p_listing_id uuid,
  p_rating integer,
  p_comment text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_review_id uuid;
  v_comment text := nullif(trim(coalesce(p_comment, '')), '');
begin
  if v_uid is null then
    raise exception 'Please log in';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Choose a rating from 1 to 5';
  end if;

  if char_length(coalesce(v_comment, '')) > 500 then
    raise exception 'Review must be 500 characters or less';
  end if;

  select * into v_listing
    from public.listings
   where id = p_listing_id;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.status <> 'sold' then
    raise exception 'You can review only after the item is marked sold';
  end if;

  if v_listing.sold_to_user_id is null or v_listing.sold_to_user_id <> v_uid then
    raise exception 'Only the buyer can review this item';
  end if;

  if v_listing.seller_id = v_uid then
    raise exception 'You cannot review your own item';
  end if;

  insert into public.item_reviews (listing_id, seller_id, buyer_id, rating, comment)
  values (p_listing_id, v_listing.seller_id, v_uid, p_rating, v_comment)
  returning id into v_review_id;

  perform public.log_audit(
    'submit_item_review',
    'listing',
    p_listing_id::text,
    'rating=' || p_rating::text
  );

  return v_review_id;
exception
  when unique_violation then
    raise exception 'You have already reviewed this item';
end;
$$;

grant execute on function public.submit_item_review(uuid, integer, text) to authenticated;

notify pgrst, 'reload schema';
