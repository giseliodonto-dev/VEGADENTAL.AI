import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Clock, Target, DollarSign, Calendar, ShieldCheck } from "lucide-react";

interface CustoItem {
  nome: string;
  valor: string;
}

const custosIniciais: CustoItem[] = [
  { nome: "Aluguel", valor: "" },
  { nome: "Energia Elétrica", valor: "" },
  { nome: "Água", valor: "" },
  { nome: "Internet / Telefone", valor: "" },
  { nome: "Materiais de Consumo", valor: "" },
  { nome: "Esterilização", valor: "" },
  { nome: "Funcionários (Salários + Encargos)", valor: "" },
  { nome: "Contador", valor: "" },
  { nome: "Marketing", valor: "" },
  { nome: "Manutenção de Equipamentos", valor: "" },
  { nome: "Descartáveis", valor: "" },
  { nome: "Software / Sistemas", valor: "" },
];

const HoraClinica = () => {
  const [custos, setCustos] = useState<CustoItem[]>(custosIniciais);
  const [novoCusto, setNovoCusto] = useState({ nome: "", valor: "" });
  const [proLabore, setProLabore] = useState("");
  const [impostos, setImpostos] = useState("15");
  const [diasMes, setDiasMes] = useState("22");
  const [horasDia, setHorasDia] = useState("8");

  const totalCustos = custos.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0);
  const proLaboreNum = parseFloat(proLabore) || 0;
  const impostosPercent = parseFloat(impostos) || 0;
  const diasNum = parseFloat(diasMes) || 1;
  const horasNum = parseFloat(horasDia) || 1;

  const totalBruto = totalCustos + proLaboreNum;
  const totalComImpostos = totalBruto * (1 + impostosPercent / 100);
  const horaClinica = totalComImpostos / (diasNum * horasNum);
  const horaClinicaIdeal = horaClinica * 1.3;

  const updateCusto = (index: number, valor: string) => {
    const updated = [...custos];
    updated[index] = { ...updated[index], valor };
    setCustos(updated);
  };

  const addCusto = () => {
    if (novoCusto.nome) {
      setCustos([...custos, { nome: novoCusto.nome, valor: novoCusto.valor }]);
      setNovoCusto({ nome: "", valor: "" });
    }
  };

  const removeCusto = (index: number) => {
    setCustos(custos.filter((_, i) => i !== index));
  };

  const temResultado = totalCustos > 0 || proLaboreNum > 0;

  return (
    <AppLayout title="Hora Clínica Real">
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div
          className="animate-fade-up text-center py-6"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 mb-4">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium tracking-widest uppercase text-accent">
              Rota de Lucro VEGA
            </span>
          </div>
          <h1 className="text-2xl font-light tracking-tight">
            Sua Rota de Lucro <span className="font-semibold text-accent">VEGA</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-light">
            Descubra o valor real da sua hora clínica e precifique com inteligência
          </p>
        </div>

        {/* Bloco 1 — Custos */}
        <Card
          className="animate-fade-up p-6"
          style={{ animationDelay: "60ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Custos Fixos e Variáveis</h2>
              <p className="text-xs text-muted-foreground font-light">
                Preencha seus custos mensais para calcular sua hora clínica
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {custos.map((custo, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <div className="flex-1">
                  <Label className="text-xs font-light text-muted-foreground">{custo.nome}</Label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={custo.valor}
                    onChange={(e) => updateCusto(i, e.target.value)}
                    className="font-light"
                  />
                </div>
                {i >= custosIniciais.length && (
                  <button
                    onClick={() => removeCusto(i)}
                    className="mt-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-end gap-2 mt-4 pt-4 border-t border-border/50">
            <div className="flex-1">
              <Label className="text-xs font-light">Outro custo</Label>
              <Input
                placeholder="Nome do custo"
                value={novoCusto.nome}
                onChange={(e) => setNovoCusto({ ...novoCusto, nome: e.target.value })}
                className="font-light"
              />
            </div>
            <div className="w-32">
              <Label className="text-xs font-light">Valor (R$)</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={novoCusto.valor}
                onChange={(e) => setNovoCusto({ ...novoCusto, valor: e.target.value })}
                className="font-light"
              />
            </div>
            <Button
              onClick={addCusto}
              size="sm"
              className="shrink-0 gap-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-light">Total de Custos Mensais</span>
            <span className="text-sm font-semibold tabular-nums text-accent">
              R$ {totalCustos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        {/* Bloco 2 — Pró-labore */}
        <Card
          className="animate-fade-up p-6"
          style={{ animationDelay: "120ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Target className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Meta de Pró-labore</h2>
              <p className="text-xs text-muted-foreground font-light">
                Quanto você deseja de lucro líquido mensal
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-light text-muted-foreground">Pró-labore Desejado (R$)</Label>
              <Input
                type="number"
                placeholder="Ex: 15000"
                value={proLabore}
                onChange={(e) => setProLabore(e.target.value)}
                className="font-light text-lg"
              />
            </div>
            <div>
              <Label className="text-xs font-light text-muted-foreground">Impostos Estimados (%)</Label>
              <Input
                type="number"
                placeholder="Ex: 15"
                value={impostos}
                onChange={(e) => setImpostos(e.target.value)}
                className="font-light text-lg"
              />
            </div>
          </div>
        </Card>

        {/* Bloco 3 — Capacidade Operacional */}
        <Card
          className="animate-fade-up p-6"
          style={{ animationDelay: "180ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Calendar className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Capacidade Operacional</h2>
              <p className="text-xs text-muted-foreground font-light">
                Sua disponibilidade real de atendimento
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-light text-muted-foreground">Dias Trabalhados / Mês</Label>
              <Input
                type="number"
                placeholder="22"
                value={diasMes}
                onChange={(e) => setDiasMes(e.target.value)}
                className="font-light text-lg"
              />
            </div>
            <div>
              <Label className="text-xs font-light text-muted-foreground">Horas na Cadeira / Dia</Label>
              <Input
                type="number"
                placeholder="8"
                value={horasDia}
                onChange={(e) => setHorasDia(e.target.value)}
                className="font-light text-lg"
              />
            </div>
          </div>
        </Card>

        {/* Resultado */}
        {temResultado && (
          <Card
            className="animate-fade-up p-6 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent"
            style={{ animationDelay: "240ms", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                <ShieldCheck className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-semibold tracking-widest uppercase text-accent">
                  Rota de Lucro VEGA
                </span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-light mb-1">Sua Hora Clínica Real</p>
                <p className="text-4xl font-light tabular-nums text-accent">
                  R$ {horaClinica.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-base text-muted-foreground font-light">/hora</span>
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-accent/10">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">Hora Ideal (×1.3)</p>
                  <p className="text-lg font-semibold tabular-nums text-success">
                    R$ {horaClinicaIdeal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">Faturamento Necessário</p>
                  <p className="text-lg font-semibold tabular-nums">
                    R$ {totalComImpostos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">Horas / Mês</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {(diasNum * horasNum).toFixed(0)}h
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default HoraClinica;
