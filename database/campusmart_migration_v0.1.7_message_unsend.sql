-- CampusMart v0.1.7 — safe unsend for unread messages
-- Run once in Supabase SQL Editor after applying Increment 19.
-- This hides a sent message from normal chat screens only if the other person
-- has not opened/read it yet. The original body remains in the database so
-- moderators can still review evidence if a report is made.

alter table public.messages
  add column if not exists unsent_at timestamptz,
  add column if not exists unsent_by uuid references auth.users(id) on delete set null;

create index if not exists messages_unsent_at_idx on public.messages(unsent_at);

create or replace function public.unsend_message_if_unread(p_message_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_sender uuid;
  v_conversation uuid;
  v_buyer uuid;
  v_seller uuid;
  v_read_at timestamptz;
  v_unsent_at timestamptz;
begin
  if v_uid is null then raise exception 'Please log in'; end if;

  select m.sender_id, m.conversation_id, m.read_at, m.unsent_at, c.buyer_id, c.seller_id
    into v_sender, v_conversation, v_read_at, v_unsent_at, v_buyer, v_seller
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
   where m.id = p_message_id;

  if not found or v_uid not in (v_buyer, v_seller) then
    raise exception 'Message not found';
  end if;

  if v_sender <> v_uid then
    raise exception 'You can only unsend your own messages';
  end if;

  if v_unsent_at is not null then
    return;
  end if;

  if v_read_at is not null then
    raise exception 'This message has already been opened by the other person';
  end if;

  update public.messages
     set unsent_at = now(), unsent_by = v_uid
   where id = p_message_id;
end $$;

grant execute on function public.unsend_message_if_unread(bigint) to authenticated;
