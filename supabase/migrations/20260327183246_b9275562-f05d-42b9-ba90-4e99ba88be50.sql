
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'dentista',
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(token),
  UNIQUE(clinic_id, email)
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Members can view invites for their clinic
CREATE POLICY "clinic_members_view_invites" ON public.invites
  FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

-- Members can create invites for their clinic
CREATE POLICY "clinic_members_create_invites" ON public.invites
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

-- Members can update invites for their clinic
CREATE POLICY "clinic_members_update_invites" ON public.invites
  FOR UPDATE TO authenticated
  USING (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

-- Public can read invite by token (for signup page)
CREATE POLICY "public_read_invite_by_token" ON public.invites
  FOR SELECT TO anon
  USING (status = 'pending');
