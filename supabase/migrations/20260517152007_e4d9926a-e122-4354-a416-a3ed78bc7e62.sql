
-- Tabela de documentos clínicos do paciente
CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('comparecimento','atestado','relatorio_ortodontico','encaminhamento')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  rendered_text text,
  pdf_path text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_documents_patient ON public.patient_documents (patient_id, created_at DESC);
CREATE INDEX idx_patient_documents_clinic ON public.patient_documents (clinic_id, created_at DESC);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view patient_documents"
  ON public.patient_documents FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can insert patient_documents"
  ON public.patient_documents FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can update patient_documents"
  ON public.patient_documents FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can delete patient_documents"
  ON public.patient_documents FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'::app_role));

-- Bucket privado para os PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS no storage.objects para o bucket
CREATE POLICY "Members view patient-documents files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'patient-documents'
    AND ((storage.foldername(name))[1])::uuid IN (SELECT get_user_clinic_ids(auth.uid()))
  );

CREATE POLICY "Members upload patient-documents files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND ((storage.foldername(name))[1])::uuid IN (SELECT get_user_clinic_ids(auth.uid()))
  );

CREATE POLICY "Donos delete patient-documents files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'patient-documents'
    AND has_clinic_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'dono'::app_role)
  );
