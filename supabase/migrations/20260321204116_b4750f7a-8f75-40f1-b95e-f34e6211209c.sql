-- Tighten INSERT policy: only allow if user has no clinic yet
DROP POLICY IF EXISTS "Authenticated users can create clinics" ON public.clinics;

CREATE POLICY "Authenticated users can create clinics"
ON public.clinics FOR INSERT TO authenticated
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.clinic_members WHERE user_id = auth.uid())
);