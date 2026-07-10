drop policy if exists "clients_insert_employee_self" on public.clients;
create policy "clients_insert_employee_self"
on public.clients for insert
with check (
  public.current_employee_id(company_id) is not null
  and responsible_employee_id = public.current_employee_id(company_id)
  and total_spent = 0
  and visits = 0
);

drop policy if exists "appointments_insert_employee_self" on public.appointments;
create policy "appointments_insert_employee_self"
on public.appointments for insert
with check (
  public.current_employee_id(company_id) is not null
  and employee_id = public.current_employee_id(company_id)
  and status = 'planned'
  and paid = false
  and price = 0
  and client_id is not null
  and exists (
    select 1
    from public.clients client
    where client.id = appointments.client_id
      and client.company_id = appointments.company_id
      and client.responsible_employee_id = public.current_employee_id(appointments.company_id)
  )
);
