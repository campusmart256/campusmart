-- CampusMart v0.1.4 — message replies
-- Run this once in Supabase SQL Editor after applying the code update.

alter table public.messages
  add column if not exists reply_to_message_id bigint references public.messages(id) on delete set null;

create index if not exists messages_reply_to_message_id_idx
  on public.messages(reply_to_message_id);

create or replace function public.send_message_reply(
  p_conversation_id uuid,
  p_body text,
  p_reply_to_message_id bigint default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_conv public.conversations%rowtype;
  v_body text := trim(coalesce(p_body, ''));
  v_other uuid;
  v_id bigint;
  v_reply_conversation uuid;
begin
  if v_uid is null then raise exception 'Please log in'; end if;
  if char_length(v_body) < 1 or char_length(v_body) > 1000 then raise exception 'Message must be 1 to 1000 characters'; end if;
  if not public.email_confirmed(v_uid) then raise exception 'Confirm your email first'; end if;
  if public.standing_of(v_uid) not in ('active','limited') then raise exception 'Your account cannot send messages'; end if;

  select * into v_conv from public.conversations where id = p_conversation_id;
  if not found or v_uid not in (v_conv.buyer_id, v_conv.seller_id) then
    raise exception 'Conversation not found';
  end if;

  v_other := case when v_uid = v_conv.buyer_id then v_conv.seller_id else v_conv.buyer_id end;
  if public.is_blocked_between(v_uid, v_other) then raise exception 'You cannot message this person'; end if;

  if p_reply_to_message_id is not null then
    select conversation_id into v_reply_conversation
      from public.messages
      where id = p_reply_to_message_id;

    if not found or v_reply_conversation <> p_conversation_id then
      raise exception 'Reply message not found';
    end if;
  end if;

  -- Unverified senders: no links or phone numbers in their first message of a conversation
  if not public.is_verified(v_uid)
     and not exists (select 1 from public.messages m where m.conversation_id = p_conversation_id and m.sender_id = v_uid)
     and (v_body ~* '(https?://|www\.|\.com\M|\.ug\M)' or v_body ~ '(\+?256|0)[ -]?[0-9]{2,3}[ -]?[0-9]{3}[ -]?[0-9]{3,4}') then
    raise exception 'Links and phone numbers are not allowed in a first message';
  end if;

  insert into public.messages (conversation_id, sender_id, body, reply_to_message_id)
  values (p_conversation_id, v_uid, v_body, p_reply_to_message_id)
  returning id into v_id;

  update public.conversations set last_message_at = now() where id = p_conversation_id;
  return v_id;
end $$;

grant execute on function public.send_message_reply(uuid, text, bigint) to authenticated;
