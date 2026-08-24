CREATE OR REPLACE FUNCTION public.get_public_budget_parties(_token uuid)
RETURNS TABLE (
  clinic_name text,
  clinic_phone text,
  clinic_email text,
  clinic_address text,
  clinic_responsible_name text,
  clinic_responsible_cro text,
  clinic_logo_url text,
  patient_name text,
  patient_cpf text,
  patient_rg text,
  patient_phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.name, c.phone, c.email, c.address, c.responsible_name, c.responsible_cro, c.logo_url,
         p.name, p.cpf, p.rg, p.phone
  FROM public.budgets b
  JOIN public.clinics c ON c.id = b.clinic_id
  JOIN public.patients p ON p.id = b.patient_id
  WHERE b.public_token = _token::text
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_budget_parties(uuid) TO anon, authenticated;