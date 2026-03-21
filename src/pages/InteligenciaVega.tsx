import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Brain,
  Loader2,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Recommendation {
  priority: "Alta" | "Media" | "Baixa";
  title: string;
  description: string;
  action_label: string;
  action_link: string;
  estimated_impact: string;
}

const priorityConfig = {
  Alta: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "🔴 Alta" },
  Media: { color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "🟡 Média" },
  Baixa: { color: "text-vendas", bg: "bg-vendas/10", border: "border-vendas/20", label: "🟢 Baixa" },
};

const InteligenciaVega = () => {
  const { clinicId } = useClinic();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const generateAnalysis = async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("vega-intelligence", {
        body: { clinic_id: clinicId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setRecommendations(data.recommendations ?? []);
      setLastAnalysis(new Date());
      toast({ title: "Análise gerada!", description: "Recomendações atualizadas com sucesso." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro na análise", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const grouped = {
    Alta: recommendations.filter((r) => r.priority === "Alta"),
    Media: recommendations.filter((r) => r.priority === "Media"),
    Baixa: recommendations.filter((r) => r.priority === "Baixa"),
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-autoridade/10">
              <Brain className="h-5 w-5 text-autoridade" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">Inteligência VEGA</h1>
              <p className="text-xs text-muted-foreground">Análise estratégica com IA</p>
            </div>
          </div>
          <Button onClick={generateAnalysis} disabled={loading || !clinicId}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Análise
              </>
            )}
          </Button>
        </div>

        {/* Last analysis */}
        {lastAnalysis && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Última análise: {format(lastAnalysis, "dd/MM/yyyy 'às' HH:mm")}
          </div>
        )}

        {/* Empty state */}
        {recommendations.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Brain className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Clique em "Gerar Análise" para receber recomendações estratégicas personalizadas para sua clínica.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-4 px-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recommendations by priority */}
        {!loading &&
          (["Alta", "Media", "Baixa"] as const).map((priority) => {
            const items = grouped[priority];
            if (items.length === 0) return null;
            const config = priorityConfig[priority];

            return (
              <div key={priority} className="space-y-2">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <span>{config.label}</span>
                  <span className="text-muted-foreground font-normal">— Prioridade</span>
                </h2>
                <div className="grid gap-2">
                  {items.map((rec, i) => (
                    <Card key={i} className={`border ${config.border}`}>
                      <CardContent className="py-4 px-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${config.color}`}>{rec.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color} shrink-0`}>
                            {rec.estimated_impact}
                          </span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={rec.action_link}>
                            {rec.action_label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </AppLayout>
  );
};

export default InteligenciaVega;
