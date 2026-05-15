ALTER TABLE public.patient_history ADD COLUMN IF NOT EXISTS treatment_id uuid;
ALTER TABLE public.patient_history ADD COLUMN IF NOT EXISTS executed_value numeric NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_patient_history_patient_created ON public.patient_history (patient_id, created_at DESC);