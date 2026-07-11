update public.company_modules
set
  available_on_tariff = true,
  status = case when status = 'unavailable' then 'hidden' else status end,
  visible = case when status = 'unavailable' then false else visible end,
  updated_at = now()
where code = 'integrations';
