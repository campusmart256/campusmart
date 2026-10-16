-- CampusMart v0.1.3 — message read status helpers
-- Run this once in Supabase SQL Editor after applying the code update.
-- It uses the existing messages.read_at column from the base schema.

create or replace function public.mark_conversation_read(p_conversation_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_conv public.conversations%rowtype;
  v_count integer := 0;
begin
  if v_uid is null then raise exception 'Please log in'; end if;

  select * into v_conv from public.conversations where id = p_conversation_id;
  if not found or v_uid not in (v_conv.buyer_id, v_conv.seller_id) then
    raise exception 'Conversation not found';
  end if;

  update public.messages
     set read_at = coalesce(read_at, now())
   where conversation_id = p_conversation_id
     and sender_id <> v_uid
     and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end $$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;
