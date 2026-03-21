import { AppLayout } from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { Calculator, ArrowRight, PieChart, Target, TrendingUp } from "lucide-react";

const tools = [
  {
    title: "Hora Clínica Real",
    description: "Calcule o valor real da sua hora na cadeira com base em custos, metas e capacidade.",
    icon: Calculator,
    url: "/gestao/hora-clinica",
  },
  {
    title: "Radar de Lucro",
    description: "Visualize se sua clínica está na zona de segurança ou risco operacional.",
    icon: PieChart,
    url: "#",
    soon: true,
  },
  {
    title: "Metas Mensais",
    description: "Defina e acompanhe metas de faturamento, atendimentos e conversão.",
    icon: Target,
    url: "#",
    soon: true,
  },
  {
    title: "KPIs da Clínica",
    description: "Indicadores essenciais: ocupação de agenda, ticket médio, taxa de retorno.",
    icon: TrendingUp,
    url: "#",
    soon: true,
  },
];

const Gestao = () => {
  return (
    <AppLayout title="Gestão" subtitle="Domine os números do seu negócio">
      <div className="max-w-3xl space-y-6">
        <div
          className="animate-fade-up"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Visão de CEO para sua clínica. Entenda seus números, defina metas e tome decisões baseadas em dados, não em achismo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool, i) => {
            const Card = (
              <div
                key={tool.title}
                className={`animate-fade-up group rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 ${
                  tool.soon ? "opacity-60" : "hover:shadow-md hover:border-gestao/30 cursor-pointer"
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
