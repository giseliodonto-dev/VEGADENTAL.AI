import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, ClipboardList, Repeat, ShieldCheck, Wrench } from "lucide-react";

const checklists = [
  {
    titulo: "Abertura do Consultório",
    icon: ClipboardList,
    items: [
      { label: "Ligar equipamentos e ar-condicionado", done: true },
      { label: "Verificar agenda do dia", done: true },
      { label: "Checar estoque de materiais", done: false },
      { label: "Preparar sala de atendimento", done: false },
      { label: "Confirmar pacientes por WhatsApp", done: false },
    ],
  },
  {
    titulo: "Fechamento do Consultório",
    icon: ShieldCheck,
    items: [
      { label: "Esterilizar instrumentos", done: false },
      { label: "Registrar procedimentos do dia", done: false },
      { label: "Desligar equipamentos", done: false },
      { label: "Verificar agenda de amanhã", done: false },
      { label: "Fechar caixa financeiro", done: false },
    ],
  },
  {
    titulo: "Manutenção Semanal",
    icon: Wrench,
    items: [
      { label: "Limpeza profunda do compressor", done: false },
      { label: "Teste do autoclave", done: false },
      { label: "Inventário de materiais", done: false },
      { label: "Backup de dados", done: false },
    ],
  },
  {
    titulo: "Ciclo de Retenção de Pacientes",
    icon: Repeat,
    items: [
      { label: "Enviar pesquisa de satisfação", done: false },
      { label: "Follow-up pós-procedimento (24h)", done: false },
      { label: "Lembrete de retorno (30 dias)", done: false },
      { label: "Campanha de reativação (90 dias)", done: false },
    ],
  },
];

const Processos = () => {
  return (
    <AppLayout title="Processos — Checklists">
      <div className="space-y-5 max-w-4xl">
        <p
          className="animate-fade-up text-sm text-muted-foreground"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          Checklists operacionais para padronizar a rotina da clínica.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {checklists.map((checklist, i) => (
            <Card
              key={i}
              className="animate-fade-up p-5 transition-shadow hover:shadow-md"
              style={{
                animationDelay: `${80 + i * 60}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <checklist.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold">{checklist.titulo}</h3>
              </div>
              <div className="space-y-2">
                {checklist.items.map((item, j) => (
                  <label
                    key={j}
                    className="flex items-center gap-2.5 text-xs cursor-pointer group"
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-accent transition-colors" />
                    )}
                    <span className={item.done ? "line-through text-muted-foreground" : "text-foreground"}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-[10px] text-muted-foreground">
                  {checklist.items.filter((i) => i.done).length}/{checklist.items.length} concluídos
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Processos;
