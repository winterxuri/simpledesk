alter table public.employee_shifts enable row level security;

drop policy if exists "employee_shifts_select_member" on public.employee_shifts;
create policy "employee_shifts_select_member"
on public.employee_shifts for select
using (public.is_company_member(company_id));

drop policy if exists "employee_shifts_write_admin" on public.employee_shifts;
create policy "employee_shifts_write_admin"
on public.employee_shifts for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));
