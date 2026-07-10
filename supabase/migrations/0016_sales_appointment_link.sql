alter table public.sales
  add column if not exists appointment_id uuid references public.appointments(id) on delete set null;

create index if not exists sales_company_appointment_idx
on public.sales(company_id, appointment_id);
