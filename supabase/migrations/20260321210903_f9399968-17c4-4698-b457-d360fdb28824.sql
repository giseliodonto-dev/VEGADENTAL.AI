-- Allow clinic members to see profiles of fellow members (needed for Users page)
DROP POLICY IF EXISTS "Clinic members can view fellow profiles" ON public.profiles;

CREATE POLICY "Clinic members can view fellow profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT cm2.user_id
    FROM public.clinic_members cm1
    JOIN public.clinic_members cm2 ON cm2.clinic_id = cm1.clinic_id
    WHERE cm1.user_id = auth.uid()
  )
  OR id = auth.uid()
);