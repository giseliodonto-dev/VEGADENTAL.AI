import { AppLayout } from "@/components/AppLayout";
import { CalendarDays, MapPin, Megaphone, Lightbulb } from "lucide-react";

const tools = [
  {
    title: "Planejamento de Conteúdo",
    description: "Calendário estratégico de posts, stories e reels para atrair pacientes qualificados.",
    icon: CalendarDays,
    soon: true,
  },
  {
    title: "Leads por Origem",
    description: "Descubra de onde vêm seus melhores pacientes: Google, Instagram, indicação ou anúncios.",
    icon: MapPin,
    soon: true,
  },
  {
    title: "Campanhas",
    description: "Crie e acompanhe campanhas de captação com metas, investimento e retorno.",
    icon: Megaphone,
    soon: true,
  },
  {
    title: "Sugestões Estratégicas",
    description: "Recomendações inteligentes de ações de marketing baseadas no perfil da sua clínica.",
    icon: Lightbulb,
    soon: true,
  },
];

const Marketing = () => {
  return (
    <AppLayout title="Marketing" subtitle="Atraia pacientes qualificados">
      <div className="max-w-3xl space-y-6">
        <div
          className="animate-fade-up"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estratégias de atração e conteúdo para posicionar sua clínica como referência e atrair pacientes que valorizam qualidade.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool, i) => (
            <div
              key={tool.title}
              className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm opacity-60"
              style={{
                animationDelay: `${100 + i * 80}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-marketing/10 text-marketing">
                  <tool.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Em breve
                </span>
              </div>
              <h3 className="text-sm font-semibold font-display mb-1">{tool.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Marketing;
