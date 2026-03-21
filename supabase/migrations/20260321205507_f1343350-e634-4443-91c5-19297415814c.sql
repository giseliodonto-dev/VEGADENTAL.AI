-- Corrige onboarding multi-tenant: permite apenas o primeiro vínculo do próprio usuário como dono
-- e restaura isolamento de leitura de clínicas por membership.

-- 1) Restaurar política segura de leitura de clínicas (somente clínicas do usuário)
DROP POLICY IF EXISTS "Authenticated can view clinics" ON public.clinics;
DROP POLICY IF EXISTS "Members can view their clinics" ON public.clinics;

CREATE POLICY "Members can view their clinics"
ON public.clinics
FOR SELECT
TO authenticated
USING (
  id IN (SELECT public.get_user_clinic_ids(auth.uid()))
);

-- 2) Permitir vínculo inicial no clinic_members durante onboarding
DROP POLICY IF EXISTS "Users can create own owner membership on first clinic" ON public.clinic_members;

CREATE POLICY "Users can create own owner membership on first clinic"
ON public.clinic_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'dono'::public.app_role
  AND NOT EXISTS (
    SELECT 1
    FROM public.clinic_members my_membership
    WHERE my_membership.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.clinics c
    WHERE c.id = public.clinic_members.clinic_id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.clinic_members cm
    WHERE cm.clinic_id = public.clinic_members.clinic_id
  )
);