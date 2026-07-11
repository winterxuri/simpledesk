create or replace function public.revoke_dismissed_employee_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> 'owner'
    and new.status = 'dismissed'
    and old.status is distinct from new.status
    and old.user_id is not null
  then
    delete from public.company_members
    where company_id = new.company_id
      and user_id = old.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists revoke_dismissed_employee_access on public.employees;
create trigger revoke_dismissed_employee_access
after update of status on public.employees
for each row execute function public.revoke_dismissed_employee_access();

delete from public.company_members member
using public.employees employee
where employee.company_id = member.company_id
  and employee.user_id = member.user_id
  and employee.role <> 'owner'
  and employee.status = 'dismissed';

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'clients'
  ) then
    execute 'alter publication supabase_realtime add table public.clients';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'appointments'
  ) then
    execute 'alter publication supabase_realtime add table public.appointments';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'employees'
  ) then
    execute 'alter publication supabase_realtime add table public.employees';
  end if;
end
$$;
