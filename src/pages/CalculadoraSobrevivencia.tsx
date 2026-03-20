import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Calculator, ArrowRight, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Procedimento {
  nome: string;
  custo: string;
}

const CalculadoraSobrevivencia = () => {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([
    { nome: "Limpeza", custo: "45" },
    { nome: "Restauração Resina", custo: "60" },
    { nome: "Canal", custo: "180" },
    { nome: "Coroa Porcelana", custo: "350" },
    { nome: "Implante Unitário", custo: "800" },
  ]);

  const [novoProcedimento, setNovoProcedimento] = useState({ nome: "", custo: "" });

  const multiplicadorMinimo = 2.38;
  const multiplicadorIdeal = 3.30;

  const addProcedimento = () => {
    if (novoProcedimento.nome && novoProcedimento.custo) {
      setProcedimentos([...procedimentos, novoProcedimento]);
      setNovoProcedimento({ nome: "", custo: "" });
    }
  };

  const removeProcedimento = (index: number) => {
    setProcedimentos(procedimentos.filter((_, i) => i !== index));
  };

  return (
    <AppLayout title="Calculadora de Sobrevivência">
      <div className="space-y-6 max-w-4xl">
        {/* Explanation */}
        <div
          className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Como funciona</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Insira o <strong>custo real</strong> de cada procedimento. A calculadora aplica dois
                multiplicadores: <strong>×2,38</strong> (preço mínimo para cobrir custos + margem de
                segurança) e <strong>×3,30</strong> (preço ideal para crescimento sustentável e
                reinvestimento).
              </p>
            </div>
          </div>
        </div>

        {/* Add procedure */}
        <div
          className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm"
          style={{ animationDelay: "80ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <h3 className="text-sm font-semibold mb-3">Adicionar Procedimento</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-xs">Nome</Label>
              <Input
                placeholder="Ex: Clareamento"
                value={novoProcedimento.nome}
                onChange={(e) => setNovoProcedimento({ ...novoProcedimento, nome: e.target.value })}
              />
            </div>
            <div className="w-36">
              <Label className="text-xs">Custo (R$)</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={novoProcedimento.custo}
                onChange={(e) => setNovoProcedimento({ ...novoProcedimento, custo: e.target.value })}
              />
            </div>
            <Button onClick={addProcedimento} size="sm" className="shrink-0">
              Adicionar
            </Button>
          </div>
        </div>

        {/* Pricing table */}
        <div
          className="animate-fade-up rounded-xl border bg-card shadow-sm overflow-hidden"
          style={{ animationDelay: "160ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="p-5 pb-0">
            <h3 className="text-sm font-semibold">Tabela de Precificação</h3>
            <p className="text-xs text-muted-foreground">Seus procedimentos com preços mínimo e ideal</p>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-5 gap-0 px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/30">
              <div className="col-span-1">Procedimento</div>
              <div className="text-right">Custo</div>
              <div className="text-right">
                <Tooltip>
                  <TooltipTrigger className="inline-flex items-center gap-1">
                    Mínimo (×2,38)
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>Preço mínimo para cobrir custos com margem de segurança</TooltipContent>
                </Tooltip>
              </div>
              <div className="text-right">
                <Tooltip>
                  <TooltipTrigger className="inline-flex items-center gap-1">
                    Ideal (×3,30)
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>Preço ideal para crescimento sustentável</TooltipContent>
                </Tooltip>
              </div>
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
                  className="grid grid-cols-5 gap-0 px-5 py-3 items-center border-b last:border-b-0 transition-colors hover:bg-muted/20 group"
                >
                  <div className="col-span-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{proc.nome}</span>
                  </div>
                  <div className="text-right text-sm tabular-nums text-muted-foreground">
                    R$ {custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-right text-sm tabular-nums font-medium text-warning">
                    R$ {minimo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-right text-sm tabular-nums font-semibold text-success">
                    R$ {ideal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-right flex items-center justify-end gap-2">
                    <span className="text-sm tabular-nums text-success font-medium">
                      R$ {margem.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => removeProcedimento(i)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:underline transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CalculadoraSobrevivencia;
