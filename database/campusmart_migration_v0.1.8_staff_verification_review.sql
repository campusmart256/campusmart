-- CampusMart v0.1.8 — staff verification review support
-- Run this once in Supabase SQL Editor after applying Phase 23.
-- This creates/refreshes the staff review function used by /admin/verification.

create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('moderator','super_admin')),
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

drop policy if exists staff_read on public.staff;
drop policy if exists staff_admin on public.staff;

create policy staff_read
  on public.staff for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.staff s where s.user_id = auth.uid())
  );

create policy staff_admin
  on public.staff for all
  to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'super_admin'))
  with check (exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'super_admin'));

grant select on public.staff to authenticated;

grant select, update on public.verification_requests to authenticated;
grant select, update (verification_status) on public.profiles to authenticated;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff s where s.user_id = auth.uid());
$$;

grant execute on function public.is_staff() to authenticated;

create or replace function public.staff_review_verification(
  p_request_id uuid,
  p_approve boolean,
  p_reason text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_req public.verification_requests%rowtype;
begin
  if v_uid is null then raise exception 'Please log in'; end if;
  if not public.is_staff() then raise exception 'Not allowed'; end if;

  select * into v_req
    from public.verification_requests
   where id = p_request_id
     and status = 'pending';

  if not found then
    raise exception 'Request not found or already decided';
  end if;

  if not p_approve and coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required to reject';
  end if;

  update public.verification_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_by = v_uid,
         reviewed_at = now(),
         reject_reason = case when p_approve then null else p_reason end,
         full_name = case when p_approve then full_name else null end,
         course = case when p_approve then course else null end,
         year_of_study = case when p_approve then year_of_study else null end,
         registration_number = case when p_approve then registration_number else null end
   where id = p_request_id;

  update public.profiles
     set verification_status = case when p_approve then 'verified' else 'rejected' end
   where id = v_req.user_id;
end;
$$;

grant execute on function public.staff_review_verification(uuid, boolean, text) to authenticated;

-- IMPORTANT: add yourself as staff for local testing.
-- Replace YOUR_EMAIL_HERE with the email you use to log into CampusMart.
-- Keep the quotes.
--
-- insert into public.staff (user_id, role)
-- select id, 'super_admin'
-- from auth.users
-- where email = 'YOUR_EMAIL_HERE'
-- on conflict (user_id) do update set role = excluded.role;

notify pgrst, 'reload schema';
