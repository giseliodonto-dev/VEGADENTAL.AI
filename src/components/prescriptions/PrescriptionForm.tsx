import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { useAiAccess } from "@/hooks/useAiAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles, Lock, Loader2, Save, Download, Printer, MessageCircle } from "lucide-react";
import { USAGE_TYPES, type Medication, suggestPosology } from "@/lib/prescriptionAi";
import {
  generatePrescriptionPdf,
  downloadPrescriptionPdf,
  printPrescriptionPdf,
  sendPrescriptionViaWhatsApp,
} from "@/utils/prescriptionPdf";
import type jsPDF from "jspdf";

type PdfAction = "download" | "print" | "whatsapp";

const emptyMed = (): Medication => ({
  name: "",
  usage_type: "Interno",
  posology: "",
  duration_days: 5,
});

interface Props {
  patient: any;
  onSaved?: () => void;
}

export function PrescriptionForm({ patient, onSaved }: Props) {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const { hasAiAccess } = useAiAccess();
  const qc = useQueryClient();

  const [meds, setMeds] = useState<Medication[]>([emptyMed()]);
  const [notes, setNotes] = useState("");
  const [aiLoadingIdx, setAiLoadingIdx] = useState<number | null>(null);

  const updateMed = (idx: number, patch: Partial<Medication>) => {
    setMeds((arr) => arr.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const addMed = () => setMeds((arr) => [...arr, emptyMed()]);
  const removeMed = (idx: number) =>
    setMeds((arr) => (arr.length === 1 ? arr : arr.filter((_, i) => i !== idx)));

  const handleAi = async (idx: number) => {
    const name = meds[idx].name.trim();
    if (!name) {
      toast.error("Informe o nome do medicamento antes de pedir a sugestão.");
      return;
    }
    setAiLoadingIdx(idx);
    try {
      const sug = await suggestPosology(name);
      updateMed(idx, sug);
      toast.success("Sugestão preenchida — revise antes de salvar.");
    } catch (e: any) {
      console.error(e);
      toast.error("Não foi possível obter sugestão da IA.");
    } finally {
      setAiLoadingIdx(null);
    }
  };

  const validate = () => {
    for (const m of meds) {
      if (!m.name.trim() || !m.posology.trim() || !m.duration_days) return false;
    }
    return true;
  };

  const fetchContext = async () => {
    const [{ data: clinic }, { data: profile }] = await Promise.all([
      supabase.from("clinics").select("*").eq("id", clinicId!).maybeSingle(),
      user ? supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    return { clinic, profile };
  };

  const buildPdf = async (medications: Medication[]): Promise<jsPDF> => {
    const { clinic, profile } = await fetchContext();
    return generatePrescriptionPdf({
      clinicName: clinic?.name ?? "Clínica",
      clinicPhone: clinic?.phone,
      clinicEmail: clinic?.email,
      clinicAddress: clinic?.address,
      clinicLogoUrl: clinic?.logo_url,
      patientName: patient.name,
      patientCpf: patient.cpf,
      dentistName: profile?.full_name || clinic?.responsible_name,
      dentistCro: clinic?.responsible_cro,
      medications,
      notes,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    });
  };

  const runPdfAction = async (action: PdfAction, doc: jsPDF) => {
    if (action === "download") {
      downloadPrescriptionPdf(doc, patient.name);
    } else if (action === "print") {
      printPrescriptionPdf(doc);
    } else if (action === "whatsapp") {
      const { clinic } = await fetchContext();
      sendPrescriptionViaWhatsApp(
        doc,
        patient.name,
        patient.phone ?? patient.whatsapp ?? null,
        clinic?.name ?? "nossa clínica",
      );
    }
  };

  const saveMutation = useMutation({
    mutationFn: async ({ action }: { action: PdfAction | null }) => {
      if (!clinicId) throw new Error("Clínica não definida");
      if (!validate()) throw new Error("Preencha todos os campos dos medicamentos");
      const payload = {
        clinic_id: clinicId,
        patient_id: patient.id,
        dentist_user_id: user?.id ?? null,
        medications: meds as unknown as any,
        notes: notes || null,
      };
      const { error } = await supabase.from("prescriptions").insert(payload);
      if (error) throw error;
      if (action) {
        const doc = await buildPdf(meds);
        await runPdfAction(action, doc);
      }
    },
    onSuccess: () => {
      toast.success("Prescrição salva.");
      qc.invalidateQueries({ queryKey: ["prescriptions", patient.id] });
      setMeds([emptyMed()]);
      setNotes("");
      onSaved?.();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });

  return (
    <div className="space-y-6">
      {meds.map((m, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-gold/30 bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">
              Medicamento {idx + 1}
            </span>
            <div className="flex items-center gap-2">
              {hasAiAccess ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAi(idx)}
                  disabled={aiLoadingIdx === idx}
                >
                  {aiLoadingIdx === idx ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-gold" />
                  )}
                  Sugerir Posologia com IA
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  title="Disponível no Plano Pro"
                >
                  <Lock className="h-4 w-4" />
                  Disponível no Plano Pro
                </Button>
              )}
              {meds.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeMed(idx)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Nome do medicamento</Label>
              <Input
                value={m.name}
                onChange={(e) => updateMed(idx, { name: e.target.value })}
                placeholder="Ex: Amoxicilina 500mg"
              />
            </div>
            <div>
              <Label>Tipo de uso</Label>
              <Select
                value={m.usage_type}
                onValueChange={(v) => updateMed(idx, { usage_type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USAGE_TYPES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Posologia completa</Label>
              <Textarea
                rows={3}
                value={m.posology}
                onChange={(e) => updateMed(idx, { posology: e.target.value })}
                placeholder="Ex: 1 comprimido de 8 em 8 horas, por via oral, após as refeições."
              />
            </div>
            <div>
              <Label>Duração (dias)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={m.duration_days}
                onChange={(e) =>
                  updateMed(idx, { duration_days: Number(e.target.value) || 1 })
                }
              />
            </div>
          </div>
          {hasAiAccess && (
            <p className="text-[11px] italic text-muted-foreground">
              Sugestão de IA — revise antes de prescrever.
            </p>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addMed}>
        <Plus className="h-4 w-4" /> Adicionar medicamento
      </Button>

      <div>
        <Label>Observações (opcional)</Label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Orientações adicionais ao paciente."
        />
      </div>

      <div className="flex flex-wrap gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => saveMutation.mutate({ withPdf: false })}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4" /> Salvar
        </Button>
        <Button
          variant="gold"
          onClick={() => saveMutation.mutate({ withPdf: true })}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSignature className="h-4 w-4" />
          )}
          Salvar e Gerar PDF
        </Button>
      </div>
    </div>
  );
}
