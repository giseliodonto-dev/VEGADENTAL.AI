import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClinic } from "@/hooks/useClinic";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";
import { HistoryTimeline } from "./HistoryTimeline";

interface Props {
  patient: { id: string };
}

function htmlToSummary(html: string, max = 120): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function HistoryPanel({ patient }: Props) {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["patient-history", patient.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_history")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!patient?.id,
  });

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

  const dentistNameById: Record<string, string> = {};
  for (const p of profiles) dentistNameById[p.id] = p.full_name ?? "Profissional";

  const save = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Clínica não identificada");
      const summary = htmlToSummary(content);
      if (!summary) throw new Error("Escreva o atendimento antes de salvar");
      const { error } = await supabase.from("patient_history").insert({
        clinic_id: clinicId,
        patient_id: patient.id,
        dentist_user_id: user?.id ?? null,
        content,
        summary,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atendimento registrado");
      setContent("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["patient-history", patient.id] });
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
            Histórico de atendimentos do paciente, em ordem cronológica.
          </p>
        </div>
        {!open && (
          <Button variant="gold" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Atendimento
          </Button>
        )}
      </header>

      {open && (
        <section className="rounded-xl border border-gold/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {format(new Date(), "dd 'de' MMMM 'de' yyyy · HH:mm", { locale: ptBR })}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setContent("");
              }}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <RichTextEditor value={content} onChange={setContent} />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setContent("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="gold"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="gap-2"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar Atendimento
            </Button>
          </div>
        </section>
      )}

      <HistoryTimeline
        entries={entries as any}
        isLoading={isLoading}
        dentistNameById={dentistNameById}
      />
    </div>
  );
}
