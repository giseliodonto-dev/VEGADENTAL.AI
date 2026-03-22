
-- Create payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  treatment_id uuid NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'pix',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view payments" ON payments FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can insert payments" ON payments FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Donos can delete payments" ON payments FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

-- Add payment columns to treatments
ALTER TABLE public.treatments
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'avista',
  ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1;
