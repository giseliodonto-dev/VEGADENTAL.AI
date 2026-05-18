import { supabase } from "@/integrations/supabase/client";

export interface SendDocumentParams {
  phone: string;
  patientName: string;
  documentUrl: string;
  filename?: string;
}

/**
 * Envia um documento PDF via Meta Cloud API (WhatsApp Business)
 * em segundo plano através da Edge Function `send-whatsapp-document`.
 */
export async function sendDocumentViaMetaAPI(params: SendDocumentParams): Promise<void> {
  const { data, error } = await supabase.functions.invoke("send-whatsapp-document", {
    body: params,
  });

  if (error) {
    // Tenta extrair mensagem detalhada do body de erro retornado
    const detail = (data as { error?: string } | null)?.error;
    throw new Error(detail || error.message || "Falha ao enviar documento via WhatsApp.");
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String((data as { error: string }).error));
  }
}
