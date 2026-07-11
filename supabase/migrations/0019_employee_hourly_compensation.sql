alter table public.employees
  add column if not exists hourly_rate numeric(14, 2) not null default 0;

alter table public.employees
  drop constraint if exists employees_compensation_type_check;

alter table public.employees
  add constraint employees_compensation_type_check
  check (compensation_type in ('fixed', 'hourly', 'commission', 'mixed'));

alter table public.employees
  drop constraint if exists employees_hourly_rate_nonnegative;

alter table public.employees
  add constraint employees_hourly_rate_nonnegative
  check (hourly_rate >= 0);
