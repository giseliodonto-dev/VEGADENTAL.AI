import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { BarChart3, Clock, Users, CalendarCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

const kpis = [
  { label: "Taxa de Ocupação", value: "78%", change: "+4%", icon: CalendarCheck, trend: "up" as const },
  { label: "No-show do Mês", value: "12%", change: "-2%", icon: AlertTriangle, trend: "down" as const },
  { label: "Tempo Médio Atend.", value: "42 min", change: "=", icon: Clock, trend: "neutral" as const },
  { label: "Novos Pacientes", value: "23", change: "+7", icon: Users, trend: "up" as const },
];

const alerts = [
  { level: "warning", message: "3 pacientes sem retorno há mais de 6 meses" },
  { level: "info", message: "Meta de ocupação de março atingida em 78%" },
  { level: "success", message: "Taxa de no-show reduziu 2% em relação ao mês anterior" },
];

const Gestao = () => {
  return (
    <AppLayout title="Gestão — Indicadores">
      <div className="space-y-6 max-w-5xl">
        <div
          className="animate-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          {kpis.map((kpi, i) => (
            <Card
              key={i}
              className="p-4 flex items-start gap-3"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold tabular-nums">{kpi.value}</p>
                <p className={`text-xs font-medium ${kpi.trend === "up" ? "text-success" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                  {kpi.change} vs mês anterior
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div
          className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm space-y-3"
          style={{ animationDelay: "120ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            Alertas e Insights
          </h3>
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${
                alert.level === "warning"
                  ? "bg-warning/10 text-warning"
                  : alert.level === "success"
                  ? "bg-success/10 text-success"
                  : "bg-info/10 text-info"
              }`}
            >
              {alert.level === "warning" ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <TrendingUp className="h-4 w-4 shrink-0" />
              )}
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Gestao;
