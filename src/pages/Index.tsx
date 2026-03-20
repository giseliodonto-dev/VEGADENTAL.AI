import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import {
  DollarSign,
  Users,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const revenueData = [
  { month: "Jan", valor: 72400 },
  { month: "Fev", valor: 68900 },
  { month: "Mar", valor: 81200 },
  { month: "Abr", valor: 79500 },
  { month: "Mai", valor: 88700 },
  { month: "Jun", valor: 94200 },
];

const procedureData = [
  { name: "Limpeza", value: 32, color: "hsl(174, 58%, 39%)" },
  { name: "Restauração", value: 25, color: "hsl(38, 92%, 50%)" },
  { name: "Ortodontia", value: 18, color: "hsl(205, 80%, 50%)" },
  { name: "Endodontia", value: 14, color: "hsl(152, 60%, 42%)" },
  { name: "Outros", value: 11, color: "hsl(200, 10%, 70%)" },
];

const todayAppointments = [
  { time: "08:00", patient: "Maria Oliveira", procedure: "Limpeza", status: "confirmed" },
  { time: "09:30", patient: "Carlos Santos", procedure: "Restauração", status: "confirmed" },
  { time: "10:30", patient: "Ana Costa", procedure: "Ortodontia", status: "waiting" },
  { time: "11:30", patient: "Pedro Almeida", procedure: "Canal", status: "confirmed" },
  { time: "14:00", patient: "Julia Ferreira", procedure: "Consulta", status: "pending" },
  { time: "15:00", patient: "Lucas Martins", procedure: "Extração", status: "confirmed" },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  waiting: "bg-warning/10 text-warning",
  pending: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmado",
  waiting: "Aguardando",
  pending: "Pendente",
};

const Dashboard = () => {
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Faturamento Mensal"
            value="R$ 94.200"
            change="+6,2% vs mês anterior"
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-primary/10 text-primary"
            delay={50}
          />
          <StatCard
            title="Pacientes Ativos"
            value="847"
            change="+23 novos este mês"
            changeType="positive"
            icon={Users}
            iconColor="bg-info/10 text-info"
            delay={120}
          />
          <StatCard
            title="Consultas Hoje"
            value="12"
            change="3 vagas restantes"
            changeType="neutral"
            icon={CalendarCheck}
            iconColor="bg-success/10 text-success"
            delay={190}
          />
          <StatCard
            title="Taxa de Retorno"
            value="73%"
            change="+4% vs mês anterior"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-warning/10 text-warning"
            delay={260}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue chart */}
          <div
            className="animate-fade-up lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm"
            style={{ animationDelay: "300ms", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Faturamento</h3>
                <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 12%, 89%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(200, 10%, 46%)" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="hsl(200, 10%, 46%)"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Valor"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(150, 12%, 89%)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="valor" fill="hsl(174, 58%, 39%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Procedures chart */}
          <div
            className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm"
            style={{ animationDelay: "380ms", opacity: 0, animationFillMode: "forwards" }}
          >
            <h3 className="text-sm font-semibold mb-1">Procedimentos</h3>
            <p className="text-xs text-muted-foreground mb-4">Distribuição mensal</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={procedureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(0, 0%, 100%)"
                  >
                    {procedureData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, ""]}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {procedureData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium tabular-nums">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's appointments */}
        <div
          className="animate-fade-up rounded-xl border bg-card shadow-sm"
          style={{ animationDelay: "440ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <h3 className="text-sm font-semibold">Agenda de Hoje</h3>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Ver agenda completa <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y">
            {todayAppointments.map((apt, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2 text-muted-foreground w-16 shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-sm tabular-nums font-medium">{apt.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{apt.patient}</p>
                  <p className="text-xs text-muted-foreground">{apt.procedure}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    statusColors[apt.status]
                  }`}
                >
                  {statusLabels[apt.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
