
-- 1) Tabela
CREATE TABLE public.patient_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX patient_exams_patient_idx ON public.patient_exams (patient_id, created_at DESC);
CREATE INDEX patient_exams_clinic_idx ON public.patient_exams (clinic_id);

-- 2) Grants
GRANT SELECT, INSERT, DELETE ON public.patient_exams TO authenticated;
GRANT ALL ON public.patient_exams TO service_role;

-- 3) RLS
ALTER TABLE public.patient_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view clinic exams"
  ON public.patient_exams FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can insert clinic exams"
  ON public.patient_exams FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can delete clinic exams"
  ON public.patient_exams FOR DELETE
  TO authenticated
  USING (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

-- 4) Storage policies on bucket patient-exams
-- Path convention: <clinic_id>/<patient_id>/<filename>
CREATE POLICY "Members can read patient-exams files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-exams'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_clinic_ids(auth.uid()))
    )
  );

CREATE POLICY "Members can upload patient-exams files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'patient-exams'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_clinic_ids(auth.uid()))
    )
  );

CREATE POLICY "Members can delete patient-exams files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'patient-exams'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_clinic_ids(auth.uid()))
    )
  );
