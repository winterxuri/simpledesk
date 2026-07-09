create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  date date not null default current_date,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null default '',
  quantity numeric(14, 3) not null default 0 check (quantity >= 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  category text not null default 'Продажа',
  client_id uuid references public.clients(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  financial_operation_id uuid references public.financial_operations(id) on delete set null,
  inventory_movement_id uuid references public.inventory_movements(id) on delete set null,
  status text not null default 'completed' check (status in ('completed', 'cancelled', 'refunded')),
  comment text,
  cancel_reason text,
  cancelled_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_company_date_idx on public.sales(company_id, date);
create index if not exists sales_company_status_idx on public.sales(company_id, status);
create index if not exists sales_company_client_idx on public.sales(company_id, client_id);
create index if not exists sales_company_product_idx on public.sales(company_id, product_id);

drop trigger if exists set_sales_updated_at on public.sales;
create trigger set_sales_updated_at
before update on public.sales
for each row execute function public.set_updated_at();

alter table public.sales enable row level security;

drop policy if exists "sales_select_admin" on public.sales;
create policy "sales_select_admin"
on public.sales for select
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "sales_write_admin" on public.sales;
create policy "sales_write_admin"
on public.sales for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));
