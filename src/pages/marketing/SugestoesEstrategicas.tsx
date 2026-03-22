import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, CheckCircle, Lightbulb, Megaphone, Target, TrendingUp, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  icon: React.ElementType;
  title: string;
  description: string;
  type: "success" | "warning" | "action";
  link?: string;
  linkLabel?: string;
}

const SugestoesEstrategicas = () => {
  const { clinicId } = useClinic();

  const { data: leads = [] } = useQuery({
    queryKey: ["suggestions-leads", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("leads").select("id, origin, status").eq("clinic_id", clinicId);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["suggestions-patients", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("patients").select("id, origin").eq("clinic_id", clinicId);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: funnel = [] } = useQuery({
    queryKey: ["suggestions-funnel", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("sales_funnel").select("id, stage").eq("clinic_id", clinicId);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["suggestions-campaigns", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("campaigns").select("id, status").eq("clinic_id", clinicId);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: contents = [] } = useQuery({
    queryKey: ["suggestions-content", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("content_calendar").select("id, status").eq("clinic_id", clinicId);
      return data || [];
    },
    enabled: !!clinicId,
  });

  // Generate suggestions based on data
  const suggestions: Suggestion[] = [];

  // 1. Lead volume
  const totalContacts = leads.length + patients.length;
  if (totalContacts === 0) {
    suggestions.push({
      icon: Users,
      title: "Cadastre seus primeiros leads",
      description: "Sem leads cadastrados, não é possível medir resultados. Comece registrando de onde vêm seus contatos.",
      type: "warning",
      link: "/leads",
      linkLabel: "Ir para Leads",
    });
  } else if (totalContacts < 10) {
    suggestions.push({
      icon: TrendingUp,
      title: "Baixo volume de leads",
      description: `Você tem apenas ${totalContacts} contatos. Considere investir em tráfego pago ou aumentar a frequência de conteúdo para atrair mais pacientes.`,
      type: "warning",
      link: "/marketing/campanhas",
      linkLabel: "Criar Campanha",
    });
  }

  // 2. Origin analysis
  const originCounts = new Map<string, number>();
  [...leads, ...patients].forEach((item) => {
    const origin = item.origin || "outros";
    originCounts.set(origin, (originCounts.get(origin) || 0) + 1);
  });

  if (originCounts.size > 0) {
    const sorted = Array.from(originCounts.entries()).sort((a, b) => b[1] - a[1]);
    const best = sorted[0];
    const originLabels: Record<string, string> = {
      instagram: "Instagram", google: "Google", indicacao: "Indicação",
      facebook: "Facebook", whatsapp: "WhatsApp", site: "Site", outros: "Outros",
    };

    if (best[0] === "indicacao" && best[1] > 3) {
      suggestions.push({
        icon: CheckCircle,
        title: "Indicação é sua principal fonte!",
        description: "Aproveite isso: crie um programa de indicação com benefícios para quem indica novos pacientes.",
        type: "success",
      });
    }

    if (best[0] === "instagram") {
      suggestions.push({
        icon: CheckCircle,
        title: "Instagram é seu melhor canal",
        description: `${best[1]} contatos vieram do Instagram. Aumente a frequência de Reels e Stories para ampliar o alcance.`,
        type: "success",
        link: "/marketing/conteudo",
        linkLabel: "Planejar Conteúdo",
      });
    }

    const worst = sorted[sorted.length - 1];
    if (sorted.length > 1 && worst[1] < best[1] * 0.2) {
      suggestions.push({
        icon: AlertTriangle,
        title: `${originLabels[worst[0]] || worst[0]} gera poucos leads`,
        description: `Apenas ${worst[1]} contatos vieram desta origem. Avalie se vale investir neste canal ou redirecione o investimento.`,
        type: "warning",
      });
    }
  }

  // 3. Content frequency
  if (contents.length === 0) {
    suggestions.push({
      icon: Calendar,
      title: "Nenhum conteúdo planejado",
      description: "Clínicas que publicam regularmente atraem até 3x mais pacientes. Comece planejando pelo menos 2 posts por semana.",
      type: "action",
      link: "/marketing/conteudo",
      linkLabel: "Planejar Conteúdo",
    });
  } else {
    const posted = contents.filter((c) => c.status === "postado").length;
    const rate = posted / contents.length;
    if (rate < 0.5) {
      suggestions.push({
        icon: AlertTriangle,
        title: "Muitos conteúdos sem publicar",
        description: `${contents.length - posted} conteúdos planejados ainda não foram postados. Consistência é chave para resultados no marketing.`,
        type: "warning",
        link: "/marketing/conteudo",
        linkLabel: "Ver Conteúdos",
      });
    }
  }

  // 4. Campaigns
  const activeCampaigns = campaigns.filter((c) => c.status === "ativa");
  if (campaigns.length === 0) {
    suggestions.push({
      icon: Megaphone,
      title: "Crie sua primeira campanha",
      description: "Campanhas de marketing ajudam a medir o retorno do seu investimento. Mesmo uma campanha orgânica no Instagram já gera dados valiosos.",
      type: "action",
      link: "/marketing/campanhas",
      linkLabel: "Criar Campanha",
    });
  } else if (activeCampaigns.length === 0) {
    suggestions.push({
      icon: AlertTriangle,
      title: "Nenhuma campanha ativa",
      description: "Todas as campanhas foram finalizadas. Considere criar uma nova campanha para manter o fluxo de novos pacientes.",
      type: "warning",
      link: "/marketing/campanhas",
      linkLabel: "Criar Campanha",
    });
  }

  // 5. Funnel conversion
  if (funnel.length > 5) {
    const funnelLeads = funnel.filter((f) => f.stage === "lead").length;
    const closed = funnel.filter((f) => f.stage === "fechado").length;
    const conversionRate = funnelLeads > 0 ? (closed / funnelLeads) * 100 : 0;
    if (conversionRate < 30) {
      suggestions.push({
        icon: Target,
        title: "Taxa de conversão baixa",
        description: `Apenas ${conversionRate.toFixed(0)}% dos leads do funil foram convertidos. Melhore o follow-up e a apresentação de tratamentos.`,
        type: "warning",
        link: "/vendas/funil",
        linkLabel: "Ver Funil",
      });
    } else {
      suggestions.push({
        icon: CheckCircle,
        title: "Boa taxa de conversão!",
        description: `${conversionRate.toFixed(0)}% dos leads foram convertidos. Continue com as boas práticas de vendas.`,
        type: "success",
      });
    }
  }

  // Default if no suggestions
  if (suggestions.length === 0) {
    suggestions.push({
      icon: Lightbulb,
      title: "Continue alimentando os dados",
      description: "Quanto mais dados você registrar (leads, conteúdos, campanhas), mais sugestões inteligentes o sistema gerará.",
      type: "action",
    });
  }

  const typeStyles = {
    success: "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30",
    warning: "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/30",
    action: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30",
  };

  const iconStyles = {
    success: "text-green-600",
    warning: "text-yellow-600",
    action: "text-blue-600",
  };

  return (
    <AppLayout title="Sugestões Estratégicas" subtitle="Seu consultor de marketing inteligente">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm text-muted-foreground mb-6">
          Análises automáticas baseadas nos dados da sua clínica. Quanto mais dados você registrar, mais precisas serão as sugestões.
        </p>

        {suggestions.map((s, i) => (
          <Card key={i} className={cn("transition-all hover:shadow-md", typeStyles[s.type])}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className={cn("mt-0.5", iconStyles[s.type])}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                  {s.link && (
                    <Button asChild variant="link" className="px-0 mt-2 h-auto">
                      <Link to={s.link}>
                        {s.linkLabel} <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default SugestoesEstrategicas;
