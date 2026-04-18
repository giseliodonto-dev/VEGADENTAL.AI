-- Remove duplicatas existentes (mantém o registro mais recente por clinic+email)
DELETE FROM public.invites a
USING public.invites b
WHERE a.id < b.id
  AND a.clinic_id = b.clinic_id
  AND a.email = b.email;

-- Garante unicidade para permitir UPSERT atômico
ALTER TABLE public.invites
  ADD CONSTRAINT invites_clinic_email_unique UNIQUE (clinic_id, email);