import { AppLayout } from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Filter, Users, Handshake, Bell } from "lucide-react";

const tools = [
  {
    title: "Perguntas de Decisão",
    description: "O oráculo VEGA que transforma objeções em fechamentos com perguntas estratégicas.",
    icon: MessageSquare,
    url: "/vendas/perguntas-decisao",
  },
  {
    title: "Funil de Vendas",
    description: "Visualize cada etapa da jornada do paciente: do primeiro contato ao fechamento.",
    icon: Filter,
    url: "/vendas/funil",
  },
  {
    title: "Controle de Leads",
    description: "Gerencie contatos interessados, converta em pacientes e acompanhe oportunidades.",
    icon: Users,
    url: "/leads",
  },
  {
    title: "Taxa de Conversão",
    description: "Acompanhe quantos orçamentos se transformam em tratamentos fechados.",
    icon: Handshake,
    url: "#",
    soon: true,
  },
  {
    title: "Follow-up Inteligente",
    description: "Sugestões automáticas de recontato para não perder nenhum paciente indeciso.",
    icon: Bell,
    url: "#",
    soon: true,
  },
];

const Vendas = () => {
  return (
    <AppLayout title="Vendas" subtitle="Converta mais pacientes em tratamentos">
      <div className="max-w-3xl space-y-6">
        <div
          className="animate-fade-up"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ferramentas estratégicas para aumentar sua taxa de conversão. Transforme objeções em oportunidades e orçamentos em tratamentos fechados.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool, i) => {
            const Card = (
              <div
                key={tool.title}
                className={`animate-fade-up group rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 ${
                  tool.soon ? "opacity-60" : "hover:shadow-md hover:border-vendas/30 cursor-pointer"
                }`}
                style={{
                  animationDelay: `${100 + i * 80}ms`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vendas/10 text-vendas">
                    <tool.icon className="h-4 w-4" />
                  </div>
                  {tool.soon ? (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Em breve
                    </span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-vendas transition-all duration-200" />
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

export default Vendas;
