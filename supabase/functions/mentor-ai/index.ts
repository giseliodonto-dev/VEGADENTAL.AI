// Mentor de IA - personalização de scripts e busca semântica
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `Você é o Mentor de IA do VEGA Dental AI. Seu tom é Quiet Luxury: elegante, direto, sem emojis exagerados, sem jargão de venda agressivo. Você escreve para dentistas brasileiros que atendem público de médio e alto padrão. Frases curtas. Português do Brasil. Nunca use exclamação em excesso. Nunca prometa resultados. Mantenha a essência consultiva.`;

async function callGateway(body: Record<string, unknown>) {
  const resp = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return resp;
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) return errorResponse(500, "LOVABLE_API_KEY não configurado");
    const { action, payload } = await req.json();

    if (action === "personalize") {
      const { script, patientName, procedure, value, clinicName } = payload ?? {};
      if (!script || typeof script !== "string") {
        return errorResponse(400, "script é obrigatório");
      }

      const userPrompt = `Personalize o script abaixo substituindo os placeholders ({{nome}}, {{procedimento}}, {{valor}}, {{clinica}}, {{data}}) com os dados fornecidos. Ajuste levemente a fluência se necessário, mas preserve a estrutura, o tom e a intenção. Não adicione comentários, explicações ou aspas — devolva apenas o texto final pronto para enviar.

Dados:
- Nome do paciente: ${patientName || "(não informado — remova o placeholder com elegância)"}
- Procedimento: ${procedure || "(não informado — adapte de forma genérica)"}
- Valor: ${value || "(não informado — remova o placeholder com elegância)"}
- Clínica: ${clinicName || "nossa clínica"}

Script original:
${script}`;

      const resp = await callGateway({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      });

      if (resp.status === 429) return errorResponse(429, "Limite de requisições. Tente novamente em instantes.");
      if (resp.status === 402) return errorResponse(402, "Créditos esgotados. Adicione créditos no workspace.");
      if (!resp.ok) {
        const t = await resp.text();
        console.error("gateway error", resp.status, t);
        return errorResponse(500, "Erro ao chamar IA");
      }

      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "search") {
      const { situation, scripts } = payload ?? {};
      if (!situation || !Array.isArray(scripts)) {
        return errorResponse(400, "situation e scripts são obrigatórios");
      }

      const catalog = scripts
        .map((s: any) => `- ${s.id} | ${s.subcategory} | ${s.title} | tags: ${(s.tags || []).join(", ")}`)
        .join("\n");

      const resp = await callGateway({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Situação descrita pelo dentista: "${situation}"

Catálogo de scripts disponíveis:
${catalog}

Retorne os IDs dos scripts mais relevantes para resolver essa situação, em ordem de relevância. Máximo 6.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_relevant_scripts",
              description: "Retorna IDs dos scripts mais relevantes",
              parameters: {
                type: "object",
                properties: {
                  ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "IDs dos scripts em ordem de relevância",
                  },
                },
                required: ["ids"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_relevant_scripts" } },
      });

      if (resp.status === 429) return errorResponse(429, "Limite de requisições. Tente novamente em instantes.");
      if (resp.status === 402) return errorResponse(402, "Créditos esgotados.");
      if (!resp.ok) {
        const t = await resp.text();
        console.error("gateway error", resp.status, t);
        return errorResponse(500, "Erro ao chamar IA");
      }

      const data = await resp.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      let ids: string[] = [];
      if (toolCall?.function?.arguments) {
        try {
          ids = JSON.parse(toolCall.function.arguments).ids ?? [];
        } catch (e) {
          console.error("parse tool args", e);
        }
      }
      return new Response(JSON.stringify({ ids }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return errorResponse(400, "action inválida");
  } catch (e) {
    console.error("mentor-ai error", e);
    return errorResponse(500, e instanceof Error ? e.message : "Erro desconhecido");
  }
});
