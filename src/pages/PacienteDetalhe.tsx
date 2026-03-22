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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ProcedureSelector } from "@/components/ProcedureSelector";
import { generateBudgetPdf } from "@/utils/budgetPdf";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, DollarSign, Activity, CheckCircle2,
  Loader2, Phone, MessageCircle, Pencil, CreditCard, ChevronDown,
  Banknote, AlertCircle, FileText, Copy, Send, Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const regionOptions = [
  { value: "", label: "Não informado" },
  { value: "superior", label: "Superior" },
  { value: "inferior", label: "Inferior" },
];

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

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  parcial: { label: "Parcial", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  pago: { label: "Pago", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
};

const paymentMethodLabels: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  boleto: "Boleto",
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
  amount_paid: number;
  payment_status: string;
  payment_type: string | null;
  installments: number | null;
}

interface Payment {
  id: string;
  treatment_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
}

export default function PacienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentTreatment, setPaymentTreatment] = useState<Treatment | null>(null);
  const [showBudget, setShowBudget] = useState(false);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<string[]>([]);
  const [budgetDiscount, setBudgetDiscount] = useState("");
  const [budgetValidUntil, setBudgetValidUntil] = useState("");
  const [budgetNotes, setBudgetNotes] = useState("");

  // Treatment form
  const [formProcedure, setFormProcedure] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formStatus, setFormStatus] = useState("planejado");
  const [formValue, setFormValue] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTooth, setFormTooth] = useState("");

  // Payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("pix");
  const [payDate, setPayDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payNotes, setPayNotes] = useState("");

  // Fetch patient
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id!).single();
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

  // Fetch payments for this patient
  const { data: payments = [] } = useQuery({
    queryKey: ["payments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments" as any)
        .select("*")
        .eq("patient_id", id!)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Payment[];
    },
    enabled: !!id,
  });

  // Fetch budgets for this patient
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets" as any)
        .select("*")
        .eq("patient_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!id,
  });

  // Fetch clinic info for PDF
  const { data: clinic } = useQuery({
    queryKey: ["clinic-info", clinicId],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("*").eq("id", clinicId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId,
  });

  // KPIs
  const kpis = useMemo(() => {
    const totalValue = treatments
      .filter((t) => t.status === "aprovado" || t.status === "finalizado" || t.status === "em_andamento")
      .reduce((sum, t) => sum + Number(t.value || 0), 0);
    const totalPaid = treatments.reduce((sum, t) => sum + Number(t.amount_paid || 0), 0);
    const totalPending = totalValue - totalPaid;
    const ongoing = treatments.filter((t) => t.status === "em_andamento" || t.status === "aprovado").length;
    const finished = treatments.filter((t) => t.status === "finalizado").length;
    return { totalValue, totalPaid, totalPending: Math.max(0, totalPending), ongoing, finished };
  }, [treatments]);

  // Save treatment mutation (no more auto financial entry)
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId || !id || !user) throw new Error("Dados incompletos");
      const val = parseFloat(formValue) || 0;

      if (editingTreatment) {
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
      } else {
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
      }
    },
    onSuccess: () => {
      toast.success(editingTreatment ? "Tratamento atualizado!" : "Tratamento adicionado!");
      queryClient.invalidateQueries({ queryKey: ["treatments", id] });
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar tratamento"),
  });

  // Register payment mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId || !id || !user || !paymentTreatment) throw new Error("Dados incompletos");
      const amount = parseFloat(payAmount) || 0;
      if (amount <= 0) throw new Error("Valor inválido");

      // 1. Insert payment
      const { error: payErr } = await supabase.from("payments" as any).insert({
        clinic_id: clinicId,
        patient_id: id,
        treatment_id: paymentTreatment.id,
        amount,
        payment_method: payMethod,
        payment_date: payDate,
        notes: payNotes || null,
      } as any);
      if (payErr) throw payErr;

      // 2. Calculate new totals
      const newPaid = Number(paymentTreatment.amount_paid || 0) + amount;
      const totalVal = Number(paymentTreatment.value || 0);
      let newStatus = "pendente";
      if (newPaid >= totalVal) newStatus = "pago";
      else if (newPaid > 0) newStatus = "parcial";

      // 3. Update treatment
      const { error: upErr } = await supabase
        .from("treatments" as any)
        .update({ amount_paid: newPaid, payment_status: newStatus } as any)
        .eq("id", paymentTreatment.id);
      if (upErr) throw upErr;

      // 4. Create financial entry (real cash in)
      await supabase.from("financials").insert({
        clinic_id: clinicId,
        type: "entrada",
        category: "recebimento",
        value: amount,
        patient_id: id,
        responsible_user_id: user.id,
        date: payDate,
        status: "pago",
        payment_method: payMethod,
        description: `Pgto: ${paymentTreatment.procedure_type}`,
      });

      // 5. Commission: find dentist commission rate and create expense
      if (paymentTreatment.dentist_user_id) {
        const { data: member } = await supabase
          .from("clinic_members")
          .select("commission_rate")
          .eq("clinic_id", clinicId)
          .eq("user_id", paymentTreatment.dentist_user_id)
          .maybeSingle();

        const rate = Number(member?.commission_rate || 0) / 100;
        if (rate > 0) {
          const commission = amount * rate;
          await supabase.from("financials").insert({
            clinic_id: clinicId,
            type: "saida",
            category: "comissao",
            value: commission,
            responsible_user_id: paymentTreatment.dentist_user_id,
            date: payDate,
            status: "pago",
            description: `Comissão: ${paymentTreatment.procedure_type}`,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Pagamento registrado!");
      queryClient.invalidateQueries({ queryKey: ["treatments", id] });
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      closePaymentDialog();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao registrar pagamento"),
  });

  // Budget creation mutation
  const budgetMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId || !id || !user) throw new Error("Dados incompletos");
      const selectedTreatments = treatments.filter(t => selectedTreatmentIds.includes(t.id));
      if (selectedTreatments.length === 0) throw new Error("Selecione ao menos um tratamento");

      const totalValue = selectedTreatments.reduce((s, t) => s + Number(t.value || 0), 0);
      const discount = parseFloat(budgetDiscount) || 0;
      const finalValue = Math.max(0, totalValue - discount);

      // Create budget
      const { data: budget, error } = await supabase.from("budgets" as any).insert({
        clinic_id: clinicId,
        patient_id: id,
        dentist_user_id: user.id,
        total_value: totalValue,
        discount,
        final_value: finalValue,
        notes: budgetNotes || null,
        valid_until: budgetValidUntil || null,
      } as any).select().single();
      if (error) throw error;

      // Create budget items
      const items = selectedTreatments.map(t => ({
        budget_id: (budget as any).id,
        treatment_id: t.id,
        procedure_name: t.procedure_type,
        tooth_number: t.tooth_number || null,
        region: t.region || null,
        value: Number(t.value || 0),
        notes: t.notes || null,
      }));
      const { error: itemsError } = await supabase.from("budget_items" as any).insert(items as any);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      toast.success("Orçamento criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["budgets", id] });
      setShowBudget(false);
      setSelectedTreatmentIds([]);
      setBudgetDiscount(""); setBudgetValidUntil(""); setBudgetNotes("");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar orçamento"),
  });

  function copyBudgetLink(token: string) {
    const url = `${window.location.origin}/orcamento/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  function sendWhatsApp(token: string) {
    if (!patient?.phone) return toast.error("Paciente sem telefone");
    const url = `${window.location.origin}/orcamento/${token}`;
    const msg = encodeURIComponent(`Olá! Segue seu orçamento odontológico: ${url}`);
    window.open(`https://wa.me/55${patient.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  }

  function downloadBudgetPdf(budget: any) {
    const budgetItems = treatments.filter(t =>
      selectedTreatmentIds.includes(t.id) || true // we use all for now, ideally query budget_items
    );
    // For PDF we need the actual items - quick approach using budget data
    const doc = generateBudgetPdf({
      clinicName: clinic?.name || "Clínica",
      clinicPhone: clinic?.phone,
      clinicEmail: clinic?.email,
      clinicAddress: clinic?.address,
      patientName: patient?.name || "",
      patientPhone: patient?.phone,
      items: (budget._items || []).map((i: any) => ({
        procedure_name: i.procedure_name,
        tooth_number: i.tooth_number,
        region: i.region,
        value: Number(i.value),
      })),
      totalValue: Number(budget.total_value),
      discount: Number(budget.discount || 0),
      finalValue: Number(budget.final_value),
      validUntil: budget.valid_until ? format(new Date(budget.valid_until), "dd/MM/yyyy") : null,
      notes: budget.notes,
      createdAt: format(new Date(budget.created_at), "dd/MM/yyyy"),
    });
    doc.save(`orcamento-${patient?.name?.replace(/\s/g, "_") || "paciente"}.pdf`);
  }

  function openAdd() {
    setEditingTreatment(null);
    setFormProcedure(""); setFormRegion(""); setFormStatus("planejado");
    setFormValue(""); setFormNotes(""); setFormTooth("");
    setShowAdd(true);
  }

  function openEdit(t: Treatment) {
    setEditingTreatment(t);
    setFormProcedure(t.procedure_type); setFormRegion(t.region || "");
    setFormStatus(t.status); setFormValue(t.value?.toString() || "");
    setFormNotes(t.notes || ""); setFormTooth(t.tooth_number || "");
    setShowAdd(true);
  }

  function closeDialog() { setShowAdd(false); setEditingTreatment(null); }

  function openPaymentDialog(t: Treatment) {
    setPaymentTreatment(t);
    const pending = Math.max(0, Number(t.value) - Number(t.amount_paid));
    setPayAmount(pending > 0 ? String(pending) : "");
    setPayMethod("pix"); setPayDate(format(new Date(), "yyyy-MM-dd")); setPayNotes("");
    setShowPayment(true);
  }

  function closePaymentDialog() { setShowPayment(false); setPaymentTreatment(null); }

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
          <div className="flex gap-2 flex-wrap">
            {patient.phone && (
              <Button variant="outline" size="sm" onClick={() => openWhatsApp(patient.phone)}>
                <MessageCircle className="h-4 w-4 mr-1 text-green-600" /> WhatsApp
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowBudget(true)}>
              <FileText className="h-4 w-4" /> Criar Orçamento
            </Button>
            <Button size="sm" className="gap-1" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Adicionar Tratamento
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Total Orçado</p>
                <p className="text-lg font-bold text-foreground">R$ {kpis.totalValue.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Valor Pago</p>
                <p className="text-lg font-bold text-success">R$ {kpis.totalPaid.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Valor Pendente</p>
                <p className="text-lg font-bold text-destructive">R$ {kpis.totalPending.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Activity className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Em Andamento</p>
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
                <p className="text-[11px] text-muted-foreground">Finalizados</p>
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
            <div className="space-y-3">
              {treatments.map((t) => {
                const sc = statusConfig[t.status] || { label: t.status, color: "bg-muted text-muted-foreground" };
                const psc = paymentStatusConfig[t.payment_status] || paymentStatusConfig.pendente;
                const totalVal = Number(t.value || 0);
                const paid = Number(t.amount_paid || 0);
                const pending = Math.max(0, totalVal - paid);
                const progressPct = totalVal > 0 ? Math.min(100, Math.round((paid / totalVal) * 100)) : 0;
                const treatmentPayments = payments.filter(p => p.treatment_id === t.id);

                return (
                  <Collapsible key={t.id}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground">{t.procedure_type || "—"}</span>
                              {t.region && <span className="text-xs text-muted-foreground">| {t.region}</span>}
                              {t.tooth_number && <span className="text-xs text-muted-foreground">| Dente {t.tooth_number}</span>}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${psc.color}`}>{psc.label}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>R$ {totalVal.toLocaleString("pt-BR")}</span>
                              <span>{format(new Date(t.date), "dd/MM/yyyy")}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => openPaymentDialog(t)}>
                              <CreditCard className="h-3.5 w-3.5" /> Pagar
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Payment progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Pago: R$ {paid.toLocaleString("pt-BR")}</span>
                            <span>Pendente: R$ {pending.toLocaleString("pt-BR")}</span>
                          </div>
                          <Progress value={progressPct} className="h-2" />
                        </div>

                        {t.notes && <p className="text-xs text-muted-foreground truncate">{t.notes}</p>}

                        {/* Payment history toggle */}
                        {treatmentPayments.length > 0 && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground">
                              <ChevronDown className="h-3 w-3" /> {treatmentPayments.length} pagamento(s)
                            </Button>
                          </CollapsibleTrigger>
                        )}

                        <CollapsibleContent>
                          <div className="mt-2 space-y-1 pl-2 border-l-2 border-muted">
                            {treatmentPayments.map(p => (
                              <div key={p.id} className="flex items-center gap-3 text-xs text-muted-foreground py-1">
                                <span className="font-medium text-foreground">R$ {Number(p.amount).toLocaleString("pt-BR")}</span>
                                <span>{paymentMethodLabels[p.payment_method] || p.payment_method}</span>
                                <span>{format(new Date(p.payment_date), "dd/MM/yyyy")}</span>
                                {p.notes && <span className="truncate">{p.notes}</span>}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>

        {/* Budget list */}
        {budgets.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Orçamentos</h3>
            <div className="space-y-3">
              {budgets.map((b: any) => {
                const budgetStatusConfig: Record<string, { label: string; color: string }> = {
                  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
                  enviado: { label: "Enviado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
                  aceito: { label: "Aceito", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
                  recusado: { label: "Recusado", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
                  expirado: { label: "Expirado", color: "bg-muted text-muted-foreground" },
                };
                const bs = budgetStatusConfig[b.status] || budgetStatusConfig.pendente;
                return (
                  <Card key={b.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              R$ {Number(b.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${bs.color}`}>{bs.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(b.created_at), "dd/MM/yyyy")}
                            {b.valid_until && ` • Válido até ${format(new Date(b.valid_until), "dd/MM/yyyy")}`}
                          </p>
                          {b.accepted_signature && (
                            <p className="text-xs text-green-600 mt-1">Assinado por: {b.accepted_signature}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyBudgetLink(b.public_token)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          {patient.phone && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => sendWhatsApp(b.public_token)}>
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}


        <Dialog open={showAdd} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTreatment ? "Editar Tratamento" : "Novo Tratamento"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Procedimento</Label>
                <ProcedureSelector
                  value={formProcedure}
                  onSelect={(p) => {
                    setFormProcedure(p.name);
                    if (p.default_value > 0 && !formValue) setFormValue(String(p.default_value));
                  }}
                />
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
                <Input type="number" value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Observação (opcional)</Label>
                <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Observações..." rows={2} />
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

        {/* Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={(open) => !open && closePaymentDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            {paymentTreatment && (
              <div className="space-y-4 py-2">
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <p className="font-medium text-foreground">{paymentTreatment.procedure_type}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total: R$ {Number(paymentTreatment.value).toLocaleString("pt-BR")}</span>
                    <span>Pago: R$ {Number(paymentTreatment.amount_paid).toLocaleString("pt-BR")}</span>
                    <span>Pendente: R$ {Math.max(0, Number(paymentTreatment.value) - Number(paymentTreatment.amount_paid)).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Valor Pago (R$)</Label>
                  <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Forma de Pagamento</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Data</Label>
                  <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Observação (opcional)</Label>
                  <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Observação..." rows={2} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closePaymentDialog}>Cancelar</Button>
              <Button onClick={() => paymentMutation.mutate()} disabled={paymentMutation.isPending}>
                {paymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Registrar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Budget Creation Dialog */}
        <Dialog open={showBudget} onOpenChange={(open) => { if (!open) { setShowBudget(false); setSelectedTreatmentIds([]); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Orçamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Selecione os tratamentos</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {treatments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum tratamento cadastrado.</p>
                  ) : (
                    treatments.map(t => (
                      <div key={t.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedTreatmentIds.includes(t.id)}
                          onCheckedChange={(checked) => {
                            setSelectedTreatmentIds(prev =>
                              checked ? [...prev, t.id] : prev.filter(x => x !== t.id)
                            );
                          }}
                        />
                        <span className="text-sm text-foreground flex-1">{t.procedure_type}</span>
                        {t.tooth_number && <span className="text-xs text-muted-foreground">D{t.tooth_number}</span>}
                        <span className="text-sm font-medium text-foreground">R$ {Number(t.value).toLocaleString("pt-BR")}</span>
                      </div>
                    ))
                  )}
                </div>
                {selectedTreatmentIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Subtotal: R$ {treatments.filter(t => selectedTreatmentIds.includes(t.id)).reduce((s, t) => s + Number(t.value || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Desconto (R$)</Label>
                <Input type="number" value={budgetDiscount} onChange={(e) => setBudgetDiscount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Validade</Label>
                <Input type="date" value={budgetValidUntil} onChange={(e) => setBudgetValidUntil(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Observações</Label>
                <Textarea value={budgetNotes} onChange={(e) => setBudgetNotes(e.target.value)} placeholder="Condições, observações..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBudget(false)}>Cancelar</Button>
              <Button onClick={() => budgetMutation.mutate()} disabled={budgetMutation.isPending || selectedTreatmentIds.length === 0}>
                {budgetMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar Orçamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
