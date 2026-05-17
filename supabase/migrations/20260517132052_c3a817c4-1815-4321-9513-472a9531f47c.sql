CREATE TABLE public.patient_odontogram (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  tooth_number text NOT NULL,
  face text NOT NULL,
  status_type text NOT NULL,
  condition text NOT NULL,
  treatment_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, tooth_number, face, status_type)
);

ALTER TABLE public.patient_odontogram ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view odontogram"
  ON public.patient_odontogram FOR SELECT
  USING (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members insert odontogram"
  ON public.patient_odontogram FOR INSERT
  WITH CHECK (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members update odontogram"
  ON public.patient_odontogram FOR UPDATE
  USING (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos delete odontogram"
  ON public.patient_odontogram FOR DELETE
  USING (public.has_clinic_role(auth.uid(), clinic_id, 'dono'::app_role));

CREATE INDEX idx_patient_odontogram_patient ON public.patient_odontogram(patient_id, status_type);

CREATE TRIGGER trg_patient_odontogram_updated
  BEFORE UPDATE ON public.patient_odontogram
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();