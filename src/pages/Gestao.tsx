import { AppLayout } from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { Calculator, ArrowRight, CalendarCheck, DollarSign, Users, UserCog, BarChart3, Target } from "lucide-react";

const tools = [
  {
    title: "Metas Mensais",
    description: "Defina metas de faturamento, lucro e conversão para acompanhar o crescimento.",
    icon: Target,
    url: "/gestao/metas",
  },
  {
    title: "Hora Clínica Real",
    description: "Calcule o valor real da sua hora na cadeira com base em custos, metas e capacidade.",
    icon: Calculator,
    url: "/gestao/hora-clinica",
  },
  {
    title: "Agenda",
    description: "Controle de horários, ocupação e produtividade da cadeira clínica.",
    icon: CalendarCheck,
    url: "/gestao/agenda",
  },
  {
    title: "Finanças VEGA",
    description: "Análise estratégica da saúde financeira: lucro, margem, comparativos e direcionamentos.",
    icon: DollarSign,
    url: "/gestao/financas",
  },
  {
    title: "Pacientes",
    description: "Base de pacientes com histórico, valor gerado e potencial de reativação.",
    icon: Users,
    url: "/pacientes",
  },
  {
    title: "Equipe",
    description: "Gestão de colaboradores, produtividade individual e custo por profissional.",
    icon: UserCog,
    url: "/gestao/equipe",
  },
  {
    title: "Indicadores de Desempenho",
    description: "KPIs essenciais: ocupação de agenda, ticket médio, taxa de retorno e mais.",
    icon: BarChart3,
    url: "#",
    soon: true,
  },
];

const Gestao = () => {
  return (
    <AppLayout title="Gestão" subtitle="Domine os números do seu negócio">
      <div className="max-w-4xl space-y-6">
        <div
          className="animate-fade-up"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Visão de CEO para sua clínica. Entenda seus números, defina metas e tome decisões baseadas em dados, não em achismo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, i) => {
            const Card = (
              <div
                key={tool.title}
                className={`animate-fade-up group card-premium card-hover p-5 ${
                  tool.soon ? "opacity-60 !transform-none" : "hover:border-gestao/40 cursor-pointer"
                }`}
                style={{
                  animationDelay: `${100 + i * 80}ms`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gestao/10 text-gestao">
                    <tool.icon className="h-4 w-4" />
                  </div>
                  {tool.soon ? (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Em breve
                    </span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-gestao transition-all duration-200" />
                  )}
                </div>
                <h3 className="text-sm font-semibold font-display mb-1">{tool.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
              </div>
            );

            return tool.soon ? (
              <div key={tool.title}>{Card}</div>
            ) : (
              <Link key={tool.title} to={tool.url}>{Card}</Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Gestao;
