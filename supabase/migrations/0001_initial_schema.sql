create extension if not exists pgcrypto;

do $$ begin
  create type public.company_role as enum ('owner', 'admin', 'employee');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.module_status as enum ('enabled', 'hidden', 'disabled', 'unavailable');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.client_status as enum ('active', 'new', 'loyal', 'inactive', 'attention');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_status as enum ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_status as enum ('ok', 'low', 'critical', 'out');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.resource_status as enum ('free', 'busy', 'maintenance', 'unavailable');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.promotion_status as enum ('draft', 'scheduled', 'active', 'ending', 'finished', 'paused');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_status as enum ('new', 'in_progress', 'waiting', 'done', 'overdue');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.inventory_movement_type as enum ('income', 'write_off', 'adjustment', 'transfer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.financial_operation_type as enum ('income', 'expense');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_category as enum ('clients', 'inventory', 'tasks', 'system', 'finance');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  business_template_id text not null default 'universal',
  industry text not null default 'Универсальный бизнес',
  address text,
  phone text,
  email text,
  timezone text not null default 'Europe/Moscow',
  currency text not null default 'RUB',
  work_days text[] not null default array['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
  work_hours jsonb not null default '{"start":"09:00","end":"18:00"}'::jsonb,
  terminology jsonb not null default '{}'::jsonb,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null default 'employee',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists public.company_modules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  status public.module_status not null default 'enabled',
  visible boolean not null default true,
  sort_order integer not null default 100,
  available_on_tariff boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  position text not null default 'Сотрудник',
  status text not null default 'working',
  schedule text,
  role public.company_role not null default 'employee',
  load_percent integer not null default 0 check (load_percent between 0 and 100),
  revenue numeric(14, 2) not null default 0,
  appointments_count integer not null default 0,
  rating numeric(3, 2) not null default 0,
  compensation_type text not null default 'fixed',
  base_salary numeric(14, 2) not null default 0,
  commission_percent numeric(5, 2) not null default 0,
  dismissed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  status public.client_status not null default 'new',
  responsible_employee_id uuid references public.employees(id) on delete set null,
  total_spent numeric(14, 2) not null default 0,
  visits integer not null default 0,
  last_visit date,
  next_appointment date,
  source text,
  notes text,
  communication_consent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  type text not null default 'ресурс',
  status public.resource_status not null default 'free',
  load_percent integer not null default 0 check (load_percent between 0 and 100),
  future_bookings integer not null default 0,
  resource_condition text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  resource_id uuid references public.resources(id) on delete set null,
  title text not null,
  date date not null,
  time time not null,
  duration_minutes integer not null default 60,
  price numeric(14, 2) not null default 0,
  status public.appointment_status not null default 'planned',
  paid boolean not null default false,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  type text not null default 'product',
  category text,
  current_stock numeric(14, 3) not null default 0,
  min_stock numeric(14, 3) not null default 0,
  purchase_price numeric(14, 2) not null default 0,
  sale_price numeric(14, 2) not null default 0,
  supplier text,
  status public.product_status not null default 'ok',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type public.inventory_movement_type not null,
  quantity numeric(14, 3) not null,
  date date not null default current_date,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  period text,
  starts_at date,
  ends_at date,
  status public.promotion_status not null default 'draft',
  conditions text,
  usage_count integer not null default 0,
  revenue numeric(14, 2) not null default 0,
  new_clients integer not null default 0,
  efficiency integer not null default 0 check (efficiency between 0 and 100),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  responsible_employee_id uuid references public.employees(id) on delete set null,
  due_date date,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'new',
  client_id uuid references public.clients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_operations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type public.financial_operation_type not null,
  category text not null,
  amount numeric(14, 2) not null,
  date date not null default current_date,
  comment text,
  client_id uuid references public.clients(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  category public.notification_category not null default 'system',
  important boolean not null default false,
  date date not null default current_date,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists companies_slug_idx on public.companies(slug);
create index if not exists company_members_user_idx on public.company_members(user_id);
create index if not exists employee_invites_company_status_idx on public.employee_invites(company_id, status);
create index if not exists clients_company_status_idx on public.clients(company_id, status);
create index if not exists clients_company_name_idx on public.clients(company_id, name);
create index if not exists appointments_company_date_idx on public.appointments(company_id, date);
create index if not exists tasks_company_status_idx on public.tasks(company_id, status);
create index if not exists products_company_status_idx on public.products(company_id, status);
create index if not exists notifications_company_read_idx on public.notifications(company_id, read);

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists set_company_members_updated_at on public.company_members;
create trigger set_company_members_updated_at
before update on public.company_members
for each row execute function public.set_updated_at();

drop trigger if exists set_company_modules_updated_at on public.company_modules;
create trigger set_company_modules_updated_at
before update on public.company_modules
for each row execute function public.set_updated_at();

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists set_employee_invites_updated_at on public.employee_invites;
create trigger set_employee_invites_updated_at
before update on public.employee_invites
for each row execute function public.set_updated_at();

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_resources_updated_at on public.resources;
create trigger set_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_promotions_updated_at on public.promotions;
create trigger set_promotions_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_task_checklist_items_updated_at on public.task_checklist_items;
create trigger set_task_checklist_items_updated_at
before update on public.task_checklist_items
for each row execute function public.set_updated_at();

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members member
    where member.company_id = target_company_id
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.has_company_role(
  target_company_id uuid,
  allowed_roles public.company_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members member
    where member.company_id = target_company_id
      and member.user_id = auth.uid()
      and member.role = any(allowed_roles)
  );
$$;

create or replace function public.company_has_no_members(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.company_members member
    where member.company_id = target_company_id
  );
$$;

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.company_modules enable row level security;
alter table public.employees enable row level security;
alter table public.employee_invites enable row level security;
alter table public.clients enable row level security;
alter table public.resources enable row level security;
alter table public.appointments enable row level security;
alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.promotions enable row level security;
alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.financial_operations enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "companies_select_member" on public.companies;
create policy "companies_select_member"
on public.companies for select
using (public.is_company_member(id));

drop policy if exists "companies_insert_authenticated" on public.companies;
create policy "companies_insert_authenticated"
on public.companies for insert
with check (auth.uid() is not null);

drop policy if exists "companies_update_admin" on public.companies;
create policy "companies_update_admin"
on public.companies for update
using (public.has_company_role(id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "company_members_select_member" on public.company_members;
create policy "company_members_select_member"
on public.company_members for select
using (public.is_company_member(company_id));

drop policy if exists "company_members_insert_first_or_admin" on public.company_members;
create policy "company_members_insert_first_or_admin"
on public.company_members for insert
with check (
  (
    user_id = auth.uid()
    and role = 'owner'
    and public.company_has_no_members(company_id)
  )
  or public.has_company_role(company_id, array['owner', 'admin']::public.company_role[])
);

drop policy if exists "company_members_update_owner" on public.company_members;
create policy "company_members_update_owner"
on public.company_members for update
using (public.has_company_role(company_id, array['owner']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner']::public.company_role[]));

drop policy if exists "company_members_delete_owner" on public.company_members;
create policy "company_members_delete_owner"
on public.company_members for delete
using (public.has_company_role(company_id, array['owner']::public.company_role[]));

drop policy if exists "company_modules_select_member" on public.company_modules;
create policy "company_modules_select_member"
on public.company_modules for select
using (public.is_company_member(company_id));

drop policy if exists "company_modules_write_admin" on public.company_modules;
create policy "company_modules_write_admin"
on public.company_modules for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "employees_select_member" on public.employees;
create policy "employees_select_member"
on public.employees for select
using (public.is_company_member(company_id));

drop policy if exists "employees_write_admin" on public.employees;
create policy "employees_write_admin"
on public.employees for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "employee_invites_select_admin" on public.employee_invites;
create policy "employee_invites_select_admin"
on public.employee_invites for select
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "employee_invites_write_admin" on public.employee_invites;
create policy "employee_invites_write_admin"
on public.employee_invites for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "clients_select_member" on public.clients;
create policy "clients_select_member"
on public.clients for select
using (public.is_company_member(company_id));

drop policy if exists "clients_write_member" on public.clients;
create policy "clients_write_member"
on public.clients for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "resources_select_member" on public.resources;
create policy "resources_select_member"
on public.resources for select
using (public.is_company_member(company_id));

drop policy if exists "resources_write_admin" on public.resources;
create policy "resources_write_admin"
on public.resources for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "appointments_select_member" on public.appointments;
create policy "appointments_select_member"
on public.appointments for select
using (public.is_company_member(company_id));

drop policy if exists "appointments_write_member" on public.appointments;
create policy "appointments_write_member"
on public.appointments for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "products_select_member" on public.products;
create policy "products_select_member"
on public.products for select
using (public.is_company_member(company_id));

drop policy if exists "products_write_member" on public.products;
create policy "products_write_member"
on public.products for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "inventory_movements_select_member" on public.inventory_movements;
create policy "inventory_movements_select_member"
on public.inventory_movements for select
using (public.is_company_member(company_id));

drop policy if exists "inventory_movements_write_member" on public.inventory_movements;
create policy "inventory_movements_write_member"
on public.inventory_movements for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "promotions_select_member" on public.promotions;
create policy "promotions_select_member"
on public.promotions for select
using (public.is_company_member(company_id));

drop policy if exists "promotions_write_member" on public.promotions;
create policy "promotions_write_member"
on public.promotions for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "tasks_select_member" on public.tasks;
create policy "tasks_select_member"
on public.tasks for select
using (public.is_company_member(company_id));

drop policy if exists "tasks_write_member" on public.tasks;
create policy "tasks_write_member"
on public.tasks for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "task_checklist_items_select_member" on public.task_checklist_items;
create policy "task_checklist_items_select_member"
on public.task_checklist_items for select
using (public.is_company_member(company_id));

drop policy if exists "task_checklist_items_write_member" on public.task_checklist_items;
create policy "task_checklist_items_write_member"
on public.task_checklist_items for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "financial_operations_select_admin" on public.financial_operations;
create policy "financial_operations_select_admin"
on public.financial_operations for select
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "financial_operations_write_admin" on public.financial_operations;
create policy "financial_operations_write_admin"
on public.financial_operations for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "notifications_select_member" on public.notifications;
create policy "notifications_select_member"
on public.notifications for select
using (public.is_company_member(company_id));

drop policy if exists "notifications_write_member" on public.notifications;
create policy "notifications_write_member"
on public.notifications for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));
