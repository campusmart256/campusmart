-- CampusMart Phase 43: Inventory and partial sales, preserving earlier reviews.
-- Run AFTER Phase 42 and the buyer item reviews migration.
-- Atomic stock deductions prevent overselling when two sales happen together.
begin;

alter table public.listings
  add column if not exists quantity_available integer not null default 1;
-- Existing fully sold listings should have zero stock.
update public.listings set quantity_available = 0 where status = 'sold' and quantity_available > 0;
alter table public.listings drop constraint if exists listings_quantity_available_check;
alter table public.listings add constraint listings_quantity_available_check
  check (quantity_available between 0 and 100000);

create table if not exists public.listing_sales (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  seller_id uuid not null references auth.users(id),
  buyer_id uuid references auth.users(id),
  quantity integer not null check (quantity between 1 and 100000),
  sold_outside boolean not null default false,
  created_at timestamptz not null default now(),
  constraint listing_sales_buyer_choice_check check (not (sold_outside and buyer_id is not null))
);
create index if not exists listing_sales_buyer_idx on public.listing_sales(buyer_id, created_at desc);
create index if not exists listing_sales_listing_idx on public.listing_sales(listing_id);
alter table public.listing_sales enable row level security;
drop policy if exists listing_sales_read_participants on public.listing_sales;
create policy listing_sales_read_participants on public.listing_sales
  for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid());
grant select on public.listing_sales to authenticated;
revoke insert, update, delete on public.listing_sales from authenticated, anon;

create or replace function public.record_listing_sale(
  p_listing_id uuid,
  p_buyer_id uuid,
  p_outside boolean,
  p_quantity integer
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_listing public.listings%rowtype;
  v_remaining integer;
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 100000 then
    raise exception 'Choose a valid quantity';
  end if;
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found or v_listing.seller_id <> auth.uid() then raise exception 'Listing not found'; end if;
  if v_listing.status <> 'active' then raise exception 'Only active listings can record sales'; end if;
  if p_quantity > v_listing.quantity_available then raise exception 'Only % units left', v_listing.quantity_available; end if;
  if p_buyer_id = auth.uid() then raise exception 'You cannot buy your own item'; end if;
  if coalesce(p_outside,false) and p_buyer_id is not null then raise exception 'Choose one buyer type'; end if;
  if p_buyer_id is not null and not exists (
    select 1 from public.conversations c
    where c.listing_id = p_listing_id and c.seller_id = auth.uid() and c.buyer_id = p_buyer_id
  ) then raise exception 'That buyer has not messaged about this listing'; end if;

  v_remaining := v_listing.quantity_available - p_quantity;
  insert into public.listing_sales(listing_id, seller_id, buyer_id, quantity, sold_outside)
  values (p_listing_id, auth.uid(), p_buyer_id, p_quantity, coalesce(p_outside,false));
  update public.listings
     set quantity_available = v_remaining,
         status = case when v_remaining = 0 then 'sold' else status end,
         sold_to_user_id = case when v_remaining = 0 then p_buyer_id else null end,
         sold_outside = case when v_remaining = 0 then coalesce(p_outside,false) else false end
   where id = p_listing_id;
  return v_remaining;
end $$;
revoke all on function public.record_listing_sale(uuid,uuid,boolean,integer) from public;
grant execute on function public.record_listing_sale(uuid,uuid,boolean,integer) to authenticated;

-- Allow a seller to correct stock from the Edit listing form.
create or replace function public.set_listing_stock(p_listing_id uuid, p_quantity integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_listing public.listings%rowtype;
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 100000 then
    raise exception 'Enter 1 to 100000 available units';
  end if;
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found or v_listing.seller_id <> auth.uid() then raise exception 'Listing not found'; end if;
  if v_listing.status not in ('draft','active','expired') then raise exception 'Stock cannot be edited for this listing'; end if;
  update public.listings set quantity_available = p_quantity where id = p_listing_id;
end $$;
revoke all on function public.set_listing_stock(uuid,integer) from public;
grant execute on function public.set_listing_stock(uuid,integer) to authenticated;

-- Buyers can review a recorded sale even if the seller still has units available.
-- Keep the existing one-review-per-buyer-per-listing rule.
create or replace function public.submit_item_review(
  p_listing_id uuid, p_rating integer, p_comment text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_review_id uuid;
  v_comment text := nullif(trim(coalesce(p_comment,'')), '');
begin
  if v_uid is null then raise exception 'Please log in'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'Choose a rating from 1 to 5'; end if;
  if char_length(coalesce(v_comment,'')) > 500 then raise exception 'Review must be 500 characters or less'; end if;
  select * into v_listing from public.listings where id = p_listing_id;
  if not found then raise exception 'Listing not found'; end if;
  if v_listing.seller_id = v_uid then raise exception 'You cannot review your own item'; end if;
  if not exists (select 1 from public.listing_sales s where s.listing_id = p_listing_id and s.buyer_id = v_uid)
     and not (v_listing.status = 'sold' and v_listing.sold_to_user_id = v_uid) then
    raise exception 'Only a recorded buyer can review this item';
  end if;
  insert into public.item_reviews(listing_id,seller_id,buyer_id,rating,comment)
  values (p_listing_id,v_listing.seller_id,v_uid,p_rating,v_comment)
  returning id into v_review_id;
  return v_review_id;
exception when unique_violation then
  raise exception 'You have already reviewed this item';
end $$;
revoke all on function public.submit_item_review(uuid,integer,text) from public;
grant execute on function public.submit_item_review(uuid,integer,text) to authenticated;

-- Show genuine reviews on all of a seller's listings, even when the purchased item has remaining stock.
create or replace function public.get_public_seller_reviews(p_seller_id uuid)
returns table(item_title text, rating integer, comment text, created_at timestamptz, reviewer_name text)
language sql stable security definer set search_path = '' as $$
  select l.title::text, r.rating, r.comment, r.created_at,
         coalesce(nullif(trim(p.display_name),''),'CampusMart buyer')::text
  from public.item_reviews r
  join public.listings l on l.id = r.listing_id
  left join public.profiles p on p.id = r.buyer_id
  where r.seller_id = p_seller_id and l.seller_id = r.seller_id
    and (exists (select 1 from public.listing_sales s where s.listing_id = l.id and s.buyer_id = r.buyer_id)
      or (l.status = 'sold' and l.sold_to_user_id = r.buyer_id))
  order by r.created_at desc, r.id desc;
$$;
revoke all on function public.get_public_seller_reviews(uuid) from public;
grant execute on function public.get_public_seller_reviews(uuid) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
