
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-documents', 'whatsapp-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read (Meta precisa baixar o PDF pela URL)
CREATE POLICY "whatsapp_docs_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-documents');

-- Insert: usuário autenticado, primeiro segmento do path deve ser uma clínica da qual ele é membro
CREATE POLICY "whatsapp_docs_clinic_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-documents'
  AND public.is_clinic_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "whatsapp_docs_clinic_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'whatsapp-documents'
  AND public.is_clinic_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "whatsapp_docs_clinic_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'whatsapp-documents'
  AND public.is_clinic_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
