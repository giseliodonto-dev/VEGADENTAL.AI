
-- Create anamneses table
CREATE TABLE public.anamneses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  diseases text[] DEFAULT '{}',
  surgeries boolean DEFAULT false,
  allergies text,
  medications text,
  smoker boolean DEFAULT false,
  alcohol boolean DEFAULT false,
  bruxism boolean DEFAULT false,
  current_pain boolean DEFAULT false,
  gum_bleeding boolean DEFAULT false,
  sensitivity boolean DEFAULT false,
  response_date timestamptz,
  signature text,
  signed_at timestamptz,
  public_token text UNIQUE DEFAULT gen_random_uuid()::text,
  status text NOT NULL DEFAULT 'nao_enviada',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

-- Members can view
CREATE POLICY "Members can view anamneses" ON public.anamneses
  FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

-- Members can insert
CREATE POLICY "Members can insert anamneses" ON public.anamneses
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

-- Members can update
CREATE POLICY "Members can update anamneses" ON public.anamneses
  FOR UPDATE TO authenticated
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

-- Donos can delete
CREATE POLICY "Donos can delete anamneses" ON public.anamneses
  FOR DELETE TO authenticated
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'::app_role));

-- Anon can view by public_token
CREATE POLICY "Anon can view anamnese by token" ON public.anamneses
  FOR SELECT TO anon
  USING (true);

-- Anon can update by public_token (only fill responses)
CREATE POLICY "Anon can update anamnese by token" ON public.anamneses
  FOR UPDATE TO anon
  USING (public_token IS NOT NULL AND status IN ('nao_enviada', 'enviada'))
  WITH CHECK (status = 'respondida');

-- Add updated_at trigger
CREATE TRIGGER update_anamneses_updated_at
  BEFORE UPDATE ON public.anamneses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
