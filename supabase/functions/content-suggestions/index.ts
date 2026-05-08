// Sugestões de conteúdo por tema (IA)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `Você é um estrategista de conteúdo para clínicas odontológicas brasileiras de médio e alto padrão. Tom Quiet Luxury: elegante, direto, sem clichês ou emojis em excesso. Português do Brasil. Gere ideias práticas, baseadas em evidências odontológicas amplamente reconhecidas. Quando sugerir fontes/artigos/pesquisas, prefira instituições reconhecidas (CFO, ABO, SBPqO, PubMed, periódicos como Journal of Dentistry, JADA, Brazilian Dental Journal, sites .gov.br, .org, universidades). NUNCA invente URLs específicas: forneça o nome da fonte e uma "search_query" que o usuário possa colar no Google/PubMed para encontrar o material.`;

const tool = {
  type: "function",
  function: {
    name: "gerar_sugestoes_conteudo",
    description: "Gera ideias de posts, artigos de referência e linhas de pesquisa para um tema odontológico.",
    parameters: {
      type: "object",
      properties: {
        tema: { type: "string", description: "Tema escolhido pelo usuário, normalizado." },
        resumo: { type: "string", description: "Resumo de 1-2 frases do que abordar nesse tema com pacientes." },
        posts: {
          type: "array",
          description: "3 a 5 ideias de posts para Instagram.",
          items: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              formato: { type: "string", enum: ["reels", "story", "post", "carrossel", "video"] },
              ideia_imagem: { type: "string", description: "Descrição visual do post." },
              legenda: { type: "string", description: "Legenda completa pronta para postar." },
              hashtags: { type: "array", items: { type: "string" } },
              cta: { type: "string", description: "Chamada para ação." },
            },
            required: ["titulo", "formato", "ideia_imagem", "legenda", "hashtags", "cta"],
            additionalProperties: false,
          },
        },
        artigos: {
          type: "array",
          description: "3 a 5 artigos/materiais de referência reais (ou tipos de material) sobre o tema.",
          items: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              fonte: { type: "string", description: "Ex: PubMed, CFO, ABO, JADA." },
              search_query: { type: "string", description: "Query para o usuário pesquisar e encontrar a fonte." },
              resumo: { type: "string" },
            },
            required: ["titulo", "fonte", "search_query", "resumo"],
            additionalProperties: false,
          },
        },
        pesquisas: {
          type: "array",
          description: "2 a 3 linhas de pesquisa científica relevantes sobre o tema.",
          items: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              descricao: { type: "string" },
              search_query: { type: "string" },
            },
            required: ["titulo", "descricao", "search_query"],
            additionalProperties: false,
          },
        },
      },
      required: ["tema", "resumo", "posts", "artigos", "pesquisas"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tema } = await req.json();
    if (!tema || typeof tema !== "string" || tema.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Informe um tema válido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Tema: ${tema.trim()}\n\nGere sugestões de conteúdo (posts, artigos de referência e linhas de pesquisa) para uma clínica odontológica brasileira. Use a função gerar_sugestoes_conteudo para responder.`,
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "gerar_sugestoes_conteudo" } },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Gateway error", resp.status, txt);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações > Workspace > Uso." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = typeof args === "string" ? JSON.parse(args) : args;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-suggestions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
