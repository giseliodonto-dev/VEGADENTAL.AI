import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, TrendingUp, FileCheck2, FileX2, Clock, DollarSign, Target } from "lucide-react";
import { Link } from "react-router-dom";

interface Budget {
  id: string;
  status: string;
  final_value: number;
  created_at: string;
  accepted_at: string | null;
  patient_id: string;
}

export default function TaxaConversao() {
  const { clinicId, loading: clinicLoading } = useClinic();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"30" | "90" | "365">("30");

  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("budgets")
        .select("id, status, final_value, created_at, accepted_at, patient_id")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });
      setBudgets((data as any) || []);
      setLoading(false);
    })();
  }, [clinicId]);

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    return budgets.filter((b) => new Date(b.created_at) >= cutoff);
  }, [budgets, period]);

  const total = filtered.length;
  const aceitos = filtered.filter((b) => b.status === "aceito").length;
  const recusados = filtered.filter((b) => b.status === "recusado").length;
  const pendentes = filtered.filter((b) => b.status === "pendente" || b.status === "enviado").length;
  const taxa = total > 0 ? ((aceitos / total) * 100).toFixed(1) : "0";
  const valorAceito = filtered.filter((b) => b.status === "aceito").reduce((s, b) => s + Number(b.final_value || 0), 0);
  const valorPerdido = filtered.filter((b) => b.status === "recusado").reduce((s, b) => s + Number(b.final_value || 0), 0);
  const valorPendente = filtered.filter((b) => b.status === "pendente" || b.status === "enviado").reduce((s, b) => s + Number(b.final_value || 0), 0);
  const ticketMedio = aceitos > 0 ? valorAceito / aceitos : 0;

  // Tempo médio até aceite
  const tempoMedio = useMemo(() => {
    const aceitosComData = filtered.filter((b) => b.status === "aceito" && b.accepted_at);
    if (!aceitosComData.length) return 0;
    const dias = aceitosComData.reduce((sum, b) => {
      const diff = new Date(b.accepted_at!).getTime() - new Date(b.created_at).getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    return dias / aceitosComData.length;
  }, [filtered]);

  if (clinicLoading || loading) {
    return (
      <AppLayout title="Taxa de Conversão">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const kpis = [
    { label: "Taxa de Conversão", value: `${taxa}%`, icon: TrendingUp, color: Number(taxa) >= 50 ? "text-success" : "text-warning" },
    { label: "Orçamentos Aceitos", value: String(aceitos), icon: FileCheck2, color: "text-success" },
    { label: "Recusados", value: String(recusados), icon: FileX2, color: "text-destructive" },
    { label: "Pendentes", value: String(pendentes), icon: Clock, color: "text-warning" },
    { label: "Receita Confirmada", value: `R$ ${valorAceito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-success" },
    { label: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, icon: Target, color: "text-primary" },
    { label: "Tempo Médio até Aceite", value: `${tempoMedio.toFixed(1)} dias`, icon: Clock, color: "text-muted-foreground" },
    { label: "Pipeline em Aberto", value: `R$ ${valorPendente.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-warning" },
  ];

  return (
    <AppLayout title="Taxa de Conversão" subtitle="Quantos orçamentos viraram tratamento fechado">
      <div className="space-y-5 max-w-5xl">
        <Link to="/vendas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Vendas
        </Link>

        {/* Filtro de período */}
        <div className="flex gap-2">
          {([["30", "30 dias"], ["90", "90 dias"], ["365", "1 ano"]] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPeriod(v as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                  <p className="text-[11px] uppercase tracking-wide font-medium">{k.label}</p>
                </div>
                <p className={`text-xl font-display font-bold ${k.color}`}>{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Funnel visual */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold font-display">Funil de Orçamentos</h3>
            {[
              { label: "Total enviados", count: total, value: filtered.reduce((s, b) => s + Number(b.final_value || 0), 0), color: "bg-primary", pct: 100 },
              { label: "Pendentes", count: pendentes, value: valorPendente, color: "bg-warning", pct: total ? (pendentes / total) * 100 : 0 },
              { label: "Aceitos (fechados)", count: aceitos, value: valorAceito, color: "bg-success", pct: total ? (aceitos / total) * 100 : 0 },
              { label: "Recusados (perdidos)", count: recusados, value: valorPerdido, color: "bg-destructive", pct: total ? (recusados / total) * 100 : 0 },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">
                    {row.count} · R$ {row.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${row.color} transition-all`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Insights */}
        {total > 0 && (
          <Card>
            <CardContent className="p-6 space-y-2 text-sm">
              <h3 className="text-sm font-semibold font-display mb-2">Insights</h3>
              {Number(taxa) < 30 && (
                <p className="text-warning">⚠️ Taxa de conversão baixa ({taxa}%). Revisar abordagem comercial e follow-up.</p>
              )}
              {Number(taxa) >= 50 && (
                <p className="text-success">✅ Excelente taxa de conversão ({taxa}%). Continue assim!</p>
              )}
              {pendentes > 5 && (
                <p className="text-muted-foreground">📋 {pendentes} orçamentos aguardando resposta — considere fazer follow-up.</p>
              )}
              {tempoMedio > 14 && (
                <p className="text-muted-foreground">⏱️ Tempo médio até aceite alto ({tempoMedio.toFixed(0)} dias). Pacientes demoram pra decidir.</p>
              )}
            </CardContent>
          </Card>
        )}

        {total === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Nenhum orçamento criado nesse período.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
