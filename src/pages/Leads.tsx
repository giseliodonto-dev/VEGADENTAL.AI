import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, UserPlus, CalendarPlus, ArrowRightCircle,
  Pencil, Loader2, Phone,
} from "lucide-react";
import { openWhatsApp as openWA } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  novo: { label: "Novo", variant: "default" },
  em_contato: { label: "Em Contato", variant: "secondary" },
  agendado: { label: "Agendado", variant: "outline" },
  convertido: { label: "Convertido", variant: "secondary" },
  perdido: { label: "Perdido", variant: "destructive" },
};

const statusOptions = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em Contato" },
  { value: "agendado", label: "Agendado" },
  { value: "convertido", label: "Convertido" },
  { value: "perdido", label: "Perdido" },
];

interface Lead {
  id: string;
  name: string;
  contact: string | null;
  origin: string | null;
  status: string;
  entry_date: string;
  notes: string | null;
  responsible_user_id: string | null;
  responsible_name?: string;
}

export default function Leads() {
  const { clinicId, loading: clinicLoading } = useClinic();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Edit dialog
  const [editing, setEditing] = useState<Lead | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // New lead dialog
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Convert dialog
  const [converting, setConverting] = useState<Lead | null>(null);
  const [convertLoading, setConvertLoading] = useState(false);

  useEffect(() => {
    if (!clinicId) return;
    fetchLeads();
  }, [clinicId, search, filterStatus]);

  async function fetchLeads() {
    if (!clinicId) return;
    setLoading(true);

    let query = supabase
      .from("leads")
      .select("id, name, contact, origin, status, entry_date, notes, responsible_user_id")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,contact.ilike.%${search.trim()}%`);
    }

    if (filterStatus) {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Erro ao carregar leads");
      setLoading(false);
      return;
    }

    const userIds = [...new Set((data || []).map((l) => l.responsible_user_id).filter(Boolean))] as string[];
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

    setLeads(
      (data || []).map((l) => ({
        ...l,
        responsible_name: l.responsible_user_id ? profileMap[l.responsible_user_id] || "—" : "—",
      }))
    );
    setLoading(false);
  }

  async function createLead() {
    if (!clinicId || !user) return;
    if (!newName.trim()) return toast.error("Nome é obrigatório");
    if (!newContact.trim()) return toast.error("Contato é obrigatório");

    setCreating(true);
    const { error } = await supabase.from("leads").insert({
      clinic_id: clinicId,
      name: newName.trim(),
      contact: newContact.trim(),
      origin: newOrigin.trim() || null,
      notes: newNotes.trim() || null,
      responsible_user_id: user.id,
      status: "novo",
    });

    if (error) {
      toast.error("Erro ao criar lead");
      setCreating(false);
      return;
    }

    toast.success("Lead cadastrado!");
    setCreating(false);
    setShowNew(false);
    setNewName("");
    setNewContact("");
    setNewOrigin("");
    setNewNotes("");
    fetchLeads();
  }

  function openEdit(lead: Lead) {
    setEditing(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes || "");
  }

  async function saveEdit() {
    if (!editing || !clinicId) return;
    setSaving(true);

    const { error } = await supabase
      .from("leads")
      .update({ status: editStatus, notes: editNotes || null })
      .eq("id", editing.id);

    if (error) {
      toast.error("Erro ao atualizar lead");
      setSaving(false);
      return;
    }

    toast.success("Lead atualizado!");
    setSaving(false);
    setEditing(null);
    fetchLeads();
  }

  async function convertToPatient() {
    if (!converting || !clinicId || !user) return;
    setConvertLoading(true);

    // 1. Create patient
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        clinic_id: clinicId,
        name: converting.name,
        phone: converting.contact,
        origin: converting.origin,
        status: "lead",
        responsible_user_id: user.id,
      })
      .select("id")
      .single();

    if (patientError || !patient) {
      toast.error("Erro ao converter lead em paciente");
      setConvertLoading(false);
      return;
    }

    // 2. Create sales funnel entry
    await supabase.from("sales_funnel").insert({
      clinic_id: clinicId,
      patient_id: patient.id,
      stage: "lead",
      responsible_user_id: user.id,
      value: 0,
    });

    // 3. Update lead status to "convertido"
    await supabase
      .from("leads")
      .update({ status: "convertido" })
      .eq("id", converting.id);

    toast.success(`${converting.name} convertido em paciente!`);
    setConvertLoading(false);
    setConverting(null);
    fetchLeads();
  }

  function openWhatsApp(contact: string | null) {
    openWA(contact, "");
  }

  if (clinicLoading) {
    return (
      <AppLayout title="Leads" subtitle="Novos contatos da clínica">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Leads" subtitle="Gerencie novos contatos antes de se tornarem pacientes">
      <div className="space-y-5">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou contato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowNew(true)} className="gap-2 bg-vendas hover:bg-vendas/90 text-vendas-foreground">
            <UserPlus className="h-4 w-4" />
            Novo Lead
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
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum lead encontrado.
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Contato</TableHead>
                  <TableHead className="hidden md:table-cell">Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Entrada</TableHead>
                  <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => {
                  const sc = statusConfig[l.status] || { label: l.status, variant: "outline" as const };
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {l.contact || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {l.origin || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {new Date(l.entry_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {l.responsible_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => openWhatsApp(l.contact)}
                            title="WhatsApp"
                          >
                            <WhatsAppIcon size={16} bare bgColor="#16a34a" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => toast.info("Agenda em breve")}
                            title="Agendar avaliação"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                          {l.status !== "convertido" && (
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => setConverting(l)}
                              title="Converter em paciente"
                            >
                              <ArrowRightCircle className="h-4 w-4 text-vendas" />
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => openEdit(l)}
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

        {/* New Lead Dialog */}
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Nome *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do contato" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Contato (telefone/WhatsApp) *</Label>
                <Input value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="(11) 99999-0000" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Origem</Label>
                <Select value={newOrigin} onValueChange={setNewOrigin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Observações</Label>
                <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Informações adicionais..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={createLead} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Cadastrar Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar lead — {editing?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Observações</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Convert Dialog */}
        <Dialog open={!!converting} onOpenChange={(open) => !open && setConverting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Converter Lead em Paciente</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                O lead <span className="font-semibold text-foreground">{converting?.name}</span> será convertido em paciente e entrará automaticamente no funil de vendas como <span className="font-semibold text-vendas">Lead</span>.
              </p>
              <p className="text-xs text-muted-foreground">
                Os dados de nome, contato e origem serão aproveitados automaticamente.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConverting(null)}>Cancelar</Button>
              <Button onClick={convertToPatient} disabled={convertLoading} className="bg-vendas hover:bg-vendas/90 text-vendas-foreground">
                {convertLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Converter em Paciente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
