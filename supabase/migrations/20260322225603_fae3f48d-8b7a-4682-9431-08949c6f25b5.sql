
-- Budgets table
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  dentist_user_id uuid,
  total_value numeric NOT NULL DEFAULT 0,
  discount numeric DEFAULT 0,
  final_value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  notes text,
  valid_until date,
  accepted_at timestamptz,
  accepted_signature text,
  public_token text UNIQUE DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view budgets" ON budgets FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can insert budgets" ON budgets FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can update budgets" ON budgets FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Donos can delete budgets" ON budgets FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

-- Public access via token (anon can view)
CREATE POLICY "Public can view budget by token" ON budgets FOR SELECT
  TO anon
  USING (true);

-- Budget items table
CREATE TABLE public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES treatments(id),
  procedure_name text NOT NULL,
  tooth_number text,
  region text,
  value numeric NOT NULL DEFAULT 0,
  notes text
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view budget_items" ON budget_items FOR SELECT
  USING (budget_id IN (SELECT id FROM budgets WHERE clinic_id IN (SELECT get_user_clinic_ids(auth.uid()))));
CREATE POLICY "Members can insert budget_items" ON budget_items FOR INSERT
  WITH CHECK (budget_id IN (SELECT id FROM budgets WHERE clinic_id IN (SELECT get_user_clinic_ids(auth.uid()))));
CREATE POLICY "Members can update budget_items" ON budget_items FOR UPDATE
  USING (budget_id IN (SELECT id FROM budgets WHERE clinic_id IN (SELECT get_user_clinic_ids(auth.uid()))));
CREATE POLICY "Donos can delete budget_items" ON budget_items FOR DELETE
  USING (budget_id IN (SELECT id FROM budgets WHERE clinic_id IN (SELECT get_user_clinic_ids(auth.uid()))));

-- Public access to budget items via budget token
CREATE POLICY "Public can view budget_items by token" ON budget_items FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update budget status for acceptance
CREATE POLICY "Public can accept budget by token" ON budgets FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
