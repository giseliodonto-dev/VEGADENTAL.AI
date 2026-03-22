import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, ArrowRight,
  BarChart3, PieChart, Target, Calendar, Percent, Minus
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const OPERATIONAL_CATEGORIES = ["materiais", "laboratório", "laboratorio"];

const EXPENSE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220 60% 65%)",
  "hsl(160 45% 52%)",
  "hsl(35 80% 60%)",
];

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function growth(current: number, previous: number) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinancasVega() {
  const { clinicId } = useClinic();
  const [period, setPeriod] = useState("current");

  const now = new Date();
  const currentStart = format(startOfMonth(now), "yyyy-MM-dd");
  const currentEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const prevStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const prevEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

  // Current month financials
  const { data: currentFinancials = [] } = useQuery({
    queryKey: ["financas-current", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("financials")
        .select("*")
        .eq("clinic_id", clinicId!)
        .eq("status", "pago")
        .gte("date", currentStart)
        .lte("date", currentEnd);
      return data || [];
    },
  });

  // Previous month financials
  const { data: prevFinancials = [] } = useQuery({
    queryKey: ["financas-prev", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("financials")
        .select("*")
        .eq("clinic_id", clinicId!)
        .eq("status", "pago")
        .gte("date", prevStart)
        .lte("date", prevEnd);
      return data || [];
    },
  });

  // Goals
  const { data: goal } = useQuery({
    queryKey: ["financas-goal", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("clinic_id", clinicId!)
        .eq("month", currentStart)
        .maybeSingle();
      return data;
    },
  });

  // Revenue per dentist
  const { data: dentistRevenue = [] } = useQuery({
    queryKey: ["financas-dentist-revenue", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("dentist_user_id, estimated_value, profiles:dentist_user_id(full_name)")
        .eq("clinic_id", clinicId!)
        .eq("status", "atendido")
        .gte("date", currentStart)
        .lte("date", currentEnd);
      return data || [];
    },
  });

  // Appointments for occupancy
  const { data: appointments = [] } = useQuery({
    queryKey: ["financas-appointments", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, status")
        .eq("clinic_id", clinicId!)
        .gte("date", currentStart)
        .lte("date", currentEnd);
      return data || [];
    },
  });

  // Calculations
  const calc = useMemo(() => {
    const entries = (fins: typeof currentFinancials) => fins.filter(f => f.type === "entrada");
    const exits = (fins: typeof currentFinancials) => fins.filter(f => f.type === "saida");
    const sum = (items: typeof currentFinancials) => items.reduce((s, i) => s + Number(i.value), 0);

    const curEntries = entries(currentFinancials);
    const curExits = exits(currentFinancials);
    const prevEntries = entries(prevFinancials);
    const prevExits = exits(prevFinancials);

    const revenue = sum(curEntries);
    const received = sum(curEntries.filter(e => e.category === "recebimento"));
    const expenses = sum(curExits);
    const commissions = sum(curExits.filter(e => (e.category || "").toLowerCase() === "comissao"));
    const operationalExpenses = sum(curExits.filter(e => OPERATIONAL_CATEGORIES.includes((e.category || "").toLowerCase())));
    const grossProfit = revenue - operationalExpenses;
    const netProfit = revenue - expenses;
    const margin = pct(netProfit, revenue);
    const ticketMedio = curEntries.length > 0 ? revenue / curEntries.length : 0;

    const prevRevenue = sum(prevEntries);
    const prevExpenses = sum(prevExits);
    const prevNetProfit = prevRevenue - prevExpenses;

    const revenueGrowth = growth(revenue, prevRevenue);
    const expenseGrowth = growth(expenses, prevExpenses);
    const profitGrowth = growth(netProfit, prevNetProfit);

    // Category breakdown
    const expenseByCategory: Record<string, number> = {};
    curExits.forEach(e => {
      const cat = e.category || "Outros";
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.value);
    });
    const expenseCategoryData = Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Dentist revenue
    const dentistMap: Record<string, { name: string; value: number }> = {};
    dentistRevenue.forEach((a: any) => {
      const id = a.dentist_user_id || "unknown";
      const name = a.profiles?.full_name || "Sem dentista";
      if (!dentistMap[id]) dentistMap[id] = { name, value: 0 };
      dentistMap[id].value += Number(a.estimated_value || 0);
    });
    const dentistData = Object.values(dentistMap).sort((a, b) => b.value - a.value);

    // Occupancy
    const totalAppts = appointments.length;
    const occupancy = totalAppts > 0 ? pct(appointments.filter(a => a.status !== "cancelado").length, totalAppts) : 0;

    return {
      revenue, received, expenses, commissions, grossProfit, netProfit, margin, ticketMedio,
      prevRevenue, prevExpenses, prevNetProfit,
      revenueGrowth, expenseGrowth, profitGrowth,
      expenseCategoryData, dentistData, occupancy,
    };
  }, [currentFinancials, prevFinancials, dentistRevenue, appointments]);

  // Strategic phrase
  const strategicPhrase = useMemo(() => {
    if (calc.netProfit < 0) return { text: "Prejuízo operacional — ação urgente necessária", color: "text-destructive" };
    if (calc.margin < 15) return { text: "Atenção: operando com margem crítica", color: "text-destructive" };
    if (calc.margin < 30) return { text: "Você está pagando contas, mas sobrando pouco", color: "text-warning" };
    if (calc.margin < 50) return { text: "Margem saudável, mas há espaço para crescer", color: "text-gestao" };
    return { text: "Sua clínica está lucrando bem", color: "text-success" };
  }, [calc.netProfit, calc.margin]);

  // Alerts
  const alerts = useMemo(() => {
    const list: { text: string; severity: "high" | "medium" | "low" }[] = [];
    if (calc.margin < 30) list.push({ text: `Margem de lucro em ${calc.margin}% — abaixo de 30%`, severity: "high" });
    if (goal?.profit_goal && calc.netProfit < Number(goal.profit_goal))
      list.push({ text: `Lucro R$ ${calc.netProfit.toLocaleString("pt-BR")} abaixo da meta de R$ ${Number(goal.profit_goal).toLocaleString("pt-BR")}`, severity: "high" });
    if (calc.expenseGrowth > 10)
      list.push({ text: `Custos cresceram ${calc.expenseGrowth}% vs mês anterior`, severity: "medium" });
    if (calc.occupancy < 50)
      list.push({ text: `Ocupação da agenda em ${calc.occupancy}% — impactando receita`, severity: "medium" });
    return list;
  }, [calc, goal]);

  // Directives
  const directives = [
    { text: "Aumente conversão de vendas", link: "/vendas/funil", icon: TrendingUp },
    { text: "Melhore ocupação da agenda", link: "/gestao/agenda", icon: Calendar },
    { text: "Ajuste preços com hora clínica", link: "/gestao/hora-clinica", icon: Target },
  ];

  const comparisonData = [
    { name: "Faturamento", atual: calc.revenue, anterior: calc.prevRevenue },
    { name: "Despesas", atual: calc.expenses, anterior: calc.prevExpenses },
    { name: "Lucro", atual: calc.netProfit, anterior: calc.prevNetProfit },
  ];

  const GrowthBadge = ({ value }: { value: number }) => (
    <div className={`flex items-center gap-1 text-xs font-medium ${value >= 0 ? "text-success" : "text-destructive"}`}>
      {value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {value >= 0 ? "+" : ""}{value}%
    </div>
  );

  const kpis = [
    { label: "Faturamento", value: formatCurrency(calc.revenue), growth: calc.revenueGrowth, icon: DollarSign },
    { label: "Despesas", value: formatCurrency(calc.expenses), growth: calc.expenseGrowth, icon: Minus, growthInverted: true },
    { label: "Lucro Líquido", value: formatCurrency(calc.netProfit), growth: calc.profitGrowth, icon: TrendingUp },
    { label: "Margem", value: `${calc.margin}%`, icon: Percent },
    { label: "Ticket Médio", value: formatCurrency(calc.ticketMedio), icon: BarChart3 },
    { label: "Ocupação", value: `${calc.occupancy}%`, icon: Calendar },
  ];

  const chartConfig = {
    atual: { label: "Mês atual", color: "hsl(var(--chart-1))" },
    anterior: { label: "Mês anterior", color: "hsl(var(--chart-2))" },
  };

  return (
    <AppLayout title="Finanças VEGA" subtitle="Análise estratégica da saúde financeira">
      <div className="max-w-6xl space-y-6">
        {/* Strategic phrase */}
        <div className="animate-fade-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <Card className="border-l-4" style={{ borderLeftColor: calc.netProfit < 0 ? "hsl(var(--destructive))" : calc.margin < 30 ? "hsl(var(--warning))" : "hsl(var(--success))" }}>
            <CardContent className="py-4 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <p className={`text-sm font-semibold ${strategicPhrase.color}`}>{strategicPhrase.text}</p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi, i) => (
            <Card
              key={kpi.label}
              className="animate-fade-up"
              style={{ animationDelay: `${80 + i * 60}ms`, opacity: 0, animationFillMode: "forwards" }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className="h-4 w-4 text-gestao" />
                  {kpi.growth !== undefined && (
                    <GrowthBadge value={kpi.growthInverted ? -kpi.growth : kpi.growth} />
                  )}
                </div>
                <p className="text-lg font-bold font-display">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Comparison chart */}
          <Card className="animate-fade-up" style={{ animationDelay: "400ms", opacity: 0, animationFillMode: "forwards" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Comparativo Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="atual" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anterior" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Expense categories */}
          <Card className="animate-fade-up" style={{ animationDelay: "480ms", opacity: 0, animationFillMode: "forwards" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {calc.expenseCategoryData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Valor", color: "hsl(var(--chart-3))" } }} className="h-[220px] w-full">
                  <RechartsPie>
                    <Pie
                      data={calc.expenseCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {calc.expenseCategoryData.map((_, i) => (
                        <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPie>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Sem despesas registradas</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue per dentist */}
        {calc.dentistData.length > 0 && (
          <Card className="animate-fade-up" style={{ animationDelay: "560ms", opacity: 0, animationFillMode: "forwards" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Receita por Dentista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calc.dentistData.map((d, i) => {
                  const maxVal = calc.dentistData[0]?.value || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 truncate">{d.name}</span>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gestao transition-all"
                          style={{ width: `${pct(d.value, maxVal)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-24 text-right">{formatCurrency(d.value)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold font-display flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Alertas Estratégicos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alerts.map((alert, i) => (
                <Card
                  key={i}
                  className={`border-l-4 ${alert.severity === "high" ? "border-l-destructive" : "border-l-warning"}`}
                >
                  <CardContent className="py-3 flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 shrink-0 ${alert.severity === "high" ? "text-destructive" : "text-warning"}`} />
                    <p className="text-xs">{alert.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Directives */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold font-display">Direcionamentos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {directives.map((d, i) => (
              <Link key={i} to={d.link}>
                <Card className="hover:shadow-md hover:border-gestao/30 transition-all cursor-pointer group">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <d.icon className="h-4 w-4 text-gestao" />
                      <span className="text-xs font-medium">{d.text}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-gestao transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
