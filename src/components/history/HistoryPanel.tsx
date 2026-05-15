import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2, AlertTriangle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClinic } from "@/hooks/useClinic";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HistoryTimeline } from "./HistoryTimeline";

interface Props {
  patient: { id: string };
}

const fmtBRL = (v: number) =>
  `R$ ${(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ELIGIBLE_STATUSES = ["aprovado", "planejado", "em_andamento"];

export function HistoryPanel({ patient }: Props) {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [treatmentId, setTreatmentId] = useState<string>("");

  // Histórico
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

  // Procedimentos
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

  // Recebimentos do paciente (entradas pagas)
  const { data: financials = [] } = useQuery({
    queryKey: ["patient-financials", patient.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financials")
        .select("*")
        .eq("patient_id", patient.id)
        .eq("type", "entrada");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!patient?.id,
  });

  // Profissionais da clínica
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

  const treatmentById = useMemo(() => {
    const map: Record<string, any> = {};
    for (const t of treatments as any[]) map[t.id] = t;
    return map;
  }, [treatments]);

  // Saldo de créditos pagos
  const totalPago = (financials as any[])
    .filter((f) => f.status === "pago")
    .reduce((s, f) => s + Number(f.value || 0), 0);
  const totalAbatido = (entries as any[]).reduce(
    (s, e) => s + Number(e.executed_value || 0),
    0,
  );
  const saldoCreditos = totalPago - totalAbatido;

  // Procedimentos elegíveis (não executados)
  const eligible = (treatments as any[]).filter((t) =>
    ELIGIBLE_STATUSES.includes(t.status),
  );

  const selectedTreatment = treatmentId ? treatmentById[treatmentId] : null;
  const selectedValue = Number(selectedTreatment?.value || 0);
  const saldoInsuficiente = selectedTreatment && selectedValue > saldoCreditos;

  const save = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Clínica não identificada");
      if (!selectedTreatment) throw new Error("Selecione um procedimento");
      if (!content.trim()) throw new Error("Descreva a evolução");

      const summary = content.trim().slice(0, 120);
      const { error: insErr } = await supabase.from("patient_history").insert({
        clinic_id: clinicId,
        patient_id: patient.id,
        dentist_user_id: user?.id ?? null,
        treatment_id: selectedTreatment.id,
        executed_value: selectedValue,
        content,
        summary,
      } as any);
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from("treatments")
        .update({ status: "executado" })
        .eq("id", selectedTreatment.id);
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      toast.success(`Evolução registrada · ${fmtBRL(selectedValue)} abatido`);
      setContent("");
      setTreatmentId("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["patient-history", patient.id] });
      qc.invalidateQueries({ queryKey: ["treatments", patient.id] });
      qc.invalidateQueries({ queryKey: ["patient-financials", patient.id] });
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
            Registre o que foi executado em cada sessão. O valor é abatido
            automaticamente do saldo de créditos pagos.
          </p>
        </div>
        {!open && (
          <Button variant="gold" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Evolução
          </Button>
        )}
      </header>

      {/* Card de saldo */}
      <div className="rounded-xl border border-gold/30 bg-card p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Saldo de Créditos Pagos
            </p>
            <p className="font-display text-2xl font-semibold text-primary">
              {fmtBRL(saldoCreditos)}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Recebido: {fmtBRL(totalPago)}</p>
          <p>Executado: {fmtBRL(totalAbatido)}</p>
        </div>
      </div>

      {open && (
        <section className="rounded-xl border border-gold/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary">Nova Evolução</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setContent("");
                setTreatmentId("");
              }}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Procedimento do plano aprovado</Label>
            <Select value={treatmentId} onValueChange={setTreatmentId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    eligible.length === 0
                      ? "Nenhum procedimento disponível para execução"
                      : "Selecione um procedimento"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {eligible.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.procedure_type}
                    {t.tooth_number ? ` · dente ${t.tooth_number}` : ""}
                    {" · "}
                    {fmtBRL(Number(t.value || 0))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {saldoInsuficiente && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Atenção: saldo insuficiente para este procedimento (faltam{" "}
                {fmtBRL(selectedValue - saldoCreditos)}). Você pode salvar
                mesmo assim — o saldo ficará negativo até o próximo recebimento.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Texto da evolução</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o que foi realizado nesta sessão..."
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setContent("");
                setTreatmentId("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="gold"
              onClick={() => save.mutate()}
              disabled={save.isPending || !treatmentId || !content.trim()}
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
    </div>
  );
}
