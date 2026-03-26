import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Minus, ArrowUpCircle, ArrowDownCircle, Wallet, Trash2, DollarSign, Users, FileDown,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { generateFinanceReportPdf } from "@/utils/financeReportPdf";

const ENTRY_CATEGORIES = ["recebimento", "consulta", "procedimento", "outros"];
const EXIT_CATEGORIES = ["aluguel", "materiais", "laboratório", "salários", "comissao", "energia", "água", "internet", "marketing", "impostos", "manutenção", "outros"];
const PAYMENT_METHODS = ["pix", "dinheiro", "cartão_crédito", "cartão_débito", "boleto", "transferência"];
const STATUS_OPTIONS = ["pago", "pendente"];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type FinancialRecord = {
  id: string;
  type: string;
  value: number;
  category: string | null;
  description: string | null;
  date: string;
  payment_method: string | null;
  status: string;
  responsible_user_id: string | null;
};

export default function Financeiro() {
  const { clinicId } = useClinic();
  const qc = useQueryClient();
  const [tab, setTab] = useState("caixa");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"entrada" | "saida">("entrada");
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Form state
  const [formValue, setFormValue] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("pix");
  const [formStatus, setFormStatus] = useState("pago");
  const [formDate, setFormDate] = useState(selectedDate);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["financeiro"] });
  };

  // Daily records
  const { data: dailyRecords = [] } = useQuery({
    queryKey: ["financeiro", "daily", clinicId, selectedDate],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("financials")
        .select("*")
        .eq("clinic_id", clinicId!)
        .eq("date", selectedDate)
        .order("created_at", { ascending: false });
      return (data || []) as FinancialRecord[];
    },
  });

  // Period records
  const { data: periodRecords = [] } = useQuery({
    queryKey: ["financeiro", "period", clinicId, periodStart, periodEnd],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("financials")
        .select("*")
        .eq("clinic_id", clinicId!)
        .gte("date", periodStart)
        .lte("date", periodEnd)
        .order("date", { ascending: false });
      return (data || []) as FinancialRecord[];
    },
  });

  // Clinic members
  const { data: members = [] } = useQuery({
    queryKey: ["financeiro", "members", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_members")
        .select("*, profiles:user_id(full_name)")
        .eq("clinic_id", clinicId!)
        .eq("is_active", true);
      return data || [];
    },
  });

  // Treatments for commission calculation (completed in period)
  const { data: treatments = [] } = useQuery({
    queryKey: ["financeiro", "treatments", clinicId, periodStart, periodEnd],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("treatments")
        .select("*")
        .eq("clinic_id", clinicId!)
        .gte("date", periodStart)
        .lte("date", periodEnd)
        .in("status", ["concluido", "em_andamento"]);
      return data || [];
    },
  });

  // Payments received in period for commission basis
  const { data: payments = [] } = useQuery({
    queryKey: ["financeiro", "payments", clinicId, periodStart, periodEnd],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("clinic_id", clinicId!)
        .gte("payment_date", periodStart)
        .lte("payment_date", periodEnd);
      return data || [];
    },
  });

  // Commission payments already made
  const commissionPayments = periodRecords.filter(
    r => r.type === "saida" && (r.category || "").toLowerCase() === "comissao"
  );

  // Daily totals
  const dailyTotals = useMemo(() => {
    const entries = dailyRecords.filter(r => r.type === "entrada").reduce((s, r) => s + Number(r.value), 0);
    const exits = dailyRecords.filter(r => r.type === "saida").reduce((s, r) => s + Number(r.value), 0);
    return { entries, exits, balance: entries - exits };
  }, [dailyRecords]);

  // Commission data per member
  const commissionData = useMemo(() => {
    return members.map((m: any) => {
      const memberTreatments = treatments.filter((t: any) => t.dentist_user_id === m.user_id);
      const production = memberTreatments.reduce((s: number, t: any) => s + Number(t.value || 0), 0);
      const rate = Number(m.commission_rate || 0) / 100;
      // Scaled: if production > 10000 and rate > 0, apply 5% bonus above 10k
      let commission = 0;
      if (rate > 0) {
        if (production <= 10000) {
          commission = production * rate;
        } else {
          commission = 10000 * rate + (production - 10000) * (rate + 0.05);
        }
      }
      const paid = commissionPayments
        .filter(cp => cp.responsible_user_id === m.user_id)
        .reduce((s, cp) => s + Number(cp.value), 0);
      return {
        ...m,
        name: m.profiles?.full_name || "Sem nome",
        production,
        rate: Number(m.commission_rate || 0),
        commission: Math.round(commission * 100) / 100,
        paid,
        pending: Math.max(0, Math.round((commission - paid) * 100) / 100),
      };
    }).filter((m: any) => m.rate > 0 || m.production > 0);
  }, [members, treatments, commissionPayments]);

  const resetForm = () => {
    setFormValue("");
    setFormCategory("");
    setFormDescription("");
    setFormPaymentMethod("pix");
    setFormStatus("pago");
    setFormDate(selectedDate);
    setEditingRecord(null);
  };

  const openNewDialog = (type: "entrada" | "saida") => {
    resetForm();
    setDialogType(type);
    setFormDate(selectedDate);
    setDialogOpen(true);
  };

  const openEditDialog = (record: FinancialRecord) => {
    setEditingRecord(record);
    setDialogType(record.type as "entrada" | "saida");
    setFormValue(String(record.value));
    setFormCategory(record.category || "");
    setFormDescription(record.description || "");
    setFormPaymentMethod(record.payment_method || "pix");
    setFormStatus(record.status);
    setFormDate(record.date);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!clinicId || !formValue || !formCategory) {
      toast.error("Preencha valor e categoria");
      return;
    }
    const payload = {
      clinic_id: clinicId,
      type: dialogType,
      value: parseFloat(formValue),
      category: formCategory,
      description: formDescription || null,
      payment_method: formPaymentMethod,
      status: formStatus,
      date: formDate,
    };

    if (editingRecord) {
      const { error } = await supabase.from("financials").update(payload).eq("id", editingRecord.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Registro atualizado");
    } else {
      const { error } = await supabase.from("financials").insert(payload);
      if (error) { toast.error("Erro ao criar registro"); return; }
      toast.success("Registro criado");
    }
    setDialogOpen(false);
    resetForm();
    invalidate();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("financials").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluído");
    invalidate();
  };

  const handlePayCommission = async (member: any) => {
    if (!clinicId || member.pending <= 0) return;
    const { error } = await supabase.from("financials").insert({
      clinic_id: clinicId,
      type: "saida",
      value: member.pending,
      category: "comissao",
      description: `Comissão - ${member.name} (${member.role})`,
      payment_method: "pix",
      status: "pago",
      date: format(new Date(), "yyyy-MM-dd"),
      responsible_user_id: member.user_id,
    });
    if (error) { toast.error("Erro ao pagar comissão"); return; }
    toast.success(`Comissão de ${fmt(member.pending)} paga para ${member.name}`);
    invalidate();
  };

  const categories = dialogType === "entrada" ? ENTRY_CATEGORIES : EXIT_CATEGORIES;

  const RecordRow = ({ r }: { r: FinancialRecord }) => (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-2">
          {r.type === "entrada" ? (
            <ArrowUpCircle className="h-4 w-4 text-success shrink-0" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <span className="text-xs capitalize">{r.category || "—"}</span>
        </div>
      </TableCell>
      <TableCell className="text-xs">{r.description || "—"}</TableCell>
      <TableCell className="text-xs">{r.date}</TableCell>
      <TableCell className="text-xs capitalize">{(r.payment_method || "").replace("_", " ")}</TableCell>
      <TableCell>
        <Badge variant={r.status === "pago" ? "default" : "secondary"} className="text-[10px]">
          {r.status}
        </Badge>
      </TableCell>
      <TableCell className={`text-sm font-semibold ${r.type === "entrada" ? "text-success" : "text-destructive"}`}>
        {r.type === "entrada" ? "+" : "-"}{fmt(Number(r.value))}
      </TableCell>
      <TableCell>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEditDialog(r)}>
            Editar
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={() => handleDelete(r.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const roleLabel: Record<string, string> = {
    dono: "Dono",
    dentista: "Dentista",
    recepcao: "Recepção",
    crm: "CRM",
    sdr: "SDR",
  };

  const handleExportPdf = async () => {
    if (!clinicId) return;
    // Fetch clinic name
    const { data: clinic } = await supabase.from("clinics").select("name").eq("id", clinicId).single();
    const clinicName = clinic?.name || "Clínica";

    const entries = periodRecords.filter(r => r.type === "entrada").map(r => ({
      category: r.category || "outros",
      description: r.description || "",
      date: r.date,
      value: Number(r.value),
      payment_method: r.payment_method || "",
      status: r.status,
    }));

    const exits = periodRecords.filter(r => r.type === "saida").map(r => ({
      category: r.category || "outros",
      description: r.description || "",
      date: r.date,
      value: Number(r.value),
      payment_method: r.payment_method || "",
      status: r.status,
    }));

    const commissions = commissionData.map((m: any) => ({
      name: m.name,
      role: roleLabel[m.role] || m.role,
      production: m.production,
      rate: m.rate,
      commission: m.commission,
      paid: m.paid,
      pending: m.pending,
    }));

    const doc = generateFinanceReportPdf({
      clinicName,
      periodLabel: `${periodStart} a ${periodEnd}`,
      entries,
      exits,
      commissions,
    });

    doc.save(`relatorio-financeiro-${periodStart}-${periodEnd}.pdf`);
    toast.success("Relatório PDF gerado com sucesso");
  };

  return (
    <AppLayout title="Financeiro" subtitle="Controle operacional de receitas, despesas e comissões">
      <div className="max-w-6xl space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="caixa" className="text-xs">
              <Wallet className="h-3.5 w-3.5 mr-1.5" />Caixa do Dia
            </TabsTrigger>
            <TabsTrigger value="receitas" className="text-xs">
              <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />Receitas
            </TabsTrigger>
            <TabsTrigger value="despesas" className="text-xs">
              <ArrowDownCircle className="h-3.5 w-3.5 mr-1.5" />Despesas
            </TabsTrigger>
            <TabsTrigger value="comissoes" className="text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" />Comissões
            </TabsTrigger>
          </TabsList>

          {/* ===== CAIXA DO DIA ===== */}
          <TabsContent value="caixa" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-44"
              />
              <Button size="sm" onClick={() => openNewDialog("entrada")} className="bg-success hover:bg-success/90 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" /> Nova Entrada
              </Button>
              <Button size="sm" variant="destructive" onClick={() => openNewDialog("saida")}>
                <Minus className="h-3.5 w-3.5 mr-1" /> Nova Saída
              </Button>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-3">
              <Card><CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground">Entradas</p>
                <p className="text-lg font-bold text-success">{fmt(dailyTotals.entries)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground">Saídas</p>
                <p className="text-lg font-bold text-destructive">{fmt(dailyTotals.exits)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground">Saldo</p>
                <p className={`text-lg font-bold ${dailyTotals.balance >= 0 ? "text-success" : "text-destructive"}`}>
                  {fmt(dailyTotals.balance)}
                </p>
              </CardContent></Card>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Pagamento</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Nenhuma movimentação nesta data
                    </TableCell></TableRow>
                  ) : dailyRecords.map(r => <RecordRow key={r.id} r={r} />)}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ===== RECEITAS ===== */}
          <TabsContent value="receitas" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-40" />
              <span className="text-xs text-muted-foreground">até</span>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-40" />
              <Button size="sm" onClick={() => openNewDialog("entrada")} className="bg-success hover:bg-success/90 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" /> Nova Receita
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Pagamento</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodRecords.filter(r => r.type === "entrada").length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Nenhuma receita no período
                    </TableCell></TableRow>
                  ) : periodRecords.filter(r => r.type === "entrada").map(r => <RecordRow key={r.id} r={r} />)}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ===== DESPESAS ===== */}
          <TabsContent value="despesas" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-40" />
              <span className="text-xs text-muted-foreground">até</span>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-40" />
              <Button size="sm" variant="destructive" onClick={() => openNewDialog("saida")}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Nova Despesa
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Pagamento</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodRecords.filter(r => r.type === "saida").length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Nenhuma despesa no período
                    </TableCell></TableRow>
                  ) : periodRecords.filter(r => r.type === "saida").map(r => <RecordRow key={r.id} r={r} />)}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ===== COMISSÕES ===== */}
          <TabsContent value="comissoes" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-40" />
              <span className="text-xs text-muted-foreground">até</span>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-40" />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Comissão escalonada:</strong> até R$ 10.000 = taxa configurada • acima de R$ 10.000 = taxa + 5% bônus
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Profissional</TableHead>
                    <TableHead className="text-xs">Cargo</TableHead>
                    <TableHead className="text-xs">Produção</TableHead>
                    <TableHead className="text-xs">Taxa</TableHead>
                    <TableHead className="text-xs">Comissão</TableHead>
                    <TableHead className="text-xs">Pago</TableHead>
                    <TableHead className="text-xs">Pendente</TableHead>
                    <TableHead className="text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionData.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      Nenhum membro com comissão configurada
                    </TableCell></TableRow>
                  ) : commissionData.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs font-medium">{m.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {roleLabel[m.role] || m.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{fmt(m.production)}</TableCell>
                      <TableCell className="text-xs">{m.rate}%</TableCell>
                      <TableCell className="text-xs font-semibold">{fmt(m.commission)}</TableCell>
                      <TableCell className="text-xs text-success">{fmt(m.paid)}</TableCell>
                      <TableCell className={`text-xs font-semibold ${m.pending > 0 ? "text-warning" : "text-muted-foreground"}`}>
                        {fmt(m.pending)}
                      </TableCell>
                      <TableCell>
                        {m.pending > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] border-success text-success hover:bg-success/10"
                            onClick={() => handlePayCommission(m)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" /> Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ===== DIALOG ENTRADA/SAÍDA ===== */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm">
                {editingRecord ? "Editar" : "Nova"} {dialogType === "entrada" ? "Receita" : "Despesa"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Forma de pagamento</Label>
                  <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Data</Label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>
                {editingRecord ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
