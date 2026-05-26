import { supabase } from "@/integrations/supabase/client";

export interface SendDocumentParams {
  phone: string;
  patientName: string;
  documentUrl: string;
  filename?: string;
}

/**
 * Envia um documento PDF via Twilio WhatsApp API através da
 * Edge Function `send-whatsapp-twilio`.
 */
export async function sendDocumentViaTwilio(params: SendDocumentParams): Promise<void> {
  const { data, error } = await supabase.functions.invoke("send-whatsapp-twilio", {
    body: params,
  });

  if (error) {
    const detail = (data as { error?: string } | null)?.error;
    throw new Error(detail || error.message || "Falha ao enviar documento via WhatsApp.");
  }

  if (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) {
    throw new Error(String((data as { error: string }).error));
  }
}
