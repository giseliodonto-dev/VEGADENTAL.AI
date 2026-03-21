import { AppLayout } from "@/components/AppLayout";
import { Shield, Star, Globe, Award } from "lucide-react";

const tools = [
  {
    title: "Score de Autoridade",
    description: "Avalie sua presença digital e descubra como ser percebido como referência.",
    icon: Star,
    soon: true,
  },
  {
    title: "Posicionamento Premium",
    description: "Estratégias para se diferenciar e justificar preços acima da média.",
    icon: Shield,
    soon: true,
  },
  {
    title: "Presença Digital",
    description: "Checklist completo para Google, Instagram, YouTube e LinkedIn.",
    icon: Globe,
    soon: true,
  },
  {
    title: "Prova Social",
    description: "Como coletar e usar depoimentos, cases e antes/depois de forma estratégica.",
    icon: Award,
    soon: true,
  },
];

const Autoridade = () => {
  return (
    <AppLayout title="Autoridade" subtitle="Construa uma marca poderosa">
      <div className="max-w-3xl space-y-6">
        <div
          className="animate-fade-up"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Posicione-se como referência na sua região. Construa autoridade que atrai pacientes premium e justifica seu valor.
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
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-autoridade/10 text-autoridade">
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

export default Autoridade;
