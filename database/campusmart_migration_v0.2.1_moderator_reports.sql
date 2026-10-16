-- CampusMart v0.2.1 — moderator reports dashboard support
-- Run once after applying Phase 37.

alter table public.reports
  add column if not exists target_listing_id uuid references public.listings(id) on delete set null,
  add column if not exists listing_id uuid references public.listings(id) on delete set null,
  add column if not exists status text not null default 'open',
  add column if not exists handled_by uuid references auth.users(id),
  add column if not exists handled_at timestamptz,
  add column if not exists resolution_note text;

create index if not exists reports_status_created_at_idx on public.reports(status, created_at desc);
create index if not exists reports_listing_id_idx on public.reports(listing_id);
create index if not exists reports_target_listing_id_idx on public.reports(target_listing_id);

alter table public.reports enable row level security;

drop policy if exists reports_insert on public.reports;
drop policy if exists reports_read on public.reports;

create policy reports_insert
  on public.reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy reports_read
  on public.reports
  for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_staff());

grant select, insert on table public.reports to authenticated;
grant select, update on table public.reports to authenticated;
grant select on table public.listings to authenticated;
grant update (status) on table public.listings to authenticated;

create or replace function public.staff_resolve_report(
  p_report_id uuid,
  p_status text,
  p_note text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  if not public.is_staff() then raise exception 'Not allowed'; end if;
  if p_status not in ('dismissed','actioned') then raise exception 'Invalid status'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'A moderator note is required'; end if;

  update public.reports
     set status = p_status,
         handled_by = auth.uid(),
         handled_at = now(),
         resolution_note = p_note
   where id = p_report_id
     and status = 'open';

  if not found then
    raise exception 'Report not found or already closed';
  end if;

  perform public.log_audit('resolve_report:' || p_status, 'report', p_report_id::text, p_note);
end $$;

create or replace function public.staff_remove_listing(
  p_listing_id uuid,
  p_reason text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  if not public.is_staff() then raise exception 'Not allowed'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'A reason is required'; end if;

  update public.listings
     set status = 'removed'
   where id = p_listing_id;

  if not found then
    raise exception 'Listing not found';
  end if;

  perform public.log_audit('remove_listing', 'listing', p_listing_id::text, p_reason);
end $$;

grant execute on function public.staff_resolve_report(uuid, text, text) to authenticated;
grant execute on function public.staff_remove_listing(uuid, text) to authenticated;

notify pgrst, 'reload schema';
