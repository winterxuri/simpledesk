create or replace function public.enforce_employee_access_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  accepting_invite boolean;
begin
  if tg_op = 'DELETE' then
    if old.role = 'owner' then
      raise exception 'Owner employee cannot be deleted';
    end if;

    return old;
  end if;

  if old.role = 'owner' and (
    new.role <> 'owner'
    or new.status = 'dismissed'
    or new.dismissed_at is not null
  ) then
    raise exception 'Owner employee cannot be dismissed or demoted';
  end if;

  if old.role <> 'owner' and new.role = 'owner' then
    raise exception 'Owner role transfer requires a dedicated flow';
  end if;

  accepting_invite :=
    old.user_id is null
    and new.user_id = auth.uid()
    and exists (
      select 1
      from public.employee_invites invite
      where invite.company_id = new.company_id
        and invite.employee_id = new.id
        and lower(invite.email) = lower(coalesce(new.email, ''))
        and invite.role = new.role
        and invite.status = 'pending'
        and invite.expires_at >= now()
    );

  if new.role is distinct from old.role
    and not public.has_company_role(old.company_id, array['owner']::public.company_role[])
    and not accepting_invite
  then
    raise exception 'Only owner can change employee system role';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_employee_access_guard on public.employees;
create trigger enforce_employee_access_guard
before update or delete on public.employees
for each row execute function public.enforce_employee_access_guard();

create or replace function public.sync_employee_member_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null and new.role is distinct from old.role then
    update public.company_members
    set
      role = new.role,
      updated_at = now()
    where company_id = new.company_id
      and user_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_employee_member_role on public.employees;
create trigger sync_employee_member_role
after update on public.employees
for each row execute function public.sync_employee_member_role();

drop policy if exists "employee_invites_write_admin" on public.employee_invites;
drop policy if exists "employee_invites_insert_owner_or_employee_admin" on public.employee_invites;
drop policy if exists "employee_invites_update_owner_or_employee_admin" on public.employee_invites;
drop policy if exists "employee_invites_delete_owner_or_employee_admin" on public.employee_invites;

create policy "employee_invites_insert_owner_or_employee_admin"
on public.employee_invites for insert
with check (
  public.has_company_role(company_id, array['owner']::public.company_role[])
  or (
    role = 'employee'
    and public.has_company_role(company_id, array['admin']::public.company_role[])
  )
);

create policy "employee_invites_update_owner_or_employee_admin"
on public.employee_invites for update
using (
  public.has_company_role(company_id, array['owner']::public.company_role[])
  or (
    role = 'employee'
    and public.has_company_role(company_id, array['admin']::public.company_role[])
  )
)
with check (
  public.has_company_role(company_id, array['owner']::public.company_role[])
  or (
    role = 'employee'
    and public.has_company_role(company_id, array['admin']::public.company_role[])
  )
);

create policy "employee_invites_delete_owner_or_employee_admin"
on public.employee_invites for delete
using (
  public.has_company_role(company_id, array['owner']::public.company_role[])
  or (
    role = 'employee'
    and public.has_company_role(company_id, array['admin']::public.company_role[])
  )
);
