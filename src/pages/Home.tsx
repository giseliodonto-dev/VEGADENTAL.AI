import { AppLayout } from "@/components/AppLayout";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Megaphone,
  BarChart3,
  Crown,
  ArrowRight,
  Zap,
  Compass,
} from "lucide-react";

const pillars = [
  {
    title: "Vendas",
    subtitle: "Converta mais pacientes em tratamentos",
    description: "Ferramentas de decisão, scripts de venda e estratégias para aumentar sua taxa de conversão.",
    icon: TrendingUp,
    url: "/vendas",
    colorClass: "bg-vendas/10 text-vendas",
    borderClass: "hover:border-vendas/30",
  },
  {
    title: "Marketing",
    subtitle: "Atraia pacientes qualificados",
    description: "Roteiros de conteúdo, estratégias de atração e posicionamento para redes sociais.",
    icon: Megaphone,
    url: "/marketing",
    colorClass: "bg-marketing/10 text-marketing",
    borderClass: "hover:border-marketing/30",
  },
  {
    title: "Gestão",
    subtitle: "Domine os números do seu negócio",
    description: "Indicadores financeiros, calculadoras estratégicas e visão de CEO para sua clínica.",
    icon: BarChart3,
    url: "/gestao",
    colorClass: "bg-gestao/10 text-gestao",
    borderClass: "hover:border-gestao/30",
  },
  {
    title: "Autoridade",
    subtitle: "Construa uma marca poderosa",
    description: "Score de presença digital, posicionamento premium e estratégias de diferenciação.",
    icon: Crown,
    url: "/autoridade",
    colorClass: "bg-autoridade/10 text-autoridade",
    borderClass: "hover:border-autoridade/30",
  },
];

const Home = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Hero */}
        <div
          className="animate-fade-up text-center space-y-3 pt-6"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-vendas/10 px-3 py-1 text-xs font-medium text-vendas">
            <Zap className="h-3 w-3" />
            Inteligência Estratégica para Dentistas
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight">
            VEGA Dental AI
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            Seu gestor estratégico com visão de CEO. Pare de só atender e comece a construir um negócio lucrativo.
          </p>
        </div>

        {/* Pillar cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pillars.map((pillar, i) => (
            <Link
              key={pillar.title}
              to={pillar.url}
              className={`animate-fade-up group rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md ${pillar.borderClass}`}
              style={{
                animationDelay: `${150 + i * 80}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${pillar.colorClass}`}>
                  <pillar.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-200 translate-x-0 group-hover:translate-x-1" />
              </div>
              <h3 className="text-base font-semibold font-display mb-1">{pillar.title}</h3>
              <p className="text-xs font-medium text-muted-foreground mb-2">{pillar.subtitle}</p>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">{pillar.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
