import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Calculator, Target, Info, Plus, Trash2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Calculadora data
interface Procedimento {
  nome: string;
  custo: string;
}

const radarData = [
  { dia: "01", faturamento: 3200 },
  { dia: "02", faturamento: 4100 },
  { dia: "03", faturamento: 2800 },
  { dia: "04", faturamento: 5200 },
  { dia: "05", faturamento: 3900 },
  { dia: "06", faturamento: 4600 },
  { dia: "07", faturamento: 0 },
  { dia: "08", faturamento: 4800 },
  { dia: "09", faturamento: 3100 },
  { dia: "10", faturamento: 5500 },
  { dia: "11", faturamento: 4200 },
  { dia: "12", faturamento: 3600 },
  { dia: "13", faturamento: 6100 },
  { dia: "14", faturamento: 0 },
  { dia: "15", faturamento: 4400 },
];

const metaDiaria = 4545;
const custoFixoDiario = 2727;

const Financas = () => {
  const navigate = useNavigate();

  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([
    { nome: "Limpeza", custo: "45" },
    { nome: "Restauração Resina", custo: "60" },
    { nome: "Canal", custo: "180" },
    { nome: "Coroa Porcelana", custo: "350" },
    { nome: "Implante Unitário", custo: "800" },
  ]);
  const [novo, setNovo] = useState({ nome: "", custo: "" });

  const multiplicadorMinimo = 2.38;
  const multiplicadorIdeal = 3.30;

  const addProcedimento = () => {
    if (novo.nome && novo.custo) {
      setProcedimentos([...procedimentos, novo]);
      setNovo({ nome: "", custo: "" });
    }
  };

  return (
    <AppLayout title="Finanças">
      <div className="max-w-5xl">
        <Tabs defaultValue="calculadora" className="space-y-5">
          <TabsList
            className="animate-fade-up"
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            <TabsTrigger value="calculadora" className="gap-1.5">
              <Calculator className="h-3.5 w-3.5" />
              Calculadora
            </TabsTrigger>
            <TabsTrigger value="radar" className="gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Radar de Lucro
            </TabsTrigger>
          </TabsList>

          {/* CALCULADORA */}
          <TabsContent value="calculadora" className="space-y-5">
            <Card
              className="animate-fade-up p-5"
              style={{ animationDelay: "60ms", opacity: 0, animationFillMode: "forwards" }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Calculadora de Sobrevivência</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Multiplicadores: <strong>×2,38</strong> (mínimo) e <strong>×3,30</strong> (ideal para crescimento).
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-end mb-4">
                <div className="flex-1">
                  <Label className="text-xs">Procedimento</Label>
                  <Input
                    placeholder="Ex: Clareamento"
                    value={novo.nome}
                    onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs">Custo (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={novo.custo}
                    onChange={(e) => setNovo({ ...novo, custo: e.target.value })}
                  />
                </div>
                <Button onClick={addProcedimento} size="sm" className="shrink-0 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-5 gap-0 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                  <div>Procedimento</div>
                  <div className="text-right">Custo</div>
                  <div className="text-right">Mínimo</div>
                  <div className="text-right">Ideal</div>
                  <div className="text-right">Margem</div>
                </div>
                {procedimentos.map((proc, i) => {
                  const custo = parseFloat(proc.custo) || 0;
                  const minimo = custo * multiplicadorMinimo;
                  const ideal = custo * multiplicadorIdeal;
                  const margem = ideal - custo;
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-5 gap-0 px-4 py-3 items-center border-t transition-colors hover:bg-muted/20 group"
                    >
                      <div className="text-sm font-medium">{proc.nome}</div>
                      <div className="text-right text-sm tabular-nums text-muted-foreground">
                        R$ {custo.toFixed(2)}
                      </div>
                      <div className="text-right text-sm tabular-nums font-medium text-warning">
                        R$ {minimo.toFixed(2)}
                      </div>
                      <div className="text-right text-sm tabular-nums font-semibold text-success">
                        R$ {ideal.toFixed(2)}
                      </div>
                      <div className="text-right flex items-center justify-end gap-2">
                        <span className="text-sm tabular-nums text-success font-medium">
                          R$ {margem.toFixed(2)}
                        </span>
                        <button
                          onClick={() => setProcedimentos(procedimentos.filter((_, j) => j !== i))}
                          className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* RADAR DE LUCRO */}
          <TabsContent value="radar" className="space-y-5">
            <div
              className="animate-fade-up grid gap-4 sm:grid-cols-3"
              style={{ opacity: 0, animationFillMode: "forwards" }}
            >
              {[
                { label: "Meta Diária", value: `R$ ${metaDiaria.toLocaleString("pt-BR")}`, color: "text-success" },
                { label: "Custo Fixo/Dia", value: `R$ ${custoFixoDiario.toLocaleString("pt-BR")}`, color: "text-warning" },
                { label: "Faturamento Médio", value: `R$ ${Math.round(radarData.filter(d => d.faturamento > 0).reduce((a, b) => a + b.faturamento, 0) / radarData.filter(d => d.faturamento > 0).length).toLocaleString("pt-BR")}`, color: "text-primary" },
              ].map((item, i) => (
                <Card key={i} className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value}</p>
                </Card>
              ))}
            </div>

            <Card
              className="animate-fade-up p-5"
              style={{ animationDelay: "80ms", opacity: 0, animationFillMode: "forwards" }}
            >
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                Radar de Lucro — Março 2026
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Faturamento diário vs meta e custo fixo
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={radarData}>
                    <defs>
                      <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Faturamento"]}
                    />
                    <ReferenceLine y={metaDiaria} stroke="hsl(var(--success))" strokeDasharray="6 3" label={{ value: "Meta", position: "right", fontSize: 10, fill: "hsl(var(--success))" }} />
                    <ReferenceLine y={custoFixoDiario} stroke="hsl(var(--destructive))" strokeDasharray="6 3" label={{ value: "Custo Fixo", position: "right", fontSize: 10, fill: "hsl(var(--destructive))" }} />
                    <Area type="monotone" dataKey="faturamento" stroke="hsl(var(--chart-1))" fill="url(#colorFat)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Financas;
