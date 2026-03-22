import { AppLayout } from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Megaphone, Lightbulb, ArrowRight } from "lucide-react";

const tools = [
  {
    title: "Planejamento de Conteúdo",
    description: "Calendário estratégico de posts, stories e reels para atrair pacientes qualificados.",
    icon: CalendarDays,
    url: "/marketing/conteudo",
  },
  {
    title: "Leads por Origem",
    description: "Descubra de onde vêm seus melhores pacientes: Google, Instagram, indicação ou anúncios.",
    icon: MapPin,
    url: "/marketing/leads-origem",
  },
  {
    title: "Campanhas",
    description: "Crie e acompanhe campanhas de captação com metas, investimento e retorno.",
    icon: Megaphone,
    url: "/marketing/campanhas",
  },
  {
    title: "Sugestões Estratégicas",
    description: "Recomendações inteligentes de ações de marketing baseadas no perfil da sua clínica.",
    icon: Lightbulb,
    url: "/marketing/sugestoes",
  },
];

const Marketing = () => {
  return (
    <AppLayout title="Marketing" subtitle="Atraia pacientes qualificados">
      <div className="max-w-3xl space-y-6">
        <div className="animate-fade-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estratégias de atração e conteúdo para posicionar sua clínica como referência e atrair pacientes que valorizam qualidade.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool, i) => (
            <Link
              key={tool.title}
              to={tool.url}
              className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
              style={{
                animationDelay: `${100 + i * 80}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <tool.icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-sm font-semibold font-display mb-1">{tool.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Marketing;
