import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Clock,
  AlertTriangle,
  MessageSquare,
  CalendarPlus,
  Phone,
  ArrowLeft,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const STAGES = [
  { key: "lead", label: "Lead", color: "bg-info/10 text-info border-info/20" },
  { key: "avaliacao", label: "Avaliação", color: "bg-warning/10 text-warning border-warning/20" },
  { key: "proposta", label: "Proposta", color: "bg-autoridade/10 text-autoridade border-autoridade/20" },
  { key: "fechado", label: "Fechado", color: "bg-success/10 text-success border-success/20" },
  { key: "perdido", label: "Perdido", color: "bg-destructive/10 text-destructive border-destructive/20" },
] as const;

type StageName = (typeof STAGES)[number]["key"];

interface FunnelItem {
  id: string;
  stage: string;
  value: number | null;
  date: string;
  updated_at: string;
  responsible_user_id: string | null;
  patient: { id: string; name: string; phone: string | null } | null;
  responsible: { full_name: string | null } | null;
}

const STALE_DAYS = 7;

export default function FunilVendas() {
  const { clinicId, loading: clinicLoading } = useClinic();
  const { user } = useAuth();
  const [items, setItems] = useState<FunnelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    fetchItems();
  }, [clinicId]);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales_funnel")
      .select("id, stage, value, date, updated_at, responsible_user_id, patient:patients!sales_funnel_patient_id_fkey(id, name, phone), responsible:profiles!sales_funnel_responsible_user_id_fkey(full_name)")
      .eq("clinic_id", clinicId!)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar funil");
      console.error(error);
    } else {
      setItems((data as any) || []);
    }
    setLoading(false);
  }

  async function moveItem(itemId: string, newStage: StageName) {
    setMovingId(itemId);
    const { error } = await supabase
      .from("sales_funnel")
      .update({ stage: newStage })
      .eq("id", itemId);

    if (error) {
      toast.error("Erro ao mover paciente");
    } else {
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, stage: newStage, updated_at: new Date().toISOString() } : it))
      );
      toast.success("Etapa atualizada");
    }
    setMovingId(null);
  }

  const grouped = useMemo(() => {
    const map: Record<string, FunnelItem[]> = {};
    STAGES.forEach((s) => (map[s.key] = []));
    items.forEach((it) => {
      if (map[it.stage]) map[it.stage].push(it);
    });
    return map;
  }, [items]);

  // Stats
  const totalItems = items.length;
  const fechados = grouped["fechado"]?.length || 0;
  const conversionRate = totalItems > 0 ? ((fechados / totalItems) * 100).toFixed(1) : "0";

  // Alerts
  const staleItems = useMemo(() => {
    const now = Date.now();
    return items.filter((it) => {
      if (it.stage === "fechado" || it.stage === "perdido") return false;
      const diff = now - new Date(it.updated_at).getTime();
      return diff > STALE_DAYS * 24 * 60 * 60 * 1000;
    });
  }, [items]);

  const alerts = useMemo(() => {
    const msgs: string[] = [];
    const propostaStale = staleItems.filter((i) => i.stage === "proposta");
    if (propostaStale.length > 0)
      msgs.push(`${propostaStale.length} paciente(s) parado(s) na etapa Proposta há mais de ${STALE_DAYS} dias`);
    const leadStale = staleItems.filter((i) => i.stage === "lead");
    if (leadStale.length > 0)
      msgs.push(`${leadStale.length} lead(s) sem ação há mais de ${STALE_DAYS} dias — faça follow-up!`);
    const perdidos = grouped["perdido"]?.length || 0;
    if (perdidos > 0 && totalItems > 0 && perdidos / totalItems > 0.3)
      msgs.push(`Taxa de perda alta (${((perdidos / totalItems) * 100).toFixed(0)}%) — revise seu processo de vendas`);
    return msgs;
  }, [staleItems, grouped, totalItems]);

  if (clinicLoading || loading) {
    return (
      <AppLayout title="Funil de Vendas" subtitle="VEGA Vendas">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Funil de Vendas" subtitle="Acompanhe cada paciente do primeiro contato ao fechamento">
      <div className="space-y-5">
        {/* Back link */}
        <Link to="/vendas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Vendas
        </Link>

        {/* Stats bar */}
        <div
          className="animate-fade-up grid grid-cols-2 sm:grid-cols-4 gap-3"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          {STAGES.filter((s) => s.key !== "perdido").map((s) => (
            <div key={s.key} className="rounded-xl border bg-card p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
              <p className="text-2xl font-display font-bold mt-1">{grouped[s.key]?.length || 0}</p>
              <p className="text-xs text-muted-foreground">
                R$ {((grouped[s.key] || []).reduce((sum, i) => sum + (i.value || 0), 0)).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>

        {/* Conversion rate */}
        <div
          className="animate-fade-up flex items-center gap-3 rounded-xl border bg-card p-4"
          style={{ animationDelay: "80ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold font-display">Taxa de Conversão: {conversionRate}%</p>
            <p className="text-xs text-muted-foreground">
              {fechados} fechado(s) de {totalItems} total
            </p>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div
            className="animate-fade-up space-y-2"
            style={{ animationDelay: "120ms", opacity: 0, animationFillMode: "forwards" }}
          >
            {alerts.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{msg}</p>
              </div>
            ))}
          </div>
        )}

        {/* Kanban board */}
        <div
          className="animate-fade-up overflow-x-auto pb-4"
          style={{ animationDelay: "160ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex gap-4 min-w-[900px]">
            {STAGES.map((stage) => (
              <div key={stage.key} className="flex-1 min-w-[200px]">
                {/* Column header */}
                <div className={`rounded-t-xl border px-4 py-3 ${stage.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold font-display">{stage.label}</h3>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {grouped[stage.key]?.length || 0}
                    </Badge>
                  </div>
                </div>

                {/* Column body */}
                <div className="space-y-2 border border-t-0 rounded-b-xl bg-muted/30 p-2 min-h-[200px]">
                  {(grouped[stage.key] || []).map((item) => {
                    const isStale =
                      item.stage !== "fechado" &&
                      item.stage !== "perdido" &&
                      Date.now() - new Date(item.updated_at).getTime() > STALE_DAYS * 24 * 60 * 60 * 1000;

                    const stageIdx = STAGES.findIndex((s) => s.key === item.stage);
                    const canMoveLeft = stageIdx > 0;
                    const canMoveRight = stageIdx < STAGES.length - 1;

                    return (
                      <Card
                        key={item.id}
                        className={`transition-all duration-200 ${isStale ? "ring-1 ring-warning/50" : ""}`}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Patient name */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold truncate">
                              {item.patient?.name || "Sem paciente"}
                            </p>
                            {isStale && (
                              <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                            )}
                          </div>

                          {/* Value */}
                          {item.value != null && item.value > 0 && (
                            <p className="text-xs font-medium text-vendas">
                              R$ {item.value.toLocaleString("pt-BR")}
                            </p>
                          )}

                          {/* Responsible */}
                          {item.responsible?.full_name && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate">{item.responsible.full_name}</span>
                            </div>
                          )}

                          {/* Time in stage */}
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(item.updated_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>

                          {/* Move buttons */}
                          <div className="flex items-center gap-1 pt-1 border-t">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={!canMoveLeft || movingId === item.id}
                              onClick={() => moveItem(item.id, STAGES[stageIdx - 1].key)}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={!canMoveRight || movingId === item.id}
                              onClick={() => moveItem(item.id, STAGES[stageIdx + 1].key)}
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>

                            <div className="flex-1" />

                            {/* Quick actions */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-vendas"
                              title="Follow-up via WhatsApp"
                              onClick={() => {
                                if (item.patient?.phone) {
                                  openWA(item.patient.phone, "");
                                } else {
                                  toast.info("Paciente sem telefone cadastrado");
                                }
                              }}
                            >
                              <WhatsAppIcon size={14} bare bgColor="hsl(var(--vendas))" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-vendas"
                              title="Enviar mensagem via WhatsApp"
                              onClick={() => {
                                if (item.patient?.phone) {
                                  openWA(
                                    item.patient.phone,
                                    `Olá ${item.patient.name}, tudo bem?`,
                                  );
                                } else {
                                  toast.info("Paciente sem telefone cadastrado");
                                }
                              }}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-vendas"
                              title="Agendar avaliação"
                              onClick={() => toast.info("Agenda em desenvolvimento")}
                            >
                              <CalendarPlus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {(grouped[stage.key] || []).length === 0 && (
                    <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                      Nenhum paciente
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
