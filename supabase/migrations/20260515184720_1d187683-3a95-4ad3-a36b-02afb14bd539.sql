CREATE TABLE public.patient_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  dentist_user_id uuid,
  content text NOT NULL,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view patient_history"
  ON public.patient_history FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can insert patient_history"
  ON public.patient_history FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can update patient_history"
  ON public.patient_history FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can delete patient_history"
  ON public.patient_history FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'::app_role));

CREATE INDEX idx_patient_history_lookup
  ON public.patient_history (clinic_id, patient_id, created_at DESC);

CREATE TRIGGER update_patient_history_updated_at
  BEFORE UPDATE ON public.patient_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();