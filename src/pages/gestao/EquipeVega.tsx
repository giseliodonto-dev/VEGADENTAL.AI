import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Users, DollarSign, TrendingUp, Percent, Plus, Eye, Edit, UserCog } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type PeriodFilter = "mensal" | "semanal";
type RoleFilter = "todos" | "sdr" | "dentista" | "administrativo";

const roleLabels: Record<string, string> = {
  dono: "Administrativo",
  recepcao: "Administrativo",
  dentista: "Dentista",
  crm: "SDR / Comercial",
  sdr: "SDR / Comercial",
};

const roleFilterMap: Record<RoleFilter, string[]> = {
  todos: [],
  sdr: ["crm", "sdr"],
  dentista: ["dentista"],
  administrativo: ["dono", "recepcao"],
};

const contractLabels: Record<string, string> = { pj: "PJ", clt: "CLT" };

const EquipeVega = () => {
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PeriodFilter>("mensal");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");
  const [addOpen, setAddOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<string | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("dentista");
  const [formContract, setFormContract] = useState("pj");
  const [formCommission, setFormCommission] = useState("20");

  // Edit form
  const [editRole, setEditRole] = useState("");
  const [editContract, setEditContract] = useState("");
  const [editCommission, setEditCommission] = useState("");
  const [editActive, setEditActive] = useState(true);

  const now = new Date();
  const dateRange = useMemo(() => {
    if (period === "mensal") {
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
    }
    return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd") };
  }, [period]);

  // Fetch members
  const { data: members = [] } = useQuery({
    queryKey: ["equipe-members", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase
        .from("clinic_members")
        .select("id, user_id, role, commission_rate, contract_type, is_active, profiles:user_id(full_name, email)")
        .eq("clinic_id", clinicId);
      return (data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role as string,
        commission_rate: Number(m.commission_rate) || 0,
        contract_type: (m.contract_type as string) || "pj",
        is_active: m.is_active !== false,
        name: m.profiles?.full_name || m.profiles?.email || "Sem nome",
        email: m.profiles?.email || "",
      }));
    },
    enabled: !!clinicId,
  });

  // Fetch production (appointments attended)
  const { data: production = [] } = useQuery({
    queryKey: ["equipe-production", clinicId, dateRange],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase
        .from("appointments")
        .select("dentist_user_id, estimated_value")
        .eq("clinic_id", clinicId)
        .eq("status", "atendido")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);
      return data || [];
    },
    enabled: !!clinicId,
  });

  // Fetch financials (for revenue by responsible)
  const { data: financials = [] } = useQuery({
    queryKey: ["equipe-financials", clinicId, dateRange],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase
        .from("financials")
        .select("responsible_user_id, value")
        .eq("clinic_id", clinicId)
        .eq("type", "entrada")
        .eq("status", "pago")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);
      return data || [];
    },
    enabled: !!clinicId,
  });

  // Fetch goals for performance thresholds
  const { data: goals } = useQuery({
    queryKey: ["equipe-goals", clinicId],
    queryFn: async () => {
      if (!clinicId) return null;
      const monthStr = format(startOfMonth(now), "yyyy-MM-dd");
      const { data } = await supabase
        .from("goals")
        .select("revenue_goal")
        .eq("clinic_id", clinicId)
        .eq("month", monthStr)
        .maybeSingle();
      return data;
    },
    enabled: !!clinicId,
  });

  // Calculate per-member stats
  const memberStats = useMemo(() => {
    const prodByUser: Record<string, number> = {};
    production.forEach((p) => {
      if (p.dentist_user_id) {
        prodByUser[p.dentist_user_id] = (prodByUser[p.dentist_user_id] || 0) + Number(p.estimated_value || 0);
      }
    });
    const finByUser: Record<string, number> = {};
    financials.forEach((f) => {
      if (f.responsible_user_id) {
        finByUser[f.responsible_user_id] = (finByUser[f.responsible_user_id] || 0) + Number(f.value || 0);
      }
    });

    return members.map((m) => {
      const prod = prodByUser[m.user_id] || finByUser[m.user_id] || 0;
      const commission = prod * (m.commission_rate / 100);
      const revenueGoal = Number(goals?.revenue_goal || 0);
      const memberGoal = revenueGoal > 0 ? revenueGoal / members.filter((x) => x.is_active).length : 0;
      let performance: "green" | "yellow" | "red" = "green";
      if (memberGoal > 0) {
        const ratio = prod / memberGoal;
        if (ratio < 0.6) performance = "red";
        else if (ratio < 0.9) performance = "yellow";
      }
      return { ...m, production: prod, commission, performance, memberGoal };
    });
  }, [members, production, financials, goals]);

  // Filtered members
  const filtered = useMemo(() => {
    let list = memberStats;
    if (roleFilter !== "todos") {
      const roles = roleFilterMap[roleFilter];
      list = list.filter((m) => roles.includes(m.role));
    }
    return list;
  }, [memberStats, roleFilter]);

  // Aggregates
  const totalRevenue = filtered.reduce((s, m) => s + m.production, 0);
  const totalCommissions = filtered.reduce((s, m) => s + m.commission, 0);
  const margin = totalRevenue - totalCommissions;
  const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

  // Chart data
  const chartData = filtered
    .filter((m) => m.production > 0)
    .sort((a, b) => b.production - a.production)
    .map((m) => ({ name: m.name.split(" ")[0], producao: m.production, comissao: m.commission }));

  // Add member mutation
  const addMemberMut = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Sem clínica");
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formEmail.trim().toLowerCase())
        .maybeSingle();
      if (!profile) throw new Error("Usuário não encontrado. O profissional precisa criar uma conta primeiro.");
      const { error } = await supabase.from("clinic_members").insert({
        clinic_id: clinicId,
        user_id: profile.id,
        role: formRole as any,
        commission_rate: Number(formCommission) || 0,
        contract_type: formContract,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["equipe-members"] });
      setAddOpen(false);
      setFormEmail("");
      setFormRole("dentista");
      setFormCommission("20");
      setFormContract("pj");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update member mutation
  const updateMemberMut = useMutation({
    mutationFn: async () => {
      if (!editMember) return;
      const { error } = await supabase
        .from("clinic_members")
        .update({
          role: editRole as any,
          commission_rate: Number(editCommission) || 0,
          contract_type: editContract,
          is_active: editActive,
        })
        .eq("id", editMember);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro atualizado!");
      queryClient.invalidateQueries({ queryKey: ["equipe-members"] });
      setEditMember(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (m: (typeof memberStats)[0]) => {
    setEditMember(m.id);
    setEditRole(m.role);
    setEditContract(m.contract_type);
    setEditCommission(String(m.commission_rate));
    setEditActive(m.is_active);
  };

  const detailData = detailMember ? memberStats.find((m) => m.id === detailMember) : null;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const perfBadge = (p: "green" | "yellow" | "red") => {
    if (p === "green") return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Acima da meta</Badge>;
    if (p === "yellow") return <Badge className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">Próximo da meta</Badge>;
    return <Badge variant="destructive">Abaixo da meta</Badge>;
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return (
    <AppLayout title="Equipe" subtitle="Performance e produtividade da equipe">
      <div className="max-w-6xl space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sdr">SDR / Comercial</SelectItem>
                <SelectItem value="dentista">Dentistas</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar membro
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[hsl(var(--info))]/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[hsl(var(--info))]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Colaboradores</p>
                  <p className="text-xl font-bold">{filtered.filter((m) => m.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-[hsl(var(--success))]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Faturamento equipe</p>
                  <p className="text-xl font-bold">{fmt(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[hsl(var(--warning))]/10 flex items-center justify-center">
                  <Percent className="h-4 w-4 text-[hsl(var(--warning))]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Comissões pagas</p>
                  <p className="text-xl font-bold">{fmt(totalCommissions)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gestao/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-gestao" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margem bruta</p>
                  <p className="text-xl font-bold">{fmt(margin)} <span className="text-sm font-normal text-muted-foreground">({marginPct.toFixed(0)}%)</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Produção por profissional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 20 }}>
                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                    <YAxis type="category" dataKey="name" fontSize={12} width={55} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="producao" fill="hsl(var(--info))" radius={[0, 4, 4, 0]} name="Produção" />
                    <Bar dataKey="comissao" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} name="Comissão" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} className={`transition-all ${!m.is_active ? "opacity-50" : ""}`}>
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gestao/10 text-gestao text-sm font-semibold">
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{roleLabels[m.role] || m.role} · {contractLabels[m.contract_type] || m.contract_type}</p>
                  </div>
                  {perfBadge(m.performance)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Produção</p>
                    <p className="text-sm font-bold">{fmt(m.production)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Comissão</p>
                    <p className="text-sm font-bold">{m.commission_rate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-sm font-bold">{fmt(m.commission)}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setDetailMember(m.id)}>
                    <Eye className="h-3 w-3" /> Detalhes
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(m)}>
                    <Edit className="h-3 w-3" /> Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <UserCog className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum membro encontrado</p>
          </div>
        )}

        {/* Add member dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar membro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>E-mail do profissional</Label>
                <Input placeholder="email@exemplo.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">O profissional precisa ter uma conta cadastrada.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cargo</Label>
                  <Select value={formRole} onValueChange={setFormRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dentista">Dentista</SelectItem>
                      <SelectItem value="sdr">SDR / Comercial</SelectItem>
                      <SelectItem value="recepcao">Recepção</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contratação</Label>
                  <Select value={formContract} onValueChange={setFormContract}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pj">PJ</SelectItem>
                      <SelectItem value="clt">CLT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input type="number" value={formCommission} onChange={(e) => setFormCommission(e.target.value)} min={0} max={100} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button onClick={() => addMemberMut.mutate()} disabled={!formEmail || addMemberMut.isPending}>
                {addMemberMut.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit member dialog */}
        <Dialog open={!!editMember} onOpenChange={(o) => !o && setEditMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar membro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cargo</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dentista">Dentista</SelectItem>
                      <SelectItem value="sdr">SDR / Comercial</SelectItem>
                      <SelectItem value="recepcao">Recepção</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="dono">Dono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contratação</Label>
                  <Select value={editContract} onValueChange={setEditContract}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pj">PJ</SelectItem>
                      <SelectItem value="clt">CLT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input type="number" value={editCommission} onChange={(e) => setEditCommission(e.target.value)} min={0} max={100} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="rounded" />
                <Label htmlFor="active">Membro ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditMember(null)}>Cancelar</Button>
              <Button onClick={() => updateMemberMut.mutate()} disabled={updateMemberMut.isPending}>
                {updateMemberMut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail dialog */}
        <Dialog open={!!detailMember} onOpenChange={(o) => !o && setDetailMember(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{detailData?.name || "Detalhes"}</DialogTitle>
            </DialogHeader>
            {detailData && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gestao/10 text-gestao font-semibold">
                      {initials(detailData.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{detailData.name}</p>
                    <p className="text-sm text-muted-foreground">{roleLabels[detailData.role]} · {contractLabels[detailData.contract_type]}</p>
                  </div>
                  {perfBadge(detailData.performance)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-xs text-muted-foreground">Produção {period === "mensal" ? "mensal" : "semanal"}</p>
                      <p className="text-lg font-bold">{fmt(detailData.production)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-xs text-muted-foreground">Meta individual</p>
                      <p className="text-lg font-bold">{fmt(detailData.memberGoal)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-xs text-muted-foreground">Taxa de comissão</p>
                      <p className="text-lg font-bold">{detailData.commission_rate}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-xs text-muted-foreground">Comissão gerada</p>
                      <p className="text-lg font-bold">{fmt(detailData.commission)}</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {detailData.memberGoal > 0
                      ? `Atingimento: ${((detailData.production / detailData.memberGoal) * 100).toFixed(0)}% da meta`
                      : "Meta não definida para o período"}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default EquipeVega;
