import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { HeartHandshake, Star, MessageCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const scripts = [
  {
    etapa: "Recepção",
    icon: HeartHandshake,
    titulo: "Script de Boas-Vindas",
    texto: "Bom dia/tarde, [Nome]! Que bom ter você aqui. Meu nome é [Recepcionista], vou cuidar de você hoje. Pode ficar à vontade — deseja água ou café?",
  },
  {
    etapa: "Anamnese",
    icon: MessageCircle,
    titulo: "Perguntas de Conexão",
    texto: "Antes de começar, me conta: o que te trouxe aqui hoje? Tem algo que te incomoda no seu sorriso? Algum medo ou receio que gostaria de compartilhar?",
  },
  {
    etapa: "Apresentação do Plano",
    icon: Star,
    titulo: "Apresentação do Tratamento",
    texto: "Vou te mostrar exatamente o que encontramos e o melhor caminho para resolver. Temos [X] opções — vou explicar cada uma para você decidir com calma.",
  },
  {
    etapa: "Pós-Atendimento",
    icon: CheckCircle2,
    titulo: "Follow-up 24h",
    texto: "Olá [Nome]! Aqui é do consultório do Dr. [Nome]. Tudo bem com você após o procedimento de ontem? Qualquer dúvida, estamos à disposição!",
  },
  {
    etapa: "Reativação",
    icon: Clock,
    titulo: "Paciente Inativo",
    texto: "Olá [Nome]! Faz tempo que não nos vemos. Tudo bem? Lembrei de você porque já se passaram [X] meses desde sua última visita. Que tal agendarmos uma avaliação?",
  },
  {
    etapa: "Objeção",
    icon: AlertCircle,
    titulo: "Paciente com Dúvida",
    texto: "Entendo perfeitamente sua dúvida. Muitos pacientes sentem o mesmo antes de começar. Posso te mostrar casos parecidos com o seu para você ver o resultado?",
  },
];

const Atendimento = () => {
  return (
    <AppLayout title="Atendimento — Scripts">
      <div className="space-y-5 max-w-4xl">
        <p
          className="animate-fade-up text-sm text-muted-foreground"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          Scripts prontos para cada etapa da jornada do paciente.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {scripts.map((s, i) => (
            <Card
              key={i}
              className="animate-fade-up p-5 transition-shadow hover:shadow-md"
              style={{
                animationDelay: `${80 + i * 60}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{s.etapa}</p>
                  <p className="text-sm font-semibold">{s.titulo}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-3 italic">
                "{s.texto}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Atendimento;
