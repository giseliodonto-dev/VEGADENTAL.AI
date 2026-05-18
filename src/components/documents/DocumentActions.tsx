import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { generateDocumentPdf, downloadDocumentPdf } from "./pdf/generateDocumentPdf";
import { sendDocumentViaMetaAPI } from "@/utils/metaWhatsapp";
import { DOC_TITLES, type DocType } from "./templates/documentTemplates";
import { toast } from "sonner";

interface Props {
  docType: DocType;
  body: string;
  payload: Record<string, unknown>;
  patient: { id: string; name: string; phone?: string | null };
  disabled?: boolean;
}

export function DocumentActions({ docType, body, payload, patient, disabled }: Props) {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const [busy, setBusy] = useState<"save" | "wa" | null>(null);

  const buildPdf = async () => {
    if (!clinicId) throw new Error("Clínica não identificada.");
    const { data: clinic } = await supabase
      .from("clinics")
      .select("name, address, phone, email, logo_url")
      .eq("id", clinicId)
      .maybeSingle();

    const doc = await generateDocumentPdf({
      docType,
      clinicName: clinic?.name ?? "Clínica",
      clinicAddress: clinic?.address,
      clinicPhone: clinic?.phone,
      clinicEmail: clinic?.email,
      clinicLogoUrl: clinic?.logo_url,
      body,
    });

    return doc;
  };

  const handleSave = async () => {
    try {
      setBusy("save");
      if (!clinicId) throw new Error("Clínica não identificada.");
      const doc = await buildPdf();
      const blob = doc.output("blob");
      const filename = `${docType}-${Date.now()}.pdf`;
      const path = `${clinicId}/${patient.id}/${filename}`;

      const { error: upErr } = await supabase.storage
        .from("patient-documents")
        .upload(path, blob, { contentType: "application/pdf", upsert: false });
      if (upErr) console.warn("Storage upload falhou:", upErr.message);

      const { error: dbErr } = await supabase.from("patient_documents").insert({
        clinic_id: clinicId,
        patient_id: patient.id,
        doc_type: docType,
        payload: payload as never,
        rendered_text: body,
        pdf_path: upErr ? null : path,
        created_by: user?.id ?? null,
      });
      if (dbErr) throw dbErr;

      downloadDocumentPdf(doc, docType, patient.name);
      toast.success("Documento salvo no histórico do paciente.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao salvar documento.");
    } finally {
      setBusy(null);
    }
  };

  const handleWhatsApp = async () => {
    try {
      setBusy("wa");
      if (!clinicId) throw new Error("Clínica não identificada.");
      if (!patient.phone) throw new Error("Paciente sem telefone cadastrado.");

      // 1. Gera PDF
      const doc = await buildPdf();
      const blob = doc.output("blob");

      // 2. Upload no bucket público (LGPD-safe: UUID aleatório)
      const filename = `${docType}-${crypto.randomUUID()}.pdf`;
      const path = `${clinicId}/${patient.id}/${filename}`;
      const { error: upErr } = await supabase.storage
        .from("whatsapp-documents")
        .upload(path, blob, { contentType: "application/pdf", upsert: false });
      if (upErr) throw new Error(`Falha no upload: ${upErr.message}`);

      // 3. URL pública
      const { data: pub } = supabase.storage.from("whatsapp-documents").getPublicUrl(path);
      const documentUrl = pub.publicUrl;

      // 4. Registra no histórico
      await supabase.from("patient_documents").insert({
        clinic_id: clinicId,
        patient_id: patient.id,
        doc_type: docType,
        payload: payload as never,
        rendered_text: body,
        pdf_path: path,
        created_by: user?.id ?? null,
      });

      // 5. Dispara Meta API
      const niceName = `${DOC_TITLES[docType]} - ${patient.name}.pdf`;
      await sendDocumentViaMetaAPI({
        phone: patient.phone,
        patientName: patient.name,
        documentUrl,
        filename: niceName,
      });

      toast.success("Documento enviado diretamente para o WhatsApp do paciente!");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao enviar documento pelo WhatsApp.");
    } finally {
      setBusy(null);
    }
  };

  const noPhone = !patient.phone;

  return (
    <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-amber-400/30">
      <Button variant="outline" onClick={handleSave} disabled={disabled || !!busy}>
        {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Documento
      </Button>
      <Button
        variant="gold"
        onClick={handleWhatsApp}
        disabled={disabled || !!busy || noPhone}
        title={noPhone ? "Paciente sem telefone cadastrado" : undefined}
      >
        {busy === "wa" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
        {busy === "wa" ? "Enviando..." : "Enviar no WhatsApp"}
      </Button>
    </div>
  );
}
