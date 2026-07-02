create table if not exists public.report_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  period_start date not null,
  period_end date not null,
  generated_at timestamptz not null default now(),
  summary jsonb not null default '{}'::jsonb,
  sections jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_report_snapshots_updated_at on public.report_snapshots;
create trigger set_report_snapshots_updated_at
before update on public.report_snapshots
for each row execute function public.set_updated_at();

create index if not exists report_snapshots_company_period_idx
on public.report_snapshots(company_id, period_start, period_end);

alter table public.report_snapshots enable row level security;

drop policy if exists "report_snapshots_select_admin" on public.report_snapshots;
create policy "report_snapshots_select_admin"
on public.report_snapshots for select
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "report_snapshots_write_admin" on public.report_snapshots;
create policy "report_snapshots_write_admin"
on public.report_snapshots for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));
