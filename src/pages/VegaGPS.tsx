import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Compass,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  Clock,
  UserX,
  CalendarX,
  Phone,
  RotateCcw,
  CalendarPlus,
  ArrowRight,
  Megaphone,
  Brain,
  BarChart3,
  Crown,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { differenceInDays, startOfMonth, endOfMonth, format } from "date-fns";

const VegaGPS = () => {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const today = format(now, "yyyy-MM-dd");

  // Faturamento do mês
  const { data: revenue = 0, isLoading: loadingRev } = useQuery({
    queryKey: ["gps-revenue", clinicId, monthStart],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("financials")
        .select("value")
        .eq("clinic_id", clinicId!)
        .eq("type", "entrada")
        .gte("date", monthStart)
        .lte("date", monthEnd);
      return (data ?? []).reduce((s, r) => s + Number(r.value), 0);
    },
  });

  // Meta do mês
  const { data: goal, isLoading: loadingGoal } = useQuery({
    queryKey: ["gps-goal", clinicId, monthStart],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("goals")
        .select("revenue_goal, conversion_goal")
        .eq("clinic_id", clinicId!)
        .eq("month", monthStart)
        .maybeSingle();
      return data;
    },
  });

  // Funil de vendas
  const { data: funnelData = [], isLoading: loadingFunnel } = useQuery({
    queryKey: ["gps-funnel", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_funnel")
        .select("stage, value, updated_at, patient_id")
        .eq("clinic_id", clinicId!);
      return data ?? [];
    },
  });

  // Leads novos
  const { data: newLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["gps-leads", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, status, created_at")
        .eq("clinic_id", clinicId!)
        .eq("status", "novo");
      return data ?? [];
    },
  });

  // Appointments hoje
  const { data: todayAppts = [], isLoading: loadingAppts } = useQuery({
    queryKey: ["gps-appts", clinicId, today],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, status")
        .eq("clinic_id", clinicId!)
        .eq("date", today);
      return data ?? [];
    },
  });

  const isLoading = loadingRev || loadingGoal || loadingFunnel || loadingLeads || loadingAppts;

  // KPI calculations
  const revenueGoal = Number(goal?.revenue_goal ?? 0);
  const revenuePercent = revenueGoal > 0 ? Math.round((revenue / revenueGoal) * 100) : 0;

  const totalFunnel = funnelData.length;
  const closedCount = funnelData.filter((f) => f.stage === "fechado").length;
  const conversionRate = totalFunnel > 0 ? Math.round((closedCount / totalFunnel) * 100) : 0;

  const inNegotiation = funnelData.filter(
    (f) => !["fechado", "perdido"].includes(f.stage)
  ).length;

  const closedValues = funnelData
    .filter((f) => f.stage === "fechado")
    .map((f) => Number(f.value ?? 0));
  const ticketMedio =
    closedValues.length > 0
      ? closedValues.reduce((a, b) => a + b, 0) / closedValues.length
      : 0;

  // Alerts
  const stagnantFunnel = funnelData.filter(
    (f) =>
      !["fechado", "perdido"].includes(f.stage) &&
      differenceInDays(now, new Date(f.updated_at)) > 7
  );

  const staleLeads = newLeads.filter(
    (l) => differenceInDays(now, new Date(l.created_at)) > 3
  );

  const expectedSlots = 8; // capacidade diária estimada
  const emptySlots = Math.max(0, expectedSlots - todayAppts.length);

  const alerts: { icon: React.ElementType; text: string; color: string; link: string }[] = [];

  if (revenueGoal > 0 && revenuePercent < 80) {
    alerts.push({
      icon: Target,
      text: `Faturamento está em ${revenuePercent}% da meta`,
      color: revenuePercent < 50 ? "text-destructive" : "text-yellow-500",
      link: "/gestao",
    });
  }
  if (stagnantFunnel.length > 0) {
    alerts.push({
      icon: Clock,
      text: `${stagnantFunnel.length} paciente(s) parado(s) no funil há mais de 7 dias`,
      color: "text-yellow-500",
      link: "/vendas/follow-up",
    });
  }
  if (staleLeads.length > 0) {
    alerts.push({
      icon: UserX,
      text: `${staleLeads.length} lead(s) sem contato há mais de 3 dias`,
      color: "text-destructive",
      link: "/leads",
    });
  }
  if (emptySlots >= 4) {
    alerts.push({
      icon: CalendarX,
      text: `Agenda de hoje com ${emptySlots} horários vagos`,
      color: "text-yellow-500",
      link: "/gestao",
    });
  }

  // Directions
  const directions: { icon: React.ElementType; text: string; link: string; label: string }[] = [];

  if (stagnantFunnel.length > 0) {
    directions.push({
      icon: Phone,
      text: `Ligue para ${stagnantFunnel.length} paciente(s) parado(s) no funil`,
      link: "/vendas/follow-up",
      label: "Ver follow-up",
    });
  }
  if (staleLeads.length > 0) {
    directions.push({
      icon: RotateCcw,
      text: `Reative ${staleLeads.length} lead(s) sem resposta`,
      link: "/leads",
      label: "Ver leads",
    });
  }
  if (emptySlots >= 2) {
    directions.push({
      icon: CalendarPlus,
      text: "Preencha a agenda com pacientes em follow-up",
      link: "/vendas/follow-up",
      label: "Agendar",
    });
  }

  const kpis = [
    {
      title: "Faturamento",
      value: `R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-vendas",
      bgColor: "bg-vendas/10",
    },
    {
      title: "Conversão",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-marketing",
      bgColor: "bg-marketing/10",
    },
    {
      title: "Em Negociação",
      value: String(inNegotiation),
      icon: Users,
      color: "text-gestao",
      bgColor: "bg-gestao/10",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
      icon: Target,
      color: "text-autoridade",
      bgColor: "bg-autoridade/10",
    },
  ];

  const pillarSummary = [
    { title: "Vendas", icon: TrendingUp, color: "text-vendas", link: "/vendas", detail: `${inNegotiation} em negociação` },
    { title: "Marketing", icon: Megaphone, color: "text-marketing", link: "/marketing", detail: `${newLeads.length} leads novos` },
    { title: "Gestão", icon: BarChart3, color: "text-gestao", link: "/gestao", detail: `${todayAppts.length} consultas hoje` },
    { title: "Autoridade", icon: Crown, color: "text-autoridade", link: "/autoridade", detail: "Posicionamento" },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-vendas/10">
            <Compass className="h-5 w-5 text-vendas" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">VEGA GPS</h1>
            <p className="text-xs text-muted-foreground">Painel de direção da clínica</p>
          </div>
        </div>

        {/* Meta progress */}
        {revenueGoal > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Meta do mês</span>
                <span className="text-sm text-muted-foreground">
                  R$ {revenue.toLocaleString("pt-BR")} / R$ {revenueGoal.toLocaleString("pt-BR")}
                </span>
              </div>
              <Progress value={Math.min(revenuePercent, 100)} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">{revenuePercent}% atingido</p>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.title}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bgColor}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold font-display">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground">{kpi.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Alertas Inteligentes
            </h2>
            <div className="grid gap-2">
              {alerts.map((alert, i) => (
                <Link key={i} to={alert.link}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <alert.icon className={`h-5 w-5 shrink-0 ${alert.color}`} />
                      <span className="text-sm flex-1">{alert.text}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No alerts - good state */}
        {alerts.length === 0 && (
          <Card className="border-vendas/30">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vendas/10">
                <TrendingUp className="h-4 w-4 text-vendas" />
              </div>
              <span className="text-sm font-medium text-vendas">Tudo em ordem! Nenhum alerta no momento.</span>
            </CardContent>
          </Card>
        )}

        {/* Directions */}
        {directions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">📌 Direcionamentos</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {directions.map((d, i) => (
                <Card key={i}>
                  <CardContent className="py-4 px-4 flex items-center gap-3">
                    <d.icon className="h-5 w-5 shrink-0 text-vendas" />
                    <span className="text-sm flex-1">{d.text}</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={d.link}>{d.label}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Inteligência VEGA card */}
        <Link to="/inteligencia">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-autoridade/20">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-autoridade/10">
                <Brain className="h-4 w-4 text-autoridade" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Inteligência VEGA</p>
                <p className="text-[11px] text-muted-foreground">Análise estratégica com IA — recomendações personalizadas</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* Pillar summary */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Resumo por Pilar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pillarSummary.map((p) => (
              <Link key={p.title} to={p.link}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="pt-4 pb-4 px-4">
                    <p.icon className={`h-5 w-5 mb-2 ${p.color}`} />
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground">{p.detail}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default VegaGPS;
