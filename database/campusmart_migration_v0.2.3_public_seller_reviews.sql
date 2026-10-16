-- CampusMart v0.2.3 — public reviews received by a seller
-- Read-only: no changes to existing reviews or review submission rules.
-- Run in Supabase SQL Editor after the Phase 39/40 item_reviews migration.

create or replace function public.get_public_seller_reviews(p_seller_id uuid)
returns table (
  item_title text,
  rating integer,
  comment text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.title::text as item_title,
         r.rating,
         r.comment,
         r.created_at
    from public.item_reviews r
    join public.listings l on l.id = r.listing_id
   where r.seller_id = p_seller_id
     and l.seller_id = r.seller_id
     and l.status = 'sold'
   order by r.created_at desc, r.id desc;
$$;

-- Everyone viewing a public listing can see this seller's buyer feedback.
-- The function exposes no buyer ID, phone number, email or private details.
revoke all on function public.get_public_seller_reviews(uuid) from public;
grant execute on function public.get_public_seller_reviews(uuid) to anon, authenticated;
notify pgrst, 'reload schema';
