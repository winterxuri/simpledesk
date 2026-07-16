-- Atomic, idempotent provisioning of a company + owner membership + owner employee + modules.
-- Replaces the previous client-side sequence of 4 separate inserts (companies -> company_members
-- -> employees -> company_modules), which could leave orphaned/partial data if any step failed
-- or the client lost connection mid-flow.
--
-- Idempotency: if the currently authenticated user already belongs to a company, the function
-- simply returns that existing company instead of raising an error. This lets the same function
-- be safely called both right after signUp() (when email confirmation is disabled) and later from
-- the auth callback route (after the user confirms their email and a session is established).

create or replace function public.create_company_owner(
  p_company_name text,
  p_owner_name text,
  p_owner_email text,
  p_business_template_id text,
  p_industry text,
  p_timezone text,
  p_terminology jsonb,
  p_modules jsonb
)
returns table (
  company_id uuid,
  owner_employee_id uuid,
  already_existed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_company_id uuid;
  v_employee_id uuid;
  v_module jsonb;
  v_existing_company_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Требуется вход в аккаунт.';
  end if;

  select cm.company_id
  into v_existing_company_id
  from public.company_members cm
  where cm.user_id = v_user_id
  limit 1;

  if v_existing_company_id is not null then
    select e.id
    into v_employee_id
    from public.employees e
    where e.company_id = v_existing_company_id
      and e.user_id = v_user_id
    limit 1;

    return query select v_existing_company_id, v_employee_id, true;
    return;
  end if;

  v_company_id := gen_random_uuid();
  v_employee_id := gen_random_uuid();

  insert into public.companies (
    id, name, business_template_id, industry, email, timezone, terminology
  )
  values (
    v_company_id, p_company_name, p_business_template_id, p_industry, p_owner_email,
    p_timezone, coalesce(p_terminology, '{}'::jsonb)
  );

  insert into public.company_members (company_id, user_id, role, display_name)
  values (v_company_id, v_user_id, 'owner', p_owner_name);

  insert into public.employees (
    id, company_id, user_id, name, email, position, status, schedule, role,
    rating, compensation_type, base_salary, commission_percent
  )
  values (
    v_employee_id, v_company_id, v_user_id, p_owner_name, p_owner_email, 'Владелец',
    'working', '09:00-18:00', 'owner', 5, 'mixed', 0, 0
  );

  for v_module in select * from jsonb_array_elements(coalesce(p_modules, '[]'::jsonb))
  loop
    insert into public.company_modules (
      company_id, code, status, visible, sort_order, available_on_tariff
    )
    values (
      v_company_id,
      v_module ->> 'code',
      (v_module ->> 'status')::public.module_status,
      (v_module ->> 'visible')::boolean,
      (v_module ->> 'sort_order')::integer,
      (v_module ->> 'available_on_tariff')::boolean
    );
  end loop;

  return query select v_company_id, v_employee_id, false;
end;
$$;

grant execute on function public.create_company_owner(
  text, text, text, text, text, text, jsonb, jsonb
) to authenticated;
