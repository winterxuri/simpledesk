alter table public.appointments
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at date;

create index if not exists appointments_company_cancelled_idx
on public.appointments(company_id, cancelled_at)
where cancelled_at is not null;
