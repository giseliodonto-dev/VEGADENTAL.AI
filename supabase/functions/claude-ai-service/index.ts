import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT =
  "Você é a inteligência central do Vega Dental, uma assistente de gestão odontológica de luxo, técnica, empática e eficiente.";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function isValidMessages(input: unknown): input is ChatMessage[] {
  if (!Array.isArray(input) || input.length === 0) return false;
  return input.every(
    (m) =>
      m &&
      typeof m === "object" &&
      (m as any).role &&
      ["user", "assistant"].includes((m as any).role) &&
      typeof (m as any).content === "string" &&
      (m as any).content.trim().length > 0,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY ausente");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => null);
    const messages = body?.messages;

    if (!isValidMessages(messages)) {
      return new Response(
        JSON.stringify({
          error:
            "Formato inválido. Envie { messages: [{ role, content }, ...] }.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("claude-ai-service error:", err?.status, err?.message, err);

    const status = err?.status ?? err?.response?.status;

    if (status === 401 || status === 403) {
      return new Response(
        JSON.stringify({ error: "Falha de autenticação com Claude." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (status === 429) {
      return new Response(
        JSON.stringify({
          error: "Limite de requisições atingido. Tente novamente em instantes.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        error: err?.message ?? "Erro interno ao consultar a IA.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
