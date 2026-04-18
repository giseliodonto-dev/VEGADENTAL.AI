-- Add new optional columns to patients
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS number text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text;

-- Create odontograms table
CREATE TABLE IF NOT EXISTS public.odontograms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL UNIQUE,
  teeth_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.odontograms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view odontograms"
  ON public.odontograms FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can insert odontograms"
  ON public.odontograms FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can update odontograms"
  ON public.odontograms FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can delete odontograms"
  ON public.odontograms FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'::app_role));

CREATE TRIGGER update_odontograms_updated_at
  BEFORE UPDATE ON public.odontograms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();