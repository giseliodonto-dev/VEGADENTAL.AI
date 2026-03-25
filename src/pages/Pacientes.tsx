import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  MessageCircle,
  CalendarPlus,
  Eye,
  Pencil,
  Loader2,
  Contact,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  lead: { label: "Lead", variant: "default" },
  em_avaliacao: { label: "Avaliação", variant: "secondary" },
  em_tratamento: { label: "Tratamento", variant: "outline" },
  finalizado: { label: "Finalizado", variant: "secondary" },
  perdido: { label: "Perdido", variant: "destructive" },
  ausente: { label: "Ausente", variant: "destructive" },
  desistente: { label: "Desistente", variant: "destructive" },
};

const statusOptions = [
  { value: "lead", label: "Lead" },
  { value: "em_avaliacao", label: "Em Avaliação" },
  { value: "em_tratamento", label: "Em Tratamento" },
  { value: "finalizado", label: "Finalizado" },
  { value: "perdido", label: "Perdido" },
];

const stageFromStatus: Record<string, string> = {
  lead: "lead",
  em_avaliacao: "avaliacao",
  em_tratamento: "proposta",
  finalizado: "fechado",
  perdido: "perdido",
};

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  status: string;
  treatment_value: number | null;
  responsible_user_id: string | null;
  responsible_name?: string;
}

export default function Pacientes() {
  const { clinicId, loading: clinicLoading } = useClinic();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Edit dialog
  const [editing, setEditing] = useState<Patient | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editOrigin, setEditOrigin] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!clinicId) return;
    fetchPatients();
  }, [clinicId, search, filterStatus]);

  async function fetchPatients() {
    if (!clinicId) return;
    setLoading(true);

    let query = supabase
      .from("patients")
      .select("id, name, phone, origin, status, treatment_value, responsible_user_id")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
    }

    if (filterStatus) {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Erro ao carregar pacientes");
      setLoading(false);
      return;
    }

    // Fetch responsible names
    const userIds = [...new Set((data || []).map((p) => p.responsible_user_id).filter(Boolean))] as string[];
    let profileMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      profiles?.forEach((p) => {
        profileMap[p.id] = p.full_name || "Sem nome";
      });
    }

    setPatients(
      (data || []).map((p) => ({
        ...p,
        responsible_name: p.responsible_user_id ? profileMap[p.responsible_user_id] || "—" : "—",
      }))
    );
    setLoading(false);
  }

  function openEdit(patient: Patient) {
    setEditing(patient);
    setEditName(patient.name);
    setEditPhone(patient.phone || "");
    setEditOrigin(patient.origin || "");
    setEditStatus(patient.status);
    setEditValue(patient.treatment_value?.toString() || "");
  }

  async function saveEdit() {
    if (!editing || !clinicId) return;
    setSaving(true);

    const { error } = await supabase
      .from("patients")
      .update({
        name: editName.trim(),
        phone: editPhone.trim() || null,
        origin: editOrigin || null,
        status: editStatus,
        treatment_value: editValue ? parseFloat(editValue) : 0,
      })
      .eq("id", editing.id);

    if (error) {
      toast.error("Erro ao atualizar paciente");
      setSaving(false);
      return;
    }

    // Sync sales_funnel stage
    const newStage = stageFromStatus[editStatus];
    if (newStage) {
      await supabase
        .from("sales_funnel")
        .update({ stage: newStage, value: editValue ? parseFloat(editValue) : 0 })
        .eq("patient_id", editing.id)
        .eq("clinic_id", clinicId);
    }

    toast.success("Paciente atualizado!");
    setSaving(false);
    setEditing(null);
    fetchPatients();
  }

  function openWhatsApp(phone: string | null) {
    if (!phone) return toast.error("Paciente sem telefone cadastrado");
    const clean = phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${clean}`, "_blank");
  }

  if (clinicLoading) {
    return (
      <AppLayout title="Pacientes" subtitle="CRM da clínica">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Pacientes" subtitle="Gestão completa dos seus pacientes">
      <div className="space-y-5">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button asChild className="gap-2 bg-vendas hover:bg-vendas/90 text-vendas-foreground">
            <Link to="/cadastro-paciente">
              <UserPlus className="h-4 w-4" />
              Novo Paciente
            </Link>
          </Button>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            className={`cursor-pointer ${!filterStatus ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            onClick={() => setFilterStatus(null)}
          >
            Todos
          </Badge>
          {statusOptions.map((s) => (
            <Badge
              key={s.value}
              className={`cursor-pointer ${filterStatus === s.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              onClick={() => setFilterStatus(filterStatus === s.value ? null : s.value)}
            >
              {s.label}
            </Badge>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
              <Contact className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Nenhum paciente encontrado</p>
              <p className="text-xs text-muted-foreground/60">Comece cadastrando seu primeiro paciente</p>
            </div>
            <Button asChild size="sm" className="gap-2 mt-2">
              <Link to="/cadastro-paciente">
                <UserPlus className="h-4 w-4" />
                Cadastrar Paciente
              </Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => {
                  const sc = statusConfig[p.status] || { label: p.status, variant: "outline" as const };
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {p.phone || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {p.origin || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {p.responsible_name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                        {p.treatment_value
                          ? `R$ ${Number(p.treatment_value).toLocaleString("pt-BR")}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openWhatsApp(p.phone)}
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toast.info("Agenda em breve")}
                            title="Agendar"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                            title="Ver no funil"
                          >
                            <Link to="/vendas/funil">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                            title="Ver ficha"
                          >
                            <Link to={`/pacientes/${p.id}`}>
                              <Eye className="h-4 w-4 text-primary" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(p)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar paciente — {editing?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Valor do tratamento (R$)</Label>
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
