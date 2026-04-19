import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Phone,
  CalendarPlus,
  ChevronRight,
  User,
  Zap,
} from "lucide-react";
import { openWhatsApp as openWA } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Link } from "react-router-dom";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const STAGES = [
  { key: "lead", label: "Lead" },
  { key: "avaliacao", label: "Avaliação" },
  { key: "proposta", label: "Proposta" },
] as const;

const STAGE_NEXT: Record<string, { key: string; label: string }> = {
  lead: { key: "avaliacao", label: "Avaliação" },
  avaliacao: { key: "proposta", label: "Proposta" },
  proposta: { key: "fechado", label: "Fechado" },
};

interface StaleItem {
  id: string;
  stage: string;
  value: number | null;
  updated_at: string;
  patient: { id: string; name: string; phone: string | null } | null;
  responsible: { full_name: string | null } | null;
  days_stale: number;
  urgency: "alta" | "media" | "baixa";
  suggestion: string;
}

function getUrgencyAndSuggestion(stage: string, days: number): { urgency: StaleItem["urgency"]; suggestion: string } {
  if (stage === "proposta") {
    if (days >= 14) return { urgency: "alta", suggestion: "Proposta parada há 2+ semanas. Ligue agora e ofereça condição especial para fechar." };
    if (days >= 7) return { urgency: "alta", suggestion: "Proposta sem resposta há 1 semana. Envie mensagem perguntando se tem dúvidas." };
    return { urgency: "media", suggestion: "Proposta recente sem retorno. Faça follow-up por WhatsApp." };
  }
  if (stage === "avaliacao") {
    if (days >= 14) return { urgency: "alta", suggestion: "Paciente não retornou após avaliação. Ligue e reagende." };
    if (days >= 7) return { urgency: "media", suggestion: "Avaliação feita há 1 semana. Envie lembrete e destaque os benefícios." };
    return { urgency: "baixa", suggestion: "Avaliação recente. Acompanhe para garantir retorno." };
  }
  // lead
  if (days >= 14) return { urgency: "alta", suggestion: "Lead frio — sem contato há 2+ semanas. Tente uma última abordagem." };
  if (days >= 7) return { urgency: "media", suggestion: "Lead sem ação há 1 semana. Entre em contato e agende avaliação." };
  return { urgency: "baixa", suggestion: "Lead recente sem follow-up. Faça o primeiro contato." };
}

const urgencyConfig = {
  alta: { label: "Urgente", variant: "destructive" as const, color: "text-destructive" },
  media: { label: "Atenção", variant: "secondary" as const, color: "text-warning" },
  baixa: { label: "Normal", variant: "outline" as const, color: "text-muted-foreground" },
};

export default function FollowUpInteligente() {
  const { clinicId, loading: clinicLoading } = useClinic();
  const [items, setItems] = useState<StaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    fetchStaleItems();
  }, [clinicId]);

  async function fetchStaleItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales_funnel")
      .select("id, stage, value, updated_at, patient:patients!sales_funnel_patient_id_fkey(id, name, phone), responsible:profiles!sales_funnel_responsible_user_id_fkey(full_name)")
      .eq("clinic_id", clinicId!)
      .in("stage", ["lead", "avaliacao", "proposta"])
      .order("updated_at", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar dados do funil");
      console.error(error);
      setLoading(false);
      return;
    }

    const now = new Date();
    const stale: StaleItem[] = ((data as any) || [])
      .map((item: any) => {
        const days = differenceInDays(now, new Date(item.updated_at));
        if (days < 3) return null; // Only show items stale 3+ days
        const { urgency, suggestion } = getUrgencyAndSuggestion(item.stage, days);
        return { ...item, days_stale: days, urgency, suggestion };
      })
      .filter(Boolean)
      .sort((a: StaleItem, b: StaleItem) => {
        const urgencyOrder = { alta: 0, media: 1, baixa: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || b.days_stale - a.days_stale;
      });

    setItems(stale);
    setLoading(false);
  }

  async function advanceStage(item: StaleItem) {
    const next = STAGE_NEXT[item.stage];
    if (!next) return;
    setMovingId(item.id);

    const { error } = await supabase
      .from("sales_funnel")
      .update({ stage: next.key })
      .eq("id", item.id);

    if (error) {
      toast.error("Erro ao avançar etapa");
    } else {
      toast.success(`Movido para ${next.label}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
    setMovingId(null);
  }

  function openWhatsApp(phone: string | null, name: string) {
    if (!phone) return toast.error("Paciente sem telefone cadastrado");
    openWA(
      phone,
      `Olá ${name}, tudo bem? Estou entrando em contato para dar continuidade ao seu tratamento. Podemos conversar?`,
    );
  }

  function callPhone(phone: string | null) {
    if (!phone) return toast.error("Paciente sem telefone cadastrado");
    window.open(`tel:+55${phone.replace(/\D/g, "")}`, "_self");
  }

  const filtered = filterStage ? items.filter((i) => i.stage === filterStage) : items;

  const stats = useMemo(() => ({
    total: items.length,
    alta: items.filter((i) => i.urgency === "alta").length,
    media: items.filter((i) => i.urgency === "media").length,
    baixa: items.filter((i) => i.urgency === "baixa").length,
  }), [items]);

  if (clinicLoading || loading) {
    return (
      <AppLayout title="Follow-up Inteligente" subtitle="VEGA Vendas">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Follow-up Inteligente" subtitle="Pacientes que precisam da sua atenção agora">
      <div className="space-y-5">
        <Link to="/vendas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Vendas
        </Link>

        {/* Stats */}
        <div className="animate-fade-up grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Total pendente</p>
            <p className="text-2xl font-display font-bold mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 border-destructive/20">
            <p className="text-[11px] text-destructive uppercase tracking-wide font-medium">Urgentes</p>
            <p className="text-2xl font-display font-bold mt-1 text-destructive">{stats.alta}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 border-warning/20">
            <p className="text-[11px] text-warning uppercase tracking-wide font-medium">Atenção</p>
            <p className="text-2xl font-display font-bold mt-1 text-warning">{stats.media}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Normal</p>
            <p className="text-2xl font-display font-bold mt-1">{stats.baixa}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "80ms", opacity: 0, animationFillMode: "forwards" }}>
          <Badge
            className={`cursor-pointer ${!filterStage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            onClick={() => setFilterStage(null)}
          >
            Todos ({items.length})
          </Badge>
          {STAGES.map((s) => {
            const count = items.filter((i) => i.stage === s.key).length;
            return (
              <Badge
                key={s.key}
                className={`cursor-pointer ${filterStage === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                onClick={() => setFilterStage(filterStage === s.key ? null : s.key)}
              >
                {s.label} ({count})
              </Badge>
            );
          })}
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="animate-fade-up text-center py-16 space-y-3" style={{ animationDelay: "120ms", opacity: 0, animationFillMode: "forwards" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success mx-auto">
              <Zap className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
            <p className="text-xs text-muted-foreground">Nenhum paciente parado no funil. Continue assim.</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "120ms", opacity: 0, animationFillMode: "forwards" }}>
            {filtered.map((item) => {
              const uc = urgencyConfig[item.urgency];
              const stageLabel = STAGES.find((s) => s.key === item.stage)?.label || item.stage;
              const nextStage = STAGE_NEXT[item.stage];

              return (
                <Card key={item.id} className={`transition-all duration-200 ${item.urgency === "alta" ? "border-destructive/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Left: info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{item.patient?.name || "Sem paciente"}</p>
                          <Badge variant={uc.variant} className="text-[10px]">{uc.label}</Badge>
                          <Badge variant="outline" className="text-[10px]">{stageLabel}</Badge>
                        </div>

                        {/* Suggestion */}
                        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
                          <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${uc.color}`} />
                          <p className="text-xs text-foreground leading-relaxed">{item.suggestion}</p>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.days_stale} dias parado
                          </span>
                          {item.value != null && item.value > 0 && (
                            <span className="font-medium text-vendas">
                              R$ {item.value.toLocaleString("pt-BR")}
                            </span>
                          )}
                          {item.responsible?.full_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.responsible.full_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => openWhatsApp(item.patient?.phone || null, item.patient?.name || "")}
                        >
                          <WhatsAppIcon size={14} bare bgColor="#16a34a" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => callPhone(item.patient?.phone || null)}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Ligar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => toast.info("Agenda em desenvolvimento")}
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Agendar
                        </Button>
                        {nextStage && (
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs bg-vendas hover:bg-vendas/90 text-vendas-foreground"
                            disabled={movingId === item.id}
                            onClick={() => advanceStage(item)}
                          >
                            {movingId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            Mover → {nextStage.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
