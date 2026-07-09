alter table public.financial_operations
  add column if not exists payment_method text,
  add column if not exists source text not null default 'manual';

alter table public.financial_operations
  drop constraint if exists financial_operations_payment_method_check;

alter table public.financial_operations
  add constraint financial_operations_payment_method_check
    check (payment_method is null or payment_method in ('cash', 'card', 'transfer', 'online', 'mixed'));

alter table public.financial_operations
  drop constraint if exists financial_operations_source_check;

alter table public.financial_operations
  add constraint financial_operations_source_check
    check (source in ('manual', 'sale', 'refund', 'appointment', 'inventory'));

create index if not exists financial_operations_company_date_idx
  on public.financial_operations(company_id, date);

create index if not exists financial_operations_company_source_idx
  on public.financial_operations(company_id, source);
