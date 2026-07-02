alter table public.employees
  add column if not exists compensation_type text not null default 'fixed',
  add column if not exists base_salary numeric(14, 2) not null default 0,
  add column if not exists commission_percent numeric(5, 2) not null default 0,
  add column if not exists dismissed_at date;

alter table public.financial_operations
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists employee_id uuid references public.employees(id) on delete set null,
  add column if not exists appointment_id uuid references public.appointments(id) on delete set null;

create table if not exists public.employee_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  email text not null,
  role public.company_role not null default 'employee',
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending',
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);

drop trigger if exists set_employee_invites_updated_at on public.employee_invites;
create trigger set_employee_invites_updated_at
before update on public.employee_invites
for each row execute function public.set_updated_at();

create index if not exists employee_invites_company_status_idx
on public.employee_invites(company_id, status);

alter table public.employee_invites enable row level security;

drop policy if exists "employee_invites_select_admin" on public.employee_invites;
create policy "employee_invites_select_admin"
on public.employee_invites for select
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "employee_invites_write_admin" on public.employee_invites;
create policy "employee_invites_write_admin"
on public.employee_invites for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

do $$
begin
  if to_regclass('public.ai_messages') is not null then
    execute 'drop policy if exists "ai_messages_select_member" on public.ai_messages';
    execute 'drop policy if exists "ai_messages_insert_member" on public.ai_messages';
  end if;
end $$;

drop table if exists public.ai_messages;
drop type if exists public.ai_message_role;
