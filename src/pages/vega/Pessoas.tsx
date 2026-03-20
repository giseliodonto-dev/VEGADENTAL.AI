import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Users, Target, Award, TrendingUp, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const team = [
  {
    nome: "Dr. Rafael Lima",
    cargo: "Clínico Geral",
    avatar: "RL",
    metas: [
      { label: "Atendimentos/mês", atual: 87, meta: 100 },
      { label: "Ticket médio", atual: 720, meta: 800 },
      { label: "Conversão", atual: 68, meta: 75 },
    ],
  },
  {
    nome: "Dra. Camila Rodrigues",
    cargo: "Ortodontista",
    avatar: "CR",
    metas: [
      { label: "Atendimentos/mês", atual: 62, meta: 80 },
      { label: "Ticket médio", atual: 950, meta: 1000 },
      { label: "Conversão", atual: 72, meta: 80 },
    ],
  },
  {
    nome: "Patrícia Mendes",
    cargo: "Recepcionista",
    avatar: "PM",
    metas: [
      { label: "Confirmações/dia", atual: 18, meta: 20 },
      { label: "Reativações/mês", atual: 12, meta: 15 },
      { label: "NPS atendimento", atual: 92, meta: 95 },
    ],
  },
];

const trainings = [
  { titulo: "NEPQ — Vendas Consultivas", status: "Em andamento", progresso: 65 },
  { titulo: "Atendimento Humanizado", status: "Concluído", progresso: 100 },
  { titulo: "Gestão Financeira para Dentistas", status: "Não iniciado", progresso: 0 },
];

const Pessoas = () => {
  return (
    <AppLayout title="Pessoas — Desempenho">
      <div className="space-y-6 max-w-5xl">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {team.map((member, i) => (
            <Card
              key={i}
              className="animate-fade-up p-5 transition-shadow hover:shadow-md"
              style={{
                animationDelay: `${80 + i * 60}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {member.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{member.nome}</p>
                  <p className="text-xs text-muted-foreground">{member.cargo}</p>
                </div>
              </div>
              <div className="space-y-3">
                {member.metas.map((meta, j) => {
                  const pct = Math.round((meta.atual / meta.meta) * 100);
                  return (
                    <div key={j}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{meta.label}</span>
                        <span className="font-medium tabular-nums">{meta.atual}/{meta.meta}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        <div
          className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm"
          style={{ animationDelay: "200ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-accent" />
            Trilha de Treinamentos
          </h3>
          <div className="space-y-3">
            {trainings.map((t, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.titulo}</p>
                  <p className="text-xs text-muted-foreground">{t.status}</p>
                </div>
                <div className="w-32">
                  <Progress value={t.progresso} className="h-1.5" />
                </div>
                <span className="text-xs font-medium tabular-nums w-10 text-right">{t.progresso}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Pessoas;
