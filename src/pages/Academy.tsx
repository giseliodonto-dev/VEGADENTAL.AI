import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Play, TrendingUp, Megaphone, BarChart3, Compass, Users,
  Lightbulb, Clock, Sparkles,
} from "lucide-react";

type Category = "todos" | "como_usar" | "vendas" | "marketing" | "gestao" | "crescimento";

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: Category;
  videoUrl?: string;
}

const categoryMeta: Record<Exclude<Category, "todos">, { label: string; color: string; icon: React.ElementType; gradient: string }> = {
  como_usar: { label: "Como usar o VEGA", color: "text-primary", icon: Compass, gradient: "from-primary/20 to-primary/5" },
  vendas: { label: "Vendas", color: "text-vendas", icon: TrendingUp, gradient: "from-vendas/20 to-vendas/5" },
  marketing: { label: "Marketing", color: "text-marketing", icon: Megaphone, gradient: "from-marketing/20 to-marketing/5" },
  gestao: { label: "Gestão de Equipe", color: "text-gestao", icon: Users, gradient: "from-gestao/20 to-gestao/5" },
  crescimento: { label: "Crescimento", color: "text-autoridade", icon: Lightbulb, gradient: "from-autoridade/20 to-autoridade/5" },
};

const videos: Video[] = [
  { id: "1", title: "Primeiro acesso ao VEGA", description: "Configure sua clínica em 2 minutos", duration: "1:30", category: "como_usar" },
  { id: "2", title: "Cadastrando pacientes", description: "Cadastro rápido e completo", duration: "0:45", category: "como_usar" },
  { id: "3", title: "Usando o GPS estratégico", description: "Entenda o diagnóstico da sua clínica", duration: "1:15", category: "como_usar" },
  { id: "4", title: "Fechando mais orçamentos", description: "Técnica de apresentação que converte", duration: "1:45", category: "vendas" },
  { id: "5", title: "Follow-up que funciona", description: "Quando e como retomar contato", duration: "1:20", category: "vendas" },
  { id: "6", title: "Perguntas de decisão", description: "Use perguntas para guiar o paciente", duration: "0:55", category: "vendas" },
  { id: "7", title: "Instagram para dentistas", description: "Conteúdo que atrai pacientes certos", duration: "1:40", category: "marketing" },
  { id: "8", title: "Captação de leads", description: "De onde vêm seus melhores pacientes", duration: "1:10", category: "marketing" },
  { id: "9", title: "Campanhas que convertem", description: "ROI real no marketing odontológico", duration: "1:30", category: "marketing" },
  { id: "10", title: "Gestão de agenda", description: "Elimine buracos na agenda", duration: "0:50", category: "gestao" },
  { id: "11", title: "Metas da equipe", description: "Como definir e acompanhar metas", duration: "1:15", category: "gestao" },
  { id: "12", title: "Reunião de equipe eficiente", description: "Reunião de 15 min que resolve", duration: "1:00", category: "gestao" },
  { id: "13", title: "Ticket médio acima de R$5k", description: "Posicione-se como referência", duration: "1:50", category: "crescimento" },
  { id: "14", title: "Autoridade digital", description: "Construa presença que gera confiança", duration: "1:25", category: "crescimento" },
  { id: "15", title: "Escalar sem perder qualidade", description: "Crescimento sustentável da clínica", duration: "2:00", category: "crescimento" },
];

const categoryFilters: { value: Category; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "como_usar", label: "Como usar" },
  { value: "vendas", label: "Vendas" },
  { value: "marketing", label: "Marketing" },
  { value: "gestao", label: "Gestão" },
  { value: "crescimento", label: "Crescimento" },
];

function VideoCard({ video, onPlay }: { video: Video; onPlay: () => void }) {
  const meta = categoryMeta[video.category];
  const Icon = meta.icon;

  return (
    <Card className="card-hover group cursor-pointer overflow-hidden" onClick={onPlay}>
      {/* Thumbnail */}
      <div className={`relative h-36 bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
        <Icon className={`h-10 w-10 ${meta.color} opacity-30`} />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
        <Badge variant="secondary" className="absolute bottom-2 right-2 text-[10px] gap-1 bg-background/80 backdrop-blur-sm">
          <Clock className="h-3 w-3" />
          {video.duration}
        </Badge>
      </div>
      <CardContent className="p-4 space-y-1">
        <p className="text-sm font-semibold text-foreground leading-tight">{video.title}</p>
        <p className="text-xs text-muted-foreground">{video.description}</p>
        <Badge variant="outline" className={`text-[10px] ${meta.color} border-current/20 mt-1`}>
          {meta.label}
        </Badge>
      </CardContent>
    </Card>
  );
}

export default function Academy() {
  const [category, setCategory] = useState<Category>("todos");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const { clinicId } = useClinic();

  // Smart suggestions based on clinic data
  const { data: suggestions } = useQuery({
    queryKey: ["academy-suggestions", clinicId],
    queryFn: async () => {
      if (!clinicId) return { type: "onboarding" as const };

      const [funnelRes, leadsRes] = await Promise.all([
        supabase.from("sales_funnel").select("id, stage").eq("clinic_id", clinicId).in("stage", ["lead", "avaliacao"]),
        supabase.from("leads").select("id").eq("clinic_id", clinicId).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);

      const stagnant = (funnelRes.data?.length ?? 0) > 3;
      const fewLeads = (leadsRes.data?.length ?? 0) < 2;

      if (stagnant) return { type: "vendas" as const };
      if (fewLeads) return { type: "marketing" as const };
      return { type: "onboarding" as const };
    },
    enabled: !!clinicId,
  });

  const suggestedCategory = suggestions?.type === "vendas" ? "vendas" : suggestions?.type === "marketing" ? "marketing" : "como_usar";
  const suggestedVideos = videos.filter((v) => v.category === suggestedCategory).slice(0, 3);
  const suggestedLabel = suggestions?.type === "vendas"
    ? "Você tem pacientes parados no funil — melhore sua conversão"
    : suggestions?.type === "marketing"
      ? "Poucos leads esta semana — atraia mais pacientes"
      : "Comece por aqui";

  const filtered = category === "todos" ? videos : videos.filter((v) => v.category === category);

  return (
    <AppLayout title="VEGA Academy" subtitle="Treinamentos rápidos para sua equipe">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="rounded-xl bg-gradient-to-r from-primary/10 via-vendas/5 to-autoridade/10 p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground font-display">Aprenda em minutos. Aplique hoje.</h2>
          </div>
          <p className="text-sm text-muted-foreground">Vídeos curtos e diretos para você e sua equipe venderem mais e gerenciarem melhor.</p>
        </div>

        {/* Smart suggestions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-vendas" />
            <h3 className="text-sm font-semibold text-foreground">{suggestedLabel}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedVideos.map((v) => (
              <VideoCard key={v.id} video={v} onPlay={() => setSelectedVideo(v)} />
            ))}
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={category === f.value ? "default" : "outline"}
              className="text-xs h-8"
              onClick={() => setCategory(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} onPlay={() => setSelectedVideo(v)} />
          ))}
        </div>

        {/* Player dialog */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedVideo?.title}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              {selectedVideo?.videoUrl ? (
                <iframe src={selectedVideo.videoUrl} className="w-full h-full rounded-lg" allowFullScreen />
              ) : (
                <div className="text-center space-y-2">
                  <Play className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">Vídeo em breve</p>
                  <p className="text-xs text-muted-foreground/60">{selectedVideo?.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
