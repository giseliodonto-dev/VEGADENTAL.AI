// Edge Function: send-whatsapp-twilio
// Envia um documento PDF via Twilio WhatsApp API usando MediaUrl.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

interface RequestBody {
  phone: string;
  patientName: string;
  documentUrl: string;
  filename?: string;
}

function normalizePhoneE164(raw: string): string {
  const digits = (raw || "").replace(/\D+/g, "");
  if (!digits) return "";
  const withCountry = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  return `+${withCountry}`;
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
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
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
    const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const FROM_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
      return new Response(
        JSON.stringify({
          error:
            "Configuração Twilio incompleta. Verifique os secrets TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_NUMBER.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const toE164 = normalizePhoneE164(body.phone);
    if (toE164.length < 13) {
      return new Response(JSON.stringify({ error: "Telefone inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromClean = FROM_NUMBER.startsWith("whatsapp:") ? FROM_NUMBER : `whatsapp:${FROM_NUMBER}`;
    const to = `whatsapp:${toE164}`;

    const messageBody = `Olá ${body.patientName}, segue seu documento da clínica em anexo. 📎`;

    const form = new URLSearchParams({
      To: to,
      From: fromClean,
      Body: messageBody,
      MediaUrl: body.documentUrl,
    });

    const basic = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );

    const twilioJson = await twilioRes.json().catch(() => ({}));

    if (!twilioRes.ok) {
      const code = twilioJson?.code;
      const msg = twilioJson?.message || "Falha na API do Twilio";
      const moreInfo = twilioJson?.more_info;
      console.error("Twilio error", { status: twilioRes.status, code, msg, moreInfo });
      return new Response(
        JSON.stringify({
          error: `Twilio (${code ?? twilioRes.status}): ${msg}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, sid: twilioJson?.sid, status: twilioJson?.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-whatsapp-twilio fatal", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
