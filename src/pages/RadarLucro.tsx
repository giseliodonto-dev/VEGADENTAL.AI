import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Target, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

const RadarLucro = () => {
  const [faturamentoMensal, setFaturamentoMensal] = useState(85000);
  const [custoFixo, setCustoFixo] = useState(35000);
  const [custoVariavel, setCustoVariavel] = useState(15000);

  const [dadosDiarios, setDadosDiarios] = useState([
    { dia: "Seg", valor: 4200 },
    { dia: "Ter", valor: 3800 },
    { dia: "Qua", valor: 5100 },
    { dia: "Qui", valor: 4600 },
    { dia: "Sex", valor: 6300 },
    { dia: "Sáb", valor: 2800 },
  ]);

  const diasUteisMes = 22;
  const custoTotal = custoFixo + custoVariavel;
  const metaDiaria = custoTotal / diasUteisMes;
  const metaIdeal = (faturamentoMensal * 0.3 + custoTotal) / diasUteisMes; // 30% lucro

  const totalSemana = dadosDiarios.reduce((acc, d) => acc + d.valor, 0);
  const mediaDiaria = totalSemana / dadosDiarios.length;

  const getZona = () => {
    if (mediaDiaria >= metaIdeal) return { label: "Zona de Crescimento", color: "text-success", bg: "bg-success/10", icon: TrendingUp };
    if (mediaDiaria >= metaDiaria) return { label: "Zona de Segurança", color: "text-accent", bg: "bg-accent/10", icon: CheckCircle };
    return { label: "Risco Operacional", color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle };
  };

  const zona = getZona();
  const ZonaIcon = zona.icon;

  const handleDiaChange = (index: number, valor: string) => {
    const newDados = [...dadosDiarios];
    newDados[index] = { ...newDados[index], valor: parseFloat(valor) || 0 };
    setDadosDiarios(newDados);
  };

  return (
    <AppLayout title="Radar de Lucro">
      <div className="space-y-6 max-w-5xl">
        {/* Zona indicator */}
        <div
          className="animate-fade-up"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className={`rounded-xl border p-6 shadow-sm ${zona.bg}`}>
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${zona.bg}`}>
                <ZonaIcon className={`h-7 w-7 ${zona.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Atual</p>
                <h2 className={`text-xl font-bold ${zona.color}`}>{zona.label}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Média diária: <strong className="text-foreground">R$ {mediaDiaria.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                  {" "}| Meta mínima: R$ {metaDiaria.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  {" "}| Meta ideal: R$ {metaIdeal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Config */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="animate-fade-up rounded-xl border bg-card p-4 shadow-sm"
            style={{ animationDelay: "80ms", opacity: 0, animationFillMode: "forwards" }}
          >
            <Label className="text-xs text-muted-foreground">Faturamento Meta Mensal</Label>
            <Input
              type="number"
              value={faturamentoMensal}
              onChange={(e) => setFaturamentoMensal(parseFloat(e.target.value) || 0)}
              className="mt-1.5"
            />
          </div>
          <div
            className="animate-fade-up rounded-xl border bg-card p-4 shadow-sm"
            style={{ animationDelay: "140ms", opacity: 0, animationFillMode: "forwards" }}
          >
            <Label className="text-xs text-muted-foreground">Custos Fixos Mensais</Label>
            <Input
              type="number"
              value={custoFixo}
              onChange={(e) => setCustoFixo(parseFloat(e.target.value) || 0)}
              className="mt-1.5"
            />
          </div>
          <div
            className="animate-fade-up rounded-xl border bg-card p-4 shadow-sm"
            style={{ animationDelay: "200ms", opacity: 0, animationFillMode: "forwards" }}
          >
            <Label className="text-xs text-muted-foreground">Custos Variáveis Mensais</Label>
            <Input
              type="number"
              value={custoVariavel}
              onChange={(e) => setCustoVariavel(parseFloat(e.target.value) || 0)}
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Chart */}
        <div
          className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm"
          style={{ animationDelay: "260ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Faturamento Diário</h3>
              <p className="text-xs text-muted-foreground">Acompanhe seu desempenho vs metas</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-0.5 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Meta mínima</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-0.5 rounded-full bg-success" />
                <span className="text-muted-foreground">Meta ideal</span>
              </div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosDiarios}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 12%, 88%)" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="hsl(200, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(200, 10%, 46%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Faturamento"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(200, 12%, 88%)", fontSize: "12px" }}
                />
                <ReferenceLine y={metaDiaria} stroke="hsl(0, 72%, 51%)" strokeDasharray="4 4" strokeWidth={1.5} />
                <ReferenceLine y={metaIdeal} stroke="hsl(152, 60%, 42%)" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {dadosDiarios.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.valor >= metaIdeal
                          ? "hsl(152, 60%, 42%)"
                          : entry.valor >= metaDiaria
                          ? "hsl(43, 80%, 52%)"
                          : "hsl(0, 72%, 51%)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily input */}
        <div
          className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm"
          style={{ animationDelay: "340ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <h3 className="text-sm font-semibold mb-3">Inserir Faturamento Diário</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {dadosDiarios.map((d, i) => (
              <div key={i}>
                <Label className="text-xs text-muted-foreground">{d.dia}</Label>
                <Input
                  type="number"
                  value={d.valor}
                  onChange={(e) => handleDiaChange(i, e.target.value)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Semana", value: `R$ ${totalSemana.toLocaleString("pt-BR")}`, color: "text-primary" },
            { label: "Média Diária", value: `R$ ${mediaDiaria.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, color: zona.color },
            { label: "Projeção Mensal", value: `R$ ${(mediaDiaria * diasUteisMes).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, color: "text-foreground" },
            { label: "Lucro Projetado", value: `R$ ${(mediaDiaria * diasUteisMes - custoTotal).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, color: mediaDiaria * diasUteisMes - custoTotal > 0 ? "text-success" : "text-destructive" },
          ].map((item, i) => (
            <div
              key={i}
              className="animate-fade-up rounded-xl border bg-card p-4 shadow-sm"
              style={{ animationDelay: `${420 + i * 60}ms`, opacity: 0, animationFillMode: "forwards" }}
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-lg font-bold tabular-nums mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default RadarLucro;
