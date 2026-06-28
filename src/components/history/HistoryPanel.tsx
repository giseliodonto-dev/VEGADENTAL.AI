import { useMemo, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { Plus, X, Loader2, Stethoscope, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClinic } from "@/hooks/useClinic";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HistoryTimeline } from "./HistoryTimeline";

interface Props {
  patient: { id: string };
}

const ELIGIBLE_STATUSES = ["aprovado", "planejado", "em_andamento"];
const PAGE_SIZE = 10;

export function HistoryPanel({ patient }: Props) {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Histórico paginado (infinite)
  const {
    data: pages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["patient-history", patient.id],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("patient_history")
        .select(
          `*, patient_history_treatments(treatment:treatments(id, procedure_type, tooth_number))`,
        )
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: data ?? [], pageParam: pageParam as number };
    },
    getNextPageParam: (last) =>
      last.rows.length === PAGE_SIZE ? last.pageParam + 1 : undefined,
    enabled: !!patient?.id,
  });

  const entries = useMemo(
    () => (pages?.pages ?? []).flatMap((p) => p.rows),
    [pages],
  );

  // Procedimentos do plano (para seleção e fallback de exibição em entradas antigas)
  const { data: treatments = [] } = useQuery({
    queryKey: ["treatments", patient.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .eq("patient_id", patient.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!patient?.id,
  });

  const treatmentById = useMemo(() => {
    const map: Record<string, any> = {};
    for (const t of treatments as any[]) map[t.id] = t;
    return map;
  }, [treatments]);

  // Profissionais
  const { data: profiles = [] } = useQuery({
    queryKey: ["clinic-profiles", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data: members } = await supabase
        .from("clinic_members")
        .select("user_id")
        .eq("clinic_id", clinicId);
      const ids = (members ?? []).map((m) => m.user_id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      return data ?? [];
    },
    enabled: !!clinicId,
  });

  const dentistNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of profiles as any[])
      map[p.id] = p.full_name ?? "Profissional";
    return map;
  }, [profiles]);

  const eligible = (treatments as any[]).filter((t) =>
    ELIGIBLE_STATUSES.includes(t.status),
  );

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const reset = () => {
    setOpen(false);
    setContent("");
    setSelectedIds([]);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sessão expirada");
      if (!content.trim()) throw new Error("Descreva a evolução");

      const summary = content.trim().slice(0, 120);
      const { error } = await supabase.rpc("record_clinical_evolution", {
        _patient_id: patient.id,
        _content: content,
        _summary: summary,
        _treatment_ids: selectedIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const n = selectedIds.length;
      toast.success(
        n > 0
          ? `Evolução registrada · ${n} procedimento${n > 1 ? "s" : ""} concluído${n > 1 ? "s" : ""}`
          : "Evolução registrada",
      );
      reset();
      qc.invalidateQueries({ queryKey: ["patient-history", patient.id] });
      qc.invalidateQueries({ queryKey: ["treatments", patient.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-primary">
            Evolução Clínica
          </h3>
          <p className="text-sm text-muted-foreground">
            Registre o que foi realizado em cada sessão. Procedimentos
            marcados são automaticamente concluídos no plano de tratamento.
          </p>
        </div>
        {!open && (
          <Button variant="gold" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Evolução
          </Button>
        )}
      </header>

      {open && (
        <section className="rounded-xl border border-gold/30 bg-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary">Nova Evolução</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Nota clínica</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o que foi realizado nesta sessão..."
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Procedimentos realizados nesta sessão{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (opcional · marcados serão concluídos)
              </span>
            </Label>

            {eligible.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum procedimento pendente no plano de tratamento.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {eligible.map((t) => {
                  const checked = selectedIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        checked
                          ? "border-gold/50 bg-gold/5"
                          : "border-border/60 hover:border-border"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(t.id)}
                        className="mt-0.5 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-primary" />
                          {t.procedure_type}
                        </p>
                        {t.tooth_number && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Dente {t.tooth_number}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={reset}>
              Cancelar
            </Button>
            <Button
              variant="gold"
              onClick={() => save.mutate()}
              disabled={save.isPending || !content.trim()}
              className="gap-2"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar Evolução
            </Button>
          </div>
        </section>
      )}

      <HistoryTimeline
        entries={entries as any}
        isLoading={isLoading}
        dentistNameById={dentistNameById}
        treatmentById={treatmentById}
      />

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
}
