alter table public.employees
  add column if not exists phone text,
  add column if not exists email text;

create index if not exists employees_company_user_idx
on public.employees(company_id, user_id);

create index if not exists employee_invites_token_idx
on public.employee_invites(token);

create or replace function public.get_employee_invite(invite_token uuid)
returns table (
  token uuid,
  email text,
  company_name text,
  employee_name text,
  role public.company_role,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    invite.token,
    invite.email,
    company.name as company_name,
    coalesce(employee.name, invite.email) as employee_name,
    invite.role,
    invite.status,
    invite.expires_at
  from public.employee_invites invite
  join public.companies company on company.id = invite.company_id
  left join public.employees employee on employee.id = invite.employee_id
  where invite.token = invite_token
  limit 1;
$$;

create or replace function public.accept_employee_invite(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.employee_invites%rowtype;
  current_user_id uuid;
  current_email text;
begin
  current_user_id := auth.uid();
  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if current_user_id is null then
    raise exception 'Требуется вход в аккаунт сотрудника.';
  end if;

  select *
  into invite_row
  from public.employee_invites
  where token = invite_token
  for update;

  if not found then
    raise exception 'Приглашение не найдено.';
  end if;

  if invite_row.status <> 'pending' then
    raise exception 'Приглашение уже использовано или отменено.';
  end if;

  if invite_row.expires_at < now() then
    update public.employee_invites
    set status = 'expired'
    where id = invite_row.id;
    raise exception 'Срок действия приглашения истёк.';
  end if;

  if lower(invite_row.email) <> current_email then
    raise exception 'Email аккаунта не совпадает с email приглашения.';
  end if;

  insert into public.company_members (
    company_id,
    user_id,
    role,
    display_name
  )
  values (
    invite_row.company_id,
    current_user_id,
    invite_row.role,
    coalesce(
      (select name from public.employees where id = invite_row.employee_id),
      invite_row.email
    )
  )
  on conflict (company_id, user_id)
  do update set
    role = excluded.role,
    display_name = excluded.display_name;

  update public.employees
  set
    user_id = current_user_id,
    email = invite_row.email,
    role = invite_row.role,
    status = 'working'
  where id = invite_row.employee_id
    and company_id = invite_row.company_id;

  update public.employee_invites
  set status = 'accepted'
  where id = invite_row.id;

  return invite_row.company_id;
end;
$$;

grant execute on function public.get_employee_invite(uuid) to anon, authenticated;
grant execute on function public.accept_employee_invite(uuid) to authenticated;

create or replace function public.current_employee_id(target_company_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee.id
  from public.employees employee
  where employee.company_id = target_company_id
    and employee.user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.current_employee_id(uuid) to authenticated;

drop policy if exists "clients_write_member" on public.clients;
drop policy if exists "clients_write_admin" on public.clients;
create policy "clients_write_admin"
on public.clients for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "appointments_write_member" on public.appointments;
drop policy if exists "appointments_write_admin" on public.appointments;
create policy "appointments_write_admin"
on public.appointments for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "products_write_member" on public.products;
drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin"
on public.products for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "inventory_movements_write_member" on public.inventory_movements;
drop policy if exists "inventory_movements_write_admin" on public.inventory_movements;
create policy "inventory_movements_write_admin"
on public.inventory_movements for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "promotions_write_member" on public.promotions;
drop policy if exists "promotions_write_admin" on public.promotions;
create policy "promotions_write_admin"
on public.promotions for all
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "tasks_write_member" on public.tasks;
drop policy if exists "tasks_insert_admin" on public.tasks;
create policy "tasks_insert_admin"
on public.tasks for insert
with check (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "tasks_update_admin_or_assignee" on public.tasks;
create policy "tasks_update_admin_or_assignee"
on public.tasks for update
using (
  public.has_company_role(company_id, array['owner', 'admin']::public.company_role[])
  or responsible_employee_id = public.current_employee_id(company_id)
)
with check (
  public.has_company_role(company_id, array['owner', 'admin']::public.company_role[])
  or responsible_employee_id = public.current_employee_id(company_id)
);

drop policy if exists "tasks_delete_admin" on public.tasks;
create policy "tasks_delete_admin"
on public.tasks for delete
using (public.has_company_role(company_id, array['owner', 'admin']::public.company_role[]));

drop policy if exists "task_checklist_items_write_member" on public.task_checklist_items;
drop policy if exists "task_checklist_items_write_admin_or_assignee" on public.task_checklist_items;
create policy "task_checklist_items_write_admin_or_assignee"
on public.task_checklist_items for all
using (
  public.has_company_role(company_id, array['owner', 'admin']::public.company_role[])
  or exists (
    select 1
    from public.tasks task
    where task.id = task_checklist_items.task_id
      and task.company_id = task_checklist_items.company_id
      and task.responsible_employee_id = public.current_employee_id(task_checklist_items.company_id)
  )
)
with check (
  public.has_company_role(company_id, array['owner', 'admin']::public.company_role[])
  or exists (
    select 1
    from public.tasks task
    where task.id = task_checklist_items.task_id
      and task.company_id = task_checklist_items.company_id
      and task.responsible_employee_id = public.current_employee_id(task_checklist_items.company_id)
  )
);
