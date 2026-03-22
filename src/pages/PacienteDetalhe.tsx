import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, DollarSign, Activity, CheckCircle2,
  Loader2, Phone, MessageCircle, Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const procedureOptions = [
  { value: "limpeza", label: "Limpeza" },
  { value: "restauracao", label: "Restauração" },
  { value: "faceta", label: "Faceta" },
  { value: "implante", label: "Implante" },
  { value: "outros", label: "Outros" },
];

const regionOptions = [
  { value: "", label: "Não informado" },
  { value: "superior", label: "Superior" },
  { value: "inferior", label: "Inferior" },
];

// Permanent teeth: 11-18, 21-28, 31-38, 41-48
// Deciduous teeth: 51-55, 61-65, 71-75, 81-85
const toothOptions: { group: string; teeth: string[] }[] = [
  { group: "Permanentes — Superior Direito", teeth: ["11","12","13","14","15","16","17","18"] },
  { group: "Permanentes — Superior Esquerdo", teeth: ["21","22","23","24","25","26","27","28"] },
  { group: "Permanentes — Inferior Esquerdo", teeth: ["31","32","33","34","35","36","37","38"] },
  { group: "Permanentes — Inferior Direito", teeth: ["41","42","43","44","45","46","47","48"] },
  { group: "Decíduos — Superior Direito", teeth: ["51","52","53","54","55"] },
  { group: "Decíduos — Superior Esquerdo", teeth: ["61","62","63","64","65"] },
  { group: "Decíduos — Inferior Esquerdo", teeth: ["71","72","73","74","75"] },
  { group: "Decíduos — Inferior Direito", teeth: ["81","82","83","84","85"] },
];

const statusOptions = [
  { value: "planejado", label: "Planejado" },
  { value: "aprovado", label: "Aprovado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "finalizado", label: "Finalizado" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  planejado: { label: "Planejado", color: "bg-muted text-muted-foreground" },
  aprovado: { label: "Aprovado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  em_andamento: { label: "Em andamento", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  finalizado: { label: "Finalizado", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
};

const patientStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  lead: { label: "Lead", variant: "default" },
  em_avaliacao: { label: "Avaliação", variant: "secondary" },
  em_tratamento: { label: "Tratamento", variant: "outline" },
  finalizado: { label: "Finalizado", variant: "secondary" },
  perdido: { label: "Perdido", variant: "destructive" },
};

interface Treatment {
  id: string;
  procedure_type: string;
  region: string | null;
  status: string;
  value: number;
  notes: string | null;
  date: string;
  dentist_user_id: string | null;
  tooth_number: string | null;
}

export default function PacienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);

  // Form state
  const [formProcedure, setFormProcedure] = useState("limpeza");
  const [formRegion, setFormRegion] = useState("");
  const [formStatus, setFormStatus] = useState("planejado");
  const [formValue, setFormValue] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTooth, setFormTooth] = useState("");

  // Fetch patient
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch treatments
  const { data: treatments = [], isLoading: treatmentsLoading } = useQuery({
    queryKey: ["treatments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments" as any)
        .select("*")
        .eq("patient_id", id!)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Treatment[];
    },
    enabled: !!id,
  });

  // KPIs
  const kpis = useMemo(() => {
    const billed = treatments
      .filter((t) => t.status === "aprovado" || t.status === "finalizado")
      .reduce((sum, t) => sum + Number(t.value || 0), 0);
    const ongoing = treatments.filter((t) => t.status === "em_andamento" || t.status === "aprovado").length;
    const finished = treatments.filter((t) => t.status === "finalizado").length;
    return { billed, ongoing, finished };
  }, [treatments]);

  // Create financial entry
  async function createFinancialEntry(value: number, patientId: string) {
    if (!clinicId || !user) return;
    // Check for duplicate
    const today = format(new Date(), "yyyy-MM-dd");
    const { data: existing } = await supabase
      .from("financials")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("patient_id", patientId)
      .eq("date", today)
      .eq("value", value)
      .limit(1);

    if (existing && existing.length > 0) return;

    await supabase.from("financials").insert({
      clinic_id: clinicId,
      type: "entrada",
      category: "tratamentos",
      value,
      patient_id: patientId,
      responsible_user_id: user.id,
      date: today,
      status: "pago",
      description: "Tratamento registrado automaticamente",
    });
  }

  // Save treatment mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId || !id || !user) throw new Error("Dados incompletos");
      const val = parseFloat(formValue) || 0;

      if (editingTreatment) {
        // Update
        const { error } = await supabase
          .from("treatments" as any)
          .update({
            procedure_type: formProcedure,
            region: formRegion && formRegion !== "none" ? formRegion : null,
            tooth_number: formTooth && formTooth !== "none" ? formTooth : null,
            status: formStatus,
            value: val,
            notes: formNotes || null,
          } as any)
          .eq("id", editingTreatment.id);
        if (error) throw error;

        // Financial integration on status change
        if (
          (formStatus === "aprovado" || formStatus === "finalizado") &&
          editingTreatment.status !== "aprovado" &&
          editingTreatment.status !== "finalizado" &&
          val > 0
        ) {
          await createFinancialEntry(val, id);
        }
      } else {
        // Insert
        const { error } = await supabase.from("treatments" as any).insert({
          clinic_id: clinicId,
          patient_id: id,
          dentist_user_id: user.id,
          procedure_type: formProcedure,
          region: formRegion && formRegion !== "none" ? formRegion : null,
          tooth_number: formTooth && formTooth !== "none" ? formTooth : null,
          status: formStatus,
          value: val,
          notes: formNotes || null,
        } as any);
        if (error) throw error;

        // Financial integration
        if ((formStatus === "aprovado" || formStatus === "finalizado") && val > 0) {
          await createFinancialEntry(val, id);
        }
      }
    },
    onSuccess: () => {
      toast.success(editingTreatment ? "Tratamento atualizado!" : "Tratamento adicionado!");
      queryClient.invalidateQueries({ queryKey: ["treatments", id] });
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar tratamento"),
  });

  function openAdd() {
    setEditingTreatment(null);
    setFormProcedure("limpeza");
    setFormRegion("");
    setFormStatus("planejado");
    setFormValue("");
    setFormNotes("");
    setFormTooth("");
    setShowAdd(true);
  }

  function openEdit(t: Treatment) {
    setEditingTreatment(t);
    setFormProcedure(t.procedure_type);
    setFormRegion(t.region || "");
    setFormStatus(t.status);
    setFormValue(t.value?.toString() || "");
    setFormNotes(t.notes || "");
    setFormTooth(t.tooth_number || "");
    setShowAdd(true);
  }

  function closeDialog() {
    setShowAdd(false);
    setEditingTreatment(null);
  }

  function openWhatsApp(phone: string | null) {
    if (!phone) return toast.error("Paciente sem telefone");
    window.open(`https://wa.me/55${phone.replace(/\D/g, "")}`, "_blank");
  }

  if (patientLoading) {
    return (
      <AppLayout title="Paciente" subtitle="Ficha do paciente">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout title="Paciente" subtitle="Não encontrado">
        <div className="text-center py-12 text-muted-foreground">
          Paciente não encontrado.
          <Button variant="link" onClick={() => navigate("/pacientes")}>Voltar</Button>
        </div>
      </AppLayout>
    );
  }

  const ps = patientStatusConfig[patient.status] || { label: patient.status, variant: "outline" as const };

  return (
    <AppLayout title="Ficha do Paciente" subtitle={patient.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {patient.phone && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {patient.phone}
                  </span>
                )}
                <Badge variant={ps.variant}>{ps.label}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {patient.phone && (
              <Button variant="outline" size="sm" onClick={() => openWhatsApp(patient.phone)}>
                <MessageCircle className="h-4 w-4 mr-1 text-green-600" /> WhatsApp
              </Button>
            )}
            <Button size="sm" className="gap-1" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Adicionar Tratamento
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Faturado</p>
                <p className="text-lg font-bold text-foreground">
                  R$ {kpis.billed.toLocaleString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Activity className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
                <p className="text-lg font-bold text-foreground">{kpis.ongoing}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Finalizados</p>
                <p className="text-lg font-bold text-foreground">{kpis.finished}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Treatment list */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Histórico de Tratamentos</h3>
          {treatmentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : treatments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum tratamento registrado.
            </div>
          ) : (
            <div className="space-y-2">
              {treatments.map((t) => {
                const sc = statusConfig[t.status] || { label: t.status, color: "bg-muted text-muted-foreground" };
                const proc = procedureOptions.find((p) => p.value === t.procedure_type);
                return (
                  <Card key={t.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">
                            {proc?.label || t.procedure_type}
                          </span>
                          {t.region && (
                            <span className="text-xs text-muted-foreground">| {t.region}</span>
                          )}
                          {t.tooth_number && (
                            <span className="text-xs text-muted-foreground">| Dente {t.tooth_number}</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>R$ {Number(t.value).toLocaleString("pt-BR")}</span>
                          <span>{format(new Date(t.date), "dd/MM/yyyy")}</span>
                        </div>
                        {t.notes && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{t.notes}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit dialog */}
        <Dialog open={showAdd} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTreatment ? "Editar Tratamento" : "Novo Tratamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Procedimento</Label>
                <Select value={formProcedure} onValueChange={setFormProcedure}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {procedureOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Região (opcional)</Label>
                <Select value={formRegion} onValueChange={setFormRegion}>
                  <SelectTrigger><SelectValue placeholder="Não informado" /></SelectTrigger>
                  <SelectContent>
                    {regionOptions.map((r) => (
                      <SelectItem key={r.value || "none"} value={r.value || "none"}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Dente (opcional)</Label>
                <Select value={formTooth} onValueChange={setFormTooth}>
                  <SelectTrigger><SelectValue placeholder="Selecionar dente" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">Não informado</SelectItem>
                    {toothOptions.map((group) => (
                      <div key={group.group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group.group}</div>
                        {group.teeth.map((tooth) => (
                          <SelectItem key={tooth} value={tooth}>Dente {tooth}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Valor (R$)</Label>
                <Input
                  type="number"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Observação (opcional)</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Observações sobre o tratamento..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
