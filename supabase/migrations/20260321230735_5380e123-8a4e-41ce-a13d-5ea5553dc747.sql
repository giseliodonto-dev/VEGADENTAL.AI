ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS procedure_type text,
  ADD COLUMN IF NOT EXISTS estimated_value numeric DEFAULT 0;
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'agendado';