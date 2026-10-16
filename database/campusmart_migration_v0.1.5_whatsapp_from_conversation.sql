-- CampusMart v0.1.5 — reveal WhatsApp from an existing conversation
-- Run this once in Supabase SQL Editor after applying Increment 14.
-- This is safer for chat: the buyer reveals the seller's opt-in WhatsApp through the conversation.

create or replace function public.reveal_whatsapp_from_conversation(p_conversation_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_buyer uuid;
  v_seller uuid;
  v_listing uuid;
  v_listing_title text;
  v_listing_status text;
  v_number text;
  v_enabled boolean;
  v_count integer;
begin
  if v_uid is null then raise exception 'Please log in'; end if;
  if not public.email_confirmed(v_uid) then raise exception 'Confirm your email first'; end if;
  if public.standing_of(v_uid) not in ('active','limited') then raise exception 'Your account cannot do this'; end if;

  select c.buyer_id, c.seller_id, c.listing_id, l.title, l.status
    into v_buyer, v_seller, v_listing, v_listing_title, v_listing_status
    from public.conversations c
    join public.listings l on l.id = c.listing_id
   where c.id = p_conversation_id;

  if not found or v_uid not in (v_buyer, v_seller) then
    raise exception 'Conversation not found';
  end if;

  if v_uid <> v_buyer then
    raise exception 'Only the buyer can reveal the seller''s WhatsApp number for this listing';
  end if;

  if v_seller = v_uid then raise exception 'This is your own listing'; end if;
  if public.is_blocked_between(v_uid, v_seller) then raise exception 'Contact not available'; end if;

  -- Keep the marketplace rule: do not reveal WhatsApp for unavailable listings.
  if v_listing_status <> 'active' then
    raise exception 'Listing not available';
  end if;

  select p.whatsapp_enabled, s.whatsapp_number
    into v_enabled, v_number
    from public.profiles p
    join public.private_settings s on s.user_id = p.id
   where p.id = v_seller;

  if not coalesce(v_enabled, false) or v_number is null then
    raise exception 'WhatsApp contact is not available';
  end if;

  select count(distinct listing_id) into v_count
    from public.whatsapp_reveals
   where user_id = v_uid
     and created_at > now() - interval '24 hours'
     and listing_id <> v_listing;

  if v_count >= public.setting_int('whatsapp_reveals_per_day') then
    raise exception 'Daily WhatsApp contact limit reached';
  end if;

  insert into public.whatsapp_reveals (user_id, listing_id)
  values (v_uid, v_listing);

  return jsonb_build_object('number', v_number, 'listing_title', v_listing_title);
end $$;

grant execute on function public.reveal_whatsapp_from_conversation(uuid) to authenticated;
