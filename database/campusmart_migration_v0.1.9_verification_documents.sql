-- CampusMart v0.1.9 — student proof documents for verification requests
-- Run once in Supabase SQL Editor after applying Phase 25.
-- Documents are stored in private R2 storage and referenced from verification_requests.
-- Staff open them through the protected /admin/verification/document/[id] route.

alter table public.verification_requests
  add column if not exists document_path text,
  add column if not exists document_kind text,
  add column if not exists document_name text,
  add column if not exists document_mime text,
  add column if not exists document_size integer;

alter table public.verification_requests
  drop constraint if exists verification_requests_document_kind_check,
  add constraint verification_requests_document_kind_check
    check (document_kind is null or document_kind in ('jpg','png','webp','pdf'));

alter table public.verification_requests
  drop constraint if exists verification_requests_document_size_check,
  add constraint verification_requests_document_size_check
    check (document_size is null or (document_size > 0 and document_size <= 5000000));

create index if not exists verification_requests_document_kind_idx
  on public.verification_requests(document_kind);

-- Keep table permissions working after adding columns.
grant select, insert on table public.verification_requests to authenticated;
grant select, update on table public.verification_requests to authenticated;

-- Refresh the staff review function so approving/rejecting still works after the new columns are added.
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

notify pgrst, 'reload schema';
