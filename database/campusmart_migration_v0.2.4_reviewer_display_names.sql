-- CampusMart Phase 42: Show reviewer's public display name on seller feedback.
-- Replaces only the read-only public review RPC. No existing reviews are changed.
-- Uses profiles.id = item_reviews.buyer_id, and never exposes buyer email or phone.

-- Return columns changed, so PostgreSQL requires dropping the previous RPC first.
begin;
drop function if exists public.get_public_seller_reviews(uuid);

create function public.get_public_seller_reviews(p_seller_id uuid)
returns table (
  item_title text,
  rating integer,
  comment text,
  created_at timestamptz,
  reviewer_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.title::text,
         r.rating,
         r.comment,
         r.created_at,
         coalesce(nullif(trim(p.display_name), ''), 'CampusMart buyer')::text
    from public.item_reviews r
    join public.listings l on l.id = r.listing_id
    left join public.profiles p on p.id = r.buyer_id
   where r.seller_id = p_seller_id
     and l.seller_id = r.seller_id
     and l.status = 'sold'
   order by r.created_at desc, r.id desc;
$$;

revoke all on function public.get_public_seller_reviews(uuid) from public;
grant execute on function public.get_public_seller_reviews(uuid) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
