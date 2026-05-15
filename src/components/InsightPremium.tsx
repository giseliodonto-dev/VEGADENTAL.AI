import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle, RotateCcw, Crown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface InsightPremiumProps {
  revenue: number;
  expenses: number;
  conversionRate: number;
  stagnantFunnelCount: number;
  doctorName?: string;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const InsightPremium = ({
  revenue,
  expenses,
  conversionRate,
  stagnantFunnelCount,
  doctorName = "Dra. Giseli",
}: InsightPremiumProps) => {
  const profit = revenue - expenses;
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const buildPrompt = () =>
    `Atue como consultor sênior de gestão odontológica premium. Dados da clínica este mês — Faturamento: ${brl(
      revenue
    )} · Despesas: ${brl(expenses)} · Lucro: ${brl(
      profit
    )} · Conversão do funil: ${conversionRate}% · Pacientes parados no funil há mais de 7 dias: ${stagnantFunnelCount}. Entregue as 3 ações prioritárias para a ${doctorName} aumentar a LUCRATIVIDADE esta semana, com foco absoluto em (a) margem de contribuição e ticket médio (mix de procedimentos com markup entre 2,38× e 3,30×) e (b) reativação dos ${stagnantFunnelCount} pacientes parados no funil. Não sugira ações de volume puro nem investimento em mídia paga. Responda em português, em exatamente 3 itens numerados (1. 2. 3.). Cada item deve conter, nesta ordem: **título curto em negrito** na primeira linha; 1 ou 2 frases de justificativa estratégica explicando por que a ação protege margem ou reativa pacientes; e uma linha final começando exatamente com "Impacto:" trazendo uma estimativa numérica (R$, % ou número de pacientes). Não escreva nada antes do item 1 nem depois do item 3.`;

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("claude-ai-service", {
        body: { messages: [{ role: "user", content: buildPrompt() }] },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const content: string =
        data?.content ?? data?.message ?? data?.text ?? data?.reply ?? "";
      if (!content) throw new Error("Resposta vazia da IA.");
      setInsight(content);
      setGeneratedAt(new Date());
      toast.success("Insight Premium gerado.");
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Falha ao gerar o insight. Tente novamente.";
      setError(msg);
      toast.error("Erro ao gerar insight", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-autoridade/30 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Crown className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-lg tracking-tight text-autoridade">
                  Insight de Gestão Premium
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Análise estratégica personalizada por Vega · Claude 3.5
                </p>
              </div>
            </div>
            <Button
              onClick={generate}
              disabled={loading}
              className="bg-primary text-gold hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {insight ? "Gerar novamente" : "Gerar Insight Premium"}
                </>
              )}
            </Button>
          </div>

          {/* KPI snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {[
              { label: "Faturamento", value: brl(revenue) },
              { label: "Lucro", value: brl(profit) },
              { label: "Conversão", value: `${conversionRate}%` },
              { label: "Parados >7d", value: String(stagnantFunnelCount) },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-lg border border-border/50 bg-background/50 px-3 py-2"
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </p>
                <p className="font-display text-sm text-foreground">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2 pt-2">
              <p className="text-xs italic text-muted-foreground">
                Vega está analisando seus números…
              </p>
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-destructive">{error}</div>
              <Button size="sm" variant="outline" onClick={generate}>
                <RotateCcw className="h-3 w-3" />
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Insight */}
          {insight && !loading && (
            <div className="pt-2">
              <div className="rounded-xl border border-gold/20 bg-background/60 p-6 divide-y divide-border/40">
                {parseInsightItems(insight).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-5 py-5 first:pt-0 last:pb-0"
                  >
                    <div className="shrink-0 font-display text-4xl text-gold/70 leading-none tabular-nums tracking-tight w-12">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 space-y-2">
                      {item.title && (
                        <h3 className="font-display text-base text-autoridade tracking-tight">
                          {item.title}
                        </h3>
                      )}
                      {item.body && (
                        <p
                          className="text-sm text-foreground font-body leading-[1.7]"
                          style={{ letterSpacing: "0.005em" }}
                          dangerouslySetInnerHTML={{ __html: renderInline(item.body) }}
                        />
                      )}
                      {item.impact && (
                        <span className="block text-xs italic text-gold/80 mt-2">
                          Impacto: {item.impact}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {generatedAt && (
                <p className="text-[10px] text-muted-foreground mt-2 text-right">
                  Gerado em {format(generatedAt, "dd/MM 'às' HH:mm")} · Inteligência Vega · Claude 3.5
                </p>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};
