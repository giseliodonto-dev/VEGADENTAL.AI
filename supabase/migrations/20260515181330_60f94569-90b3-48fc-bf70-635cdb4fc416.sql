
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  dentist_user_id uuid,
  medications jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescriptions_clinic_patient ON public.prescriptions (clinic_id, patient_id, created_at DESC);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view prescriptions"
  ON public.prescriptions FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can insert prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can update prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can delete prescriptions"
  ON public.prescriptions FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'::app_role));
