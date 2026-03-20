import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Crown, Award, Globe, Instagram, Youtube, Star, ExternalLink } from "lucide-react";

const pillars = [
  {
    titulo: "Presença Digital",
    icon: Globe,
    score: 72,
    dicas: [
      "Google Meu Negócio otimizado com fotos atualizadas",
      "Responder todas as avaliações em até 24h",
      "Publicar 3-4 posts por semana no Instagram",
    ],
  },
  {
    titulo: "Prova Social",
    icon: Star,
    score: 58,
    dicas: [
      "Coletar depoimentos em vídeo após cada tratamento",
      "Criar galeria de antes/depois com autorização",
      "Solicitar avaliação no Google após cada atendimento",
    ],
  },
  {
    titulo: "Conteúdo Educativo",
    icon: Award,
    score: 85,
    dicas: [
      "Publicar 2 Reels educativos por semana",
      "Criar série 'Mitos e Verdades' sobre odontologia",
      "Fazer lives semanais tirando dúvidas",
    ],
  },
  {
    titulo: "Networking Profissional",
    icon: Crown,
    score: 45,
    dicas: [
      "Participar de pelo menos 1 congresso por trimestre",
      "Publicar artigos ou cases no LinkedIn",
      "Fazer parcerias com profissionais de saúde da região",
    ],
  },
];

const channels = [
  { nome: "Instagram", icon: Instagram, seguidores: "2.847", crescimento: "+12%", cor: "bg-pink-500/10 text-pink-600" },
  { nome: "YouTube", icon: Youtube, seguidores: "438", crescimento: "+28%", cor: "bg-red-500/10 text-red-600" },
  { nome: "Google", icon: Globe, seguidores: "4.8 ★", crescimento: "127 avaliações", cor: "bg-blue-500/10 text-blue-600" },
];

const Autoridade = () => {
  return (
    <AppLayout title="Autoridade — Marca Pessoal">
      <div className="space-y-6 max-w-5xl">
        {/* Canais */}
        <div
          className="animate-fade-up grid gap-4 sm:grid-cols-3"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          {channels.map((ch, i) => (
            <Card key={i} className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${ch.cor}`}>
                <ch.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{ch.nome}</p>
                <p className="text-lg font-bold tabular-nums">{ch.seguidores}</p>
                <p className="text-[10px] text-muted-foreground">{ch.crescimento}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Pilares */}
        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((p, i) => (
            <Card
              key={i}
              className="animate-fade-up p-5 transition-shadow hover:shadow-md"
              style={{
                animationDelay: `${100 + i * 60}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <p.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold">{p.titulo}</h3>
                </div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  p.score >= 80 ? "bg-success/10 text-success" : p.score >= 60 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                }`}>
                  {p.score}/100
                </div>
              </div>
              <ul className="space-y-2">
                {p.dicas.map((d, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Autoridade;
