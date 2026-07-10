alter table public.appointments
  add column if not exists promotion_id uuid references public.promotions(id) on delete set null;

create index if not exists appointments_company_promotion_idx
on public.appointments(company_id, promotion_id);

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
  and (
    promotion_id is null
    or exists (
      select 1
      from public.promotions promotion
      where promotion.id = appointments.promotion_id
        and promotion.company_id = appointments.company_id
        and promotion.status in ('active', 'ending')
        and (promotion.starts_at is null or promotion.starts_at <= current_date)
        and (promotion.ends_at is null or promotion.ends_at >= current_date)
    )
  )
);
