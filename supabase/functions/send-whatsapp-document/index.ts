// Edge Function: send-whatsapp-document
// Envia um documento PDF via Meta Cloud API (WhatsApp Business)
// usando template aprovado com header do tipo "document".

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

interface RequestBody {
  phone: string;
  patientName: string;
  documentUrl: string;
  filename?: string;
}

function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D+/g, "");
  if (!digits) return "";
  // Se começa com 55 e tem 12-13 dígitos, mantém. Caso contrário, prefixa 55.
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ---- Auth ----
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Body ----
    const body = (await req.json()) as RequestBody;
    if (!body?.phone || !body?.patientName || !body?.documentUrl) {
      return new Response(
        JSON.stringify({ error: "phone, patientName e documentUrl são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Secrets ----
    const TOKEN = Deno.env.get("META_SYSTEM_USER_TOKEN");
    const PHONE_NUMBER_ID = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID");
    const TEMPLATE_NAME = Deno.env.get("META_WHATSAPP_TEMPLATE_NAME");
    const TEMPLATE_LANG = Deno.env.get("META_WHATSAPP_TEMPLATE_LANG") ?? "pt_BR";

    if (!TOKEN || !PHONE_NUMBER_ID || !TEMPLATE_NAME) {
      return new Response(
        JSON.stringify({
          error:
            "Configuração Meta WhatsApp incompleta. Verifique os secrets META_SYSTEM_USER_TOKEN, META_WHATSAPP_PHONE_NUMBER_ID e META_WHATSAPP_TEMPLATE_NAME.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const to = normalizePhone(body.phone);
    if (to.length < 12) {
      return new Response(JSON.stringify({ error: "Telefone inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filename = body.filename || "documento.pdf";

    // ---- Meta payload (template + document header + body var {{1}}) ----
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: { code: TEMPLATE_LANG },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: { link: body.documentUrl, filename },
              },
            ],
          },
          {
            type: "body",
            parameters: [{ type: "text", text: body.patientName }],
          },
        ],
      },
    };

    const metaRes = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const metaJson = await metaRes.json().catch(() => ({}));

    if (!metaRes.ok) {
      const code = metaJson?.error?.code;
      const msg = metaJson?.error?.message || "Falha na API da Meta";
      const detail = metaJson?.error?.error_data?.details;
      console.error("Meta error", { code, msg, detail, payload });
      return new Response(
        JSON.stringify({
          error: `Meta API (${code ?? metaRes.status}): ${msg}${detail ? ` — ${detail}` : ""}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, meta: metaJson }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-whatsapp-document fatal", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
