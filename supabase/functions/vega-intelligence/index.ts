import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clinic_id } = await req.json();
    if (!clinic_id) {
      return new Response(JSON.stringify({ error: "clinic_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const today = now.toISOString().split("T")[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();

    // Aggregate data in parallel
    const [
      { data: revenue },
      { data: goals },
      { data: funnel },
      { data: leads },
      { data: appts },
    ] = await Promise.all([
      supabase
        .from("financials")
        .select("value")
        .eq("clinic_id", clinic_id)
        .eq("type", "entrada")
        .gte("date", monthStart),
      supabase
        .from("goals")
        .select("revenue_goal, conversion_goal, profit_goal")
        .eq("clinic_id", clinic_id)
        .eq("month", monthStart)
        .maybeSingle(),
      supabase
        .from("sales_funnel")
        .select("stage, value, updated_at")
        .eq("clinic_id", clinic_id),
      supabase
        .from("leads")
        .select("status, created_at")
        .eq("clinic_id", clinic_id),
      supabase
        .from("appointments")
        .select("status, date")
        .eq("clinic_id", clinic_id)
        .eq("date", today),
    ]);

    // Calculate aggregates
    const totalRevenue = (revenue ?? []).reduce((s, r) => s + Number(r.value), 0);
    const revenueGoal = Number(goals?.revenue_goal ?? 0);

    const funnelItems = funnel ?? [];
    const totalFunnel = funnelItems.length;
    const closedCount = funnelItems.filter((f) => f.stage === "fechado").length;
    const lostCount = funnelItems.filter((f) => f.stage === "perdido").length;
    const inNegotiation = funnelItems.filter((f) => !["fechado", "perdido"].includes(f.stage)).length;
    const stagnant = funnelItems.filter(
      (f) => !["fechado", "perdido"].includes(f.stage) && f.updated_at < sevenDaysAgo
    ).length;
    const closedValues = funnelItems.filter((f) => f.stage === "fechado").map((f) => Number(f.value ?? 0));
    const ticketMedio = closedValues.length > 0 ? closedValues.reduce((a, b) => a + b, 0) / closedValues.length : 0;
    const conversionRate = totalFunnel > 0 ? Math.round((closedCount / totalFunnel) * 100) : 0;

    const allLeads = leads ?? [];
    const newLeads = allLeads.filter((l) => l.status === "novo").length;
    const staleLeads = allLeads.filter((l) => l.status === "novo" && l.created_at < threeDaysAgo).length;

    const todayAppts = appts ?? [];
    const totalAppts = todayAppts.length;
    const missedAppts = todayAppts.filter((a) => a.status === "faltou").length;

    const contextData = {
      faturamento_mes: totalRevenue,
      meta_faturamento: revenueGoal,
      percentual_meta: revenueGoal > 0 ? Math.round((totalRevenue / revenueGoal) * 100) : 0,
      taxa_conversao: conversionRate,
      ticket_medio: Math.round(ticketMedio),
      pacientes_negociacao: inNegotiation,
      pacientes_parados_funil: stagnant,
      oportunidades_perdidas: lostCount,
      leads_novos: newLeads,
      leads_sem_contato_3dias: staleLeads,
      consultas_hoje: totalAppts,
      faltas_hoje: missedAppts,
      total_funil: totalFunnel,
      fechados: closedCount,
    };

    const systemPrompt = `Você é um consultor de negócios especialista em clínicas odontológicas. Analise os dados da clínica e gere recomendações estratégicas práticas para crescimento de 10% a 30% ao mês. Use linguagem simples e direta, como se estivesse orientando o dono da clínica. Fale em português do Brasil.`;

    const userPrompt = `Analise os dados desta clínica e gere recomendações estratégicas priorizadas:

${JSON.stringify(contextData, null, 2)}

Gere entre 3 e 6 recomendações, priorizadas por impacto no faturamento.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_recommendations",
              description: "Gera recomendações estratégicas priorizadas para a clínica",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        priority: { type: "string", enum: ["Alta", "Media", "Baixa"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        action_label: { type: "string" },
                        action_link: {
                          type: "string",
                          enum: ["/vendas/follow-up", "/vendas/funil", "/leads", "/gestao", "/marketing", "/autoridade", "/gps"],
                        },
                        estimated_impact: { type: "string" },
                      },
                      required: ["priority", "title", "description", "action_label", "action_link", "estimated_impact"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_recommendations" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Erro ao chamar IA");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("IA não retornou recomendações");

    const recommendations = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("vega-intelligence error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
