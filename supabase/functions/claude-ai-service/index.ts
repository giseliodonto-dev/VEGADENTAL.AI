const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-3-5-sonnet-latest";

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
      ["user", "assistant"].includes((m as any).role) &&
      typeof (m as any).content === "string" &&
      (m as any).content.trim().length > 0,
  );
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY ausente");
      return json({ error: "Configuração do servidor incompleta." }, 500);
    }

    const body = await req.json().catch(() => null);
    const messages = body?.messages;

    if (!isValidMessages(messages)) {
      return json(
        {
          error:
            "Formato inválido. Envie { messages: [{ role, content }, ...] }.",
        },
        400,
      );
    }

    const anthropicResp = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      console.error(
        "Anthropic error:",
        anthropicResp.status,
        errText,
      );

      if (anthropicResp.status === 401 || anthropicResp.status === 403) {
        return json({ error: "Falha de autenticação com Claude." }, 502);
      }
      if (anthropicResp.status === 429) {
        return json(
          { error: "Limite de requisições atingido. Tente novamente em instantes." },
          429,
        );
      }
      return json({ error: "Erro ao consultar a IA.", detail: errText }, 502);
    }

    const data = await anthropicResp.json();
    const reply = (data?.content ?? [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    return json({ reply });
  } catch (err: any) {
    console.error("claude-ai-service error:", err?.message, err);
    return json({ error: err?.message ?? "Erro interno ao consultar a IA." }, 500);
  }
});
