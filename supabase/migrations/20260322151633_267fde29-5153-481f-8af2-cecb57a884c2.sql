ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_origin_check;
ALTER TABLE public.patients ADD CONSTRAINT patients_origin_check
  CHECK (origin IS NULL OR origin = ANY (ARRAY['instagram','indicacao','google','facebook','whatsapp','site','outros']));