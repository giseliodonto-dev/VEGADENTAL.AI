import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClinic } from "@/hooks/useClinic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProcedureSelector } from "@/components/ProcedureSelector";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, AlertTriangle, UserCircle, Heart, Smile, ClipboardList, Plus, Trash2, FileSignature } from "lucide-react";

const fmtBRL = (v: number) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS_LABELS: Record<string, string> = { planejado: "Planejado", em_andamento: "Em andamento", concluido: "Concluído" };
const PAY_STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800 border-amber-300",
  parcial: "bg-blue-100 text-blue-800 border-blue-300",
  pago: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const TOOTH_STATES = {
  higido: { label: "Hígido", color: "bg-white border-[#103444]/30 text-[#103444]" },
  cariado: { label: "Cariado", color: "bg-red-500 border-red-600 text-white" },
  restaurado: { label: "Restaurado", color: "bg-blue-500 border-blue-600 text-white" },
  ausente: { label: "Ausente", color: "bg-slate-300 border-slate-400 text-slate-600 line-through" },
  coroa: { label: "Coroa", color: "bg-amber-500 border-amber-600 text-white" },
  canal: { label: "Canal", color: "bg-purple-500 border-purple-600 text-white" },
} as const;
type ToothState = keyof typeof TOOTH_STATES;

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const DISEASE_OPTIONS = [
  "diabetes", "hipertensao", "cardiopatia", "gestante", "epilepsia", "asma", "hepatite", "anemia"
];

export default function PacienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (patient) setForm(patient); }, [patient]);
  const setField = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const [cepLoading, setCepLoading] = useState(false);
  const onCepBlur = async (cep: string) => {
    const clean = (cep || "").replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      setForm((f: any) => ({
        ...f,
        postal_code: clean,
        street: data.logradouro || f.street,
        neighborhood: data.bairro || f.neighborhood,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
      toast.success("Endereço preenchido");
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const savePatient = useMutation({
    mutationFn: async () => {
      const { id: _id, created_at, updated_at, clinic_id, ...rest } = form;
      const { error } = await supabase.from("patients").update(rest).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cadastro salvo"); queryClient.invalidateQueries({ queryKey: ["patient", id] }); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const { data: anamnese } = useQuery({
    queryKey: ["anamnese", id],
    queryFn: async () => {
      const { data } = await supabase.from("anamneses").select("*").eq("patient_id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const [ana, setAna] = useState<any>({
    allergies: "", medications: "", diseases: [],
    smoker: false, alcohol: false, bruxism: false,
    current_pain: false, gum_bleeding: false, sensitivity: false, surgeries: false,
  });
  useEffect(() => {
    if (anamnese) setAna({ ...anamnese, diseases: anamnese.diseases || [] });
  }, [anamnese]);

  const setAnaField = (k: string, v: any) => setAna((a: any) => ({ ...a, [k]: v }));
  const toggleDisease = (d: string) => setAna((a: any) => ({
    ...a,
    diseases: a.diseases?.includes(d) ? a.diseases.filter((x: string) => x !== d) : [...(a.diseases || []), d],
  }));

  const saveAnamnese = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Clínica não identificada");
      const payload = {
        patient_id: id!,
        clinic_id: clinicId,
        allergies: ana.allergies || null,
        medications: ana.medications || null,
        diseases: ana.diseases || [],
        smoker: !!ana.smoker, alcohol: !!ana.alcohol, bruxism: !!ana.bruxism,
        current_pain: !!ana.current_pain, gum_bleeding: !!ana.gum_bleeding,
        sensitivity: !!ana.sensitivity, surgeries: !!ana.surgeries,
        status: 'respondida',
        response_date: new Date().toISOString(),
      };
      if (anamnese?.id) {
        const { error } = await supabase.from("anamneses").update(payload).eq("id", anamnese.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("anamneses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Anamnese salva"); queryClient.invalidateQueries({ queryKey: ["anamnese", id] }); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const { data: odo } = useQuery({
    queryKey: ["odontogram", id],
    queryFn: async () => {
      const { data } = await supabase.from("odontograms").select("*").eq("patient_id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const [teeth, setTeeth] = useState<Record<string, ToothState>>({});
  useEffect(() => {
    if (odo?.teeth_data) setTeeth(odo.teeth_data as Record<string, ToothState>);
  }, [odo]);

  const cycleTooth = (n: number) => {
    const states: ToothState[] = ["higido", "cariado", "restaurado", "coroa", "canal", "ausente"];
    const cur = teeth[n] || "higido";
    const next = states[(states.indexOf(cur) + 1) % states.length];
    setTeeth(t => ({ ...t, [n]: next }));
  };

  const saveOdontogram = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Clínica não identificada");
      const payload = { patient_id: id!, clinic_id: clinicId, teeth_data: teeth };
      if (odo?.id) {
        const { error } = await supabase.from("odontograms").update(payload).eq("id", odo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("odontograms").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Odontograma salvo"); queryClient.invalidateQueries({ queryKey: ["odontogram", id] }); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });


  const Tooth = ({ n }: { n: number }) => {
    const st = teeth[n] || "higido";
    const cfg = TOOTH_STATES[st];
    return (
      <button
        onClick={() => cycleTooth(n)}
        className={`h-10 w-10 rounded-md border-2 text-[10px] font-bold transition-all hover:scale-110 ${cfg.color}`}
        title={cfg.label}
      >
        {n}
      </button>
    );
  };

  // ===== PLANO DE TRATAMENTO =====
  const { data: treatments = [] } = useQuery({
    queryKey: ["treatments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .eq("patient_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState<{ procedure_type: string; tooth_number: string; region: string; value: number }>({
    procedure_type: "", tooth_number: "", region: "", value: 0,
  });
  const markedTeeth = Object.keys(teeth);

  const addTreatment = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Clínica não identificada");
      if (!newItem.procedure_type) throw new Error("Selecione um procedimento");
      const { error } = await supabase.from("treatments").insert({
        clinic_id: clinicId,
        patient_id: id!,
        procedure_type: newItem.procedure_type,
        tooth_number: newItem.tooth_number || null,
        region: newItem.region || null,
        value: newItem.value || 0,
        status: "planejado",
        payment_status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Procedimento adicionado");
      queryClient.invalidateQueries({ queryKey: ["treatments", id] });
      setAddOpen(false);
      setNewItem({ procedure_type: "", tooth_number: "", region: "", value: 0 });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteTreatment = useMutation({
    mutationFn: async (tid: string) => {
      const { error } = await supabase.from("treatments").delete().eq("id", tid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Procedimento removido");
      queryClient.invalidateQueries({ queryKey: ["treatments", id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [discountPct, setDiscountPct] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "parcelado" | "boleto">("pix");
  const [installmentsN, setInstallmentsN] = useState(2);

  const planned = treatments.filter((t: any) => t.status === "planejado" || t.status === "em_andamento");
  const subtotal = planned.reduce((s: number, t: any) => s + Number(t.value || 0), 0);
  const discountValue = subtotal * (discountPct / 100);
  const finalValue = Math.max(0, subtotal - discountValue);

  const installmentSchedule = (() => {
    if (paymentMethod !== "parcelado" || installmentsN < 1) return [];
    const per = finalValue / installmentsN;
    const today = new Date();
    return Array.from({ length: installmentsN }, (_, i) => {
      const d = new Date(today);
      d.setMonth(d.getMonth() + i);
      return { n: i + 1, date: d.toLocaleDateString("pt-BR"), value: per };
    });
  })();

  const generateBudget = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Clínica não identificada");
      if (planned.length === 0) throw new Error("Adicione ao menos um procedimento");
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const { data: budget, error: bErr } = await supabase.from("budgets").insert({
        clinic_id: clinicId,
        patient_id: id!,
        total_value: subtotal,
        discount: discountValue,
        final_value: finalValue,
        status: "pendente",
        valid_until: validUntil.toISOString().slice(0, 10),
        notes: `Forma de pagamento: ${paymentMethod}${paymentMethod === "parcelado" ? ` em ${installmentsN}x` : ""}`,
      }).select("id, public_token").single();
      if (bErr) throw bErr;

      const items = planned.map((t: any) => ({
        budget_id: budget.id,
        treatment_id: t.id,
        procedure_name: t.procedure_type,
        tooth_number: t.tooth_number,
        region: t.region,
        value: Number(t.value || 0),
      }));
      const { error: iErr } = await supabase.from("budget_items").insert(items);
      if (iErr) throw iErr;

      return budget;
    },
    onSuccess: (budget: any) => {
      toast.success("Plano aprovado! Abrindo contrato...");
      window.open(`/orcamento/${budget.public_token}`, "_blank");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  if (isLoading) {
    return <AppLayout title="Ficha do Paciente"><div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-[#103444]" /></div></AppLayout>;
  }

  return (
    <AppLayout title={patient?.name || "Paciente"} subtitle="Ficha completa do paciente">
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate("/pacientes")} className="text-[#103444] -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para lista
        </Button>

        <Tabs defaultValue="cadastro">
          <TabsList className="bg-white border border-amber-400/30 h-auto p-1">
            <TabsTrigger value="cadastro" className="data-[state=active]:bg-[#103444] data-[state=active]:text-white gap-2">
              <UserCircle className="h-4 w-4" /> Cadastro
            </TabsTrigger>
            <TabsTrigger value="anamnese" className="data-[state=active]:bg-[#103444] data-[state=active]:text-white gap-2">
              <Heart className="h-4 w-4" /> Anamnese
            </TabsTrigger>
            <TabsTrigger value="odonto" className="data-[state=active]:bg-[#103444] data-[state=active]:text-white gap-2">
              <Smile className="h-4 w-4" /> Odontograma
            </TabsTrigger>
            <TabsTrigger value="plano" className="data-[state=active]:bg-[#103444] data-[state=active]:text-white gap-2">
              <ClipboardList className="h-4 w-4" /> Plano de Tratamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cadastro">
            <Card className="bg-white border-amber-400/30">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[#103444] uppercase tracking-wider mb-3">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Label>Nome completo</Label><Input value={form.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                    <div><Label>CPF</Label><Input value={form.cpf || ""} onChange={e => setField("cpf", e.target.value)} /></div>
                    <div><Label>RG</Label><Input value={form.rg || ""} onChange={e => setField("rg", e.target.value)} /></div>
                    <div><Label>Data de nascimento</Label><Input type="date" value={form.birthdate || ""} onChange={e => setField("birthdate", e.target.value)} /></div>
                    <div>
                      <Label>Gênero</Label>
                      <Select value={form.gender || ""} onValueChange={v => setField("gender", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#103444] uppercase tracking-wider mb-3">Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>WhatsApp</Label><Input value={form.phone || ""} onChange={e => setField("phone", e.target.value)} /></div>
                    <div><Label>Email</Label><Input type="email" value={form.email || ""} onChange={e => setField("email", e.target.value)} /></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#103444] uppercase tracking-wider mb-3">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Label>CEP</Label>
                      <Input
                        value={form.postal_code || ""}
                        onChange={e => setField("postal_code", e.target.value)}
                        onBlur={e => onCepBlur(e.target.value)}
                        placeholder="00000000"
                      />
                      {cepLoading && <Loader2 className="absolute right-2 top-9 h-4 w-4 animate-spin text-[#103444]/40" />}
                    </div>
                    <div className="md:col-span-2"><Label>Rua</Label><Input value={form.street || ""} onChange={e => setField("street", e.target.value)} /></div>
                    <div><Label>Número</Label><Input value={form.number || ""} onChange={e => setField("number", e.target.value)} /></div>
                    <div><Label>Bairro</Label><Input value={form.neighborhood || ""} onChange={e => setField("neighborhood", e.target.value)} /></div>
                    <div><Label>Cidade</Label><Input value={form.city || ""} onChange={e => setField("city", e.target.value)} /></div>
                    <div><Label>UF</Label><Input value={form.state || ""} onChange={e => setField("state", e.target.value)} maxLength={2} /></div>
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white border-t border-amber-400/30 flex justify-end">
                  <Button
                    onClick={() => savePatient.mutate()}
                    disabled={savePatient.isPending}
                    className="bg-[#103444] hover:bg-[#0a232d] border border-amber-500/60 gap-2"
                  >
                    {savePatient.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anamnese">
            <Card className="bg-white border-amber-400/30">
              <CardContent className="p-6 space-y-6">
                <div className={`p-4 rounded-lg border-2 ${ana.allergies ? "bg-red-50 border-red-400" : "bg-slate-50 border-slate-200"}`}>
                  <Label className={`flex items-center gap-2 font-bold ${ana.allergies ? "text-red-700" : "text-[#103444]"}`}>
                    {ana.allergies && <AlertTriangle className="h-4 w-4" />} Alergias conhecidas
                  </Label>
                  <Textarea
                    value={ana.allergies || ""}
                    onChange={e => setAnaField("allergies", e.target.value)}
                    placeholder="Ex: penicilina, latex, anestésicos..."
                    className={`mt-2 ${ana.allergies ? "border-red-400 bg-white" : ""}`}
                  />
                </div>

                <div>
                  <Label>Medicações em uso</Label>
                  <Textarea value={ana.medications || ""} onChange={e => setAnaField("medications", e.target.value)} placeholder="Liste medicamentos e dosagens" className="mt-2" />
                </div>

                <div>
                  <Label className="text-[#103444] font-bold">Condições / Doenças</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {DISEASE_OPTIONS.map(d => (
                      <label key={d} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={ana.diseases?.includes(d)} onCheckedChange={() => toggleDisease(d)} />
                        <span className="text-sm capitalize text-[#103444]">{d}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#103444] font-bold">Hábitos e sintomas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {[
                      ["smoker", "Fumante"], ["alcohol", "Consome álcool"], ["bruxism", "Bruxismo"],
                      ["current_pain", "Dor atual"], ["gum_bleeding", "Sangramento gengival"],
                      ["sensitivity", "Sensibilidade"], ["surgeries", "Cirurgias prévias"],
                    ].map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={!!ana[k]} onCheckedChange={v => setAnaField(k, !!v)} />
                        <span className="text-sm text-[#103444]">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white border-t border-amber-400/30 flex justify-end">
                  <Button
                    onClick={() => saveAnamnese.mutate()}
                    disabled={saveAnamnese.isPending}
                    className="bg-[#103444] hover:bg-[#0a232d] border border-amber-500/60 gap-2"
                  >
                    {saveAnamnese.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Anamnese
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="odonto">
            <Card className="bg-white border-amber-400/30">
              <CardContent className="p-6 space-y-6">
                <p className="text-sm text-[#103444]/70">
                  Clique em um dente para alternar seu estado: hígido → cariado → restaurado → coroa → canal → ausente.
                </p>

                <div className="space-y-3 py-4">
                  <div className="flex justify-center gap-1 flex-wrap">
                    {UPPER_TEETH.map(n => <Tooth key={n} n={n} />)}
                  </div>
                  <div className="border-t border-dashed border-[#103444]/20 mx-8" />
                  <div className="flex justify-center gap-1 flex-wrap">
                    {LOWER_TEETH.map(n => <Tooth key={n} n={n} />)}
                  </div>
                </div>

                <div>
                  <Label className="text-[#103444] font-bold mb-2 block">Legenda</Label>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(TOOTH_STATES).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className={`h-5 w-5 rounded border-2 ${v.color}`} />
                        <span className="text-xs text-[#103444]">{v.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white border-t border-amber-400/30 flex justify-end">
                  <Button
                    onClick={() => saveOdontogram.mutate()}
                    disabled={saveOdontogram.isPending}
                    className="bg-[#103444] hover:bg-[#0a232d] border border-amber-500/60 gap-2"
                  >
                    {saveOdontogram.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Odontograma
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
