alter table public.sales
  add column if not exists payment_method text not null default 'cash',
  add column if not exists payment_status text not null default 'paid',
  add column if not exists discount_percent numeric(5, 2) not null default 0,
  add column if not exists discount_amount numeric(14, 2) not null default 0,
  add column if not exists promotion_id uuid references public.promotions(id) on delete set null,
  add column if not exists refunded_amount numeric(14, 2) not null default 0,
  add column if not exists refunded_quantity numeric(14, 3) not null default 0;

alter table public.sales
  drop constraint if exists sales_status_check,
  add constraint sales_status_check
    check (status in ('completed', 'cancelled', 'refunded', 'partiallyRefunded'));

alter table public.sales
  drop constraint if exists sales_payment_method_check,
  add constraint sales_payment_method_check
    check (payment_method in ('cash', 'card', 'transfer', 'online', 'mixed'));

alter table public.sales
  drop constraint if exists sales_payment_status_check,
  add constraint sales_payment_status_check
    check (payment_status in ('paid', 'partial', 'unpaid', 'refunded'));

alter table public.sales
  drop constraint if exists sales_refunds_non_negative_check,
  add constraint sales_refunds_non_negative_check
    check (
      discount_percent >= 0
      and discount_amount >= 0
      and refunded_amount >= 0
      and refunded_quantity >= 0
    );

create index if not exists sales_company_payment_method_idx on public.sales(company_id, payment_method);
create index if not exists sales_company_promotion_idx on public.sales(company_id, promotion_id);
