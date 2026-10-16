-- CampusMart Phase 60 — READ-ONLY Supabase inspection.
-- Run in Supabase SQL Editor. Does not create/alter/drop anything.
-- WARNING: SQL Editor may run with privileged access. This only inventories policy configuration;
-- it does not simulate what an ordinary student can read or write.

select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as force_rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p')
order by c.relname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public'
order by tablename, policyname;

select routine_schema, routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
order by routine_name;
