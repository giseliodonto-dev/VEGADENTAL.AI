
ALTER TABLE public.clinic_members
  ADD COLUMN commission_rate numeric DEFAULT 0,
  ADD COLUMN contract_type text DEFAULT 'pj',
  ADD COLUMN is_active boolean DEFAULT true;
