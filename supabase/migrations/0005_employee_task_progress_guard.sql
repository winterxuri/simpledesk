create or replace function public.enforce_employee_task_progress_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  employee_id uuid;
begin
  if public.has_company_role(old.company_id, array['owner', 'admin']::public.company_role[]) then
    return new;
  end if;

  employee_id := public.current_employee_id(old.company_id);

  if employee_id is null or old.responsible_employee_id is distinct from employee_id then
    raise exception 'Only the assigned employee can update task progress';
  end if;

  if new.company_id is distinct from old.company_id
    or new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.responsible_employee_id is distinct from old.responsible_employee_id
    or new.due_date is distinct from old.due_date
    or new.priority is distinct from old.priority
    or new.client_id is distinct from old.client_id
    or new.appointment_id is distinct from old.appointment_id
    or new.product_id is distinct from old.product_id
  then
    raise exception 'Employees can update only task progress';
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'new' and new.status = 'in_progress')
    or (old.status = 'in_progress' and new.status in ('waiting', 'done'))
    or (old.status = 'waiting' and new.status = 'in_progress')
    or (old.status = 'overdue' and new.status in ('in_progress', 'done'))
  ) then
    raise exception 'This task status transition is not allowed for employees';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_employee_task_progress_update on public.tasks;
create trigger enforce_employee_task_progress_update
before update on public.tasks
for each row execute function public.enforce_employee_task_progress_update();
