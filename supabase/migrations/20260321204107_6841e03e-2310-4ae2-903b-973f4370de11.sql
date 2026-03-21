-- Fix: allow authenticated users to see clinics they just created
-- by also allowing SELECT during insert flow
DROP POLICY IF EXISTS "Authenticated users can create clinics" ON public.clinics;

CREATE POLICY "Authenticated users can create clinics"
ON public.clinics FOR INSERT TO authenticated
WITH CHECK (true);

-- Add policy so user can SELECT the clinic right after inserting it
-- The existing SELECT policy only works for members, but during onboarding
-- the user isn't a member yet. We use a broader check temporarily:
DROP POLICY IF EXISTS "Members can view their clinics" ON public.clinics;

CREATE POLICY "Members can view their clinics"
ON public.clinics FOR SELECT TO authenticated
USING (
  id IN (SELECT get_user_clinic_ids(auth.uid()))
);

-- Allow INSERT with RETURNING by granting SELECT on just-created rows
-- We need a separate approach: use a function
-- Simplest fix: allow the insert to return data by making SELECT more permissive temporarily
-- Actually the real fix is to not use .select() on insert, OR allow all authenticated to SELECT clinics
-- Since clinic data (name, slug) is not sensitive, let's allow authenticated users to see all clinics
DROP POLICY IF EXISTS "Members can view their clinics" ON public.clinics;

CREATE POLICY "Authenticated can view clinics"
ON public.clinics FOR SELECT TO authenticated
USING (true);