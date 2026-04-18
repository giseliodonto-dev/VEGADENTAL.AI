ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS responsible_name text,
  ADD COLUMN IF NOT EXISTS responsible_cro text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cancellation_fee numeric DEFAULT 100;

INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-logos', 'clinic-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view clinic logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-logos');

CREATE POLICY "Authenticated can upload clinic logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clinic-logos');

CREATE POLICY "Authenticated can update clinic logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'clinic-logos');

CREATE POLICY "Authenticated can delete clinic logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clinic-logos');