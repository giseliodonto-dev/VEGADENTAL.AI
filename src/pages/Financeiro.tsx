import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const cashFlowData = [
  { month: "Jan", receitas: 72400, despesas: 38200 },
  { month: "Fev", receitas: 68900, despesas: 35600 },
  { month: "Mar", receitas: 81200, despesas: 41000 },
  { month: "Abr", receitas: 79500, despesas: 39800 },
  { month: "Mai", receitas: 88700, despesas: 42100 },
  { month: "Jun", receitas: 94200, despesas: 44500 },
];

const recentTransactions = [
  { description: "Consulta - João Augusto", type: "income", value: 1000, date: "20/03/2026" },
  { description: "Consulta - Maria Oliveira", type: "income", value: 350, date: "20/03/2026" },
  { description: "Material Odontológico", type: "expense", value: 1200, date: "19/03/2026" },
  { description: "Restauração - Carlos Santos", type: "income", value: 480, date: "19/03/2026" },
  { description: "Aluguel do consultório", type: "expense", value: 8500, date: "18/03/2026" },
  { description: "Ortodontia - Ana Costa", type: "income", value: 1200, date: "18/03/2026" },
  { description: "Folha de pagamento", type: "expense", value: 22000, date: "15/03/2026" },
  { description: "Canal - Pedro Almeida", type: "income", value: 890, date: "15/03/2026" },
  { description: "Manutenção equipamentos", type: "expense", value: 1500, date: "14/03/2026" },
];

const Financeiro = () => {
  return (
    <AppLayout title="Financeiro">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Receita Mensal"
            value="R$ 94.200"
            change="+6,2% vs mês anterior"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-success/10 text-success"
            delay={50}
          />
          <StatCard
            title="Despesas"
            value="R$ 44.500"
            change="+5,7% vs mês anterior"
            changeType="negative"
            icon={TrendingDown}
            iconColor="bg-destructive/10 text-destructive"
            delay={120}
          />
          <StatCard
            title="Lucro Líquido"
            value="R$ 49.700"
            change="+6,8% vs mês anterior"
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-primary/10 text-primary"
            delay={190}
          />
          <StatCard
            title="Ticket Médio"
            value="R$ 387"
            change="+R$ 23 vs mês anterior"
            changeType="positive"
            icon={Receipt}
            iconColor="bg-warning/10 text-warning"
            delay={260}
          />
        </div>

        {/* Cash flow chart */}
        <div
          className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm"
          style={{ animationDelay: "300ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Fluxo de Caixa</h3>
              <p className="text-xs text-muted-foreground">Receitas vs Despesas — últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Despesas</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="receitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174, 58%, 39%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(174, 58%, 39%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="despesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 12%, 89%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(200, 10%, 46%)" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(200, 10%, 46%)"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(150, 12%, 89%)", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="hsl(174, 58%, 39%)"
                  strokeWidth={2}
                  fill="url(#receitas)"
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="hsl(0, 72%, 51%)"
                  strokeWidth={2}
                  fill="url(#despesas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent transactions */}
        <div
          className="animate-fade-up rounded-xl border bg-card shadow-sm"
          style={{ animationDelay: "380ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold">Últimas Transações</h3>
            <p className="text-xs text-muted-foreground">Movimentações recentes</p>
          </div>
          <div className="divide-y">
            {recentTransactions.map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      tx.type === "income" ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    tx.type === "income" ? "text-success" : "text-destructive"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}R$ {tx.value.toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Financeiro;
