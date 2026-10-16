-- CampusMart v0.1.6 — safe message delete-for-me
-- Run once in Supabase SQL Editor after applying Increment 17.
-- This does NOT remove messages from the database. It only hides selected
-- messages from the user who deleted them, so safety reports and moderation
-- evidence are preserved.

create table if not exists public.message_deletions (
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id bigint not null references public.messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

alter table public.message_deletions enable row level security;

drop policy if exists "message_deletions_select_own" on public.message_deletions;
drop policy if exists "message_deletions_insert_own" on public.message_deletions;

create policy "message_deletions_select_own"
  on public.message_deletions for select
  using (auth.uid() = user_id);

create policy "message_deletions_insert_own"
  on public.message_deletions for insert
  with check (auth.uid() = user_id);

create or replace function public.hide_message_for_me(p_message_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_conversation_id uuid;
  v_buyer_id uuid;
  v_seller_id uuid;
begin
  if v_uid is null then raise exception 'Please log in'; end if;

  select m.conversation_id, c.buyer_id, c.seller_id
    into v_conversation_id, v_buyer_id, v_seller_id
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
   where m.id = p_message_id;

  if not found or v_uid not in (v_buyer_id, v_seller_id) then
    raise exception 'Message not found';
  end if;

  insert into public.message_deletions (user_id, message_id)
  values (v_uid, p_message_id)
  on conflict (user_id, message_id) do nothing;
end $$;

grant execute on function public.hide_message_for_me(bigint) to authenticated;
