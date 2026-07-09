create table if not exists public.employee_shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  type text not null default 'work',
  start_time time,
  end_time time,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_id, date)
);

alter table public.employee_shifts
  drop constraint if exists employee_shifts_type_check;

alter table public.employee_shifts
  add constraint employee_shifts_type_check
    check (type in ('work', 'dayOff', 'vacation', 'sick'));

create index if not exists employee_shifts_company_date_idx
  on public.employee_shifts(company_id, date);

create index if not exists employee_shifts_employee_date_idx
  on public.employee_shifts(employee_id, date);

drop trigger if exists set_employee_shifts_updated_at on public.employee_shifts;
create trigger set_employee_shifts_updated_at
before update on public.employee_shifts
for each row execute function public.set_updated_at();
