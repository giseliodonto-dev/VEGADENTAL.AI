import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ProcedureSelector } from "@/components/ProcedureSelector";
import { ChevronLeft, ChevronRight, CalendarCheck, DollarSign, AlertTriangle, Clock, Plus, User } from "lucide-react";
import { buildWhatsAppUrl, formatWhatsAppPhone } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);
const DAYS_COUNT = 6;
const SLOTS_PER_DAY = 8;

type Appointment = {
  id: string;
  date: string;
  time: string;
  status: string;
  procedure_type: string | null;
  estimated_value: number | null;
  duration_minutes: number | null;
  notes: string | null;
  patient_id: string | null;
  dentist_user_id: string | null;
  patient?: { name: string; phone: string | null } | null;
};

type Dentist = { id: string; name: string; role: string };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-700 border-green-200" },
  faltou: { label: "Faltou", color: "bg-red-100 text-red-700 border-red-200" },
  remarcado: { label: "Remarcado", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  cancelou: { label: "Cancelado", color: "bg-muted text-muted-foreground border-border line-through" },
};

const DENTIST_COLORS = [
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-cyan-500",
];

function getDentistColor(dentistId: string | null, dentists: Dentist[]) {
  if (!dentistId) return "border-l-muted-foreground";
  const idx = dentists.findIndex((d) => d.id === dentistId);
  return DENTIST_COLORS[idx % DENTIST_COLORS.length];
}

function getDentistInitials(dentistId: string | null, dentists: Dentist[]) {
  if (!dentistId) return "?";
  const d = dentists.find((x) => x.id === dentistId);
  if (!d) return "?";
  return d.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

function buildConfirmationMessage(apt: Appointment) {
  const firstName = apt.patient?.name?.split(" ")[0] ?? "";
  const dateLabel = format(new Date(apt.date + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const timeLabel = apt.time.substring(0, 5);
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";
  return `${greeting} Tudo bem? Passando para confirmar sua consulta na ${dateLabel} às ${timeLabel}. Podemos contar com sua presença? 😊`;
}

const AgendaVega = () => {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filterDentist, setFilterDentist] = useState<string>("all");
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newForm, setNewForm] = useState({ patient_id: "", procedure_type: "", estimated_value: "", dentist_user_id: "", duration_minutes: "60", notes: "" });
  const [mobileDay, setMobileDay] = useState(0);

  // Auto-select logged-in user as dentist when opening new appointment dialog
  const handleOpenNewSlot = (slot: { date: string; time: string }) => {
    const userIsDentist = dentists.some((d) => d.id === user?.id);
    setNewForm({
      patient_id: "", procedure_type: "", estimated_value: "",
      dentist_user_id: userIsDentist ? user!.id : "",
      duration_minutes: "60", notes: "",
    });
    setSelectedSlot(slot);
  };

  const weekDays = useMemo(() => Array.from({ length: DAYS_COUNT }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = weekDays[weekDays.length - 1];

  const { data: appointments = [] } = useQuery({
    queryKey: ["agenda", clinicId, format(weekStart, "yyyy-MM-dd"), filterDentist],
    queryFn: async () => {
      if (!clinicId) return [];
      let q = supabase
        .from("appointments")
        .select("*, patient:patients(name, phone)")
        .eq("clinic_id", clinicId)
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"))
        .order("time");
      if (filterDentist !== "all") q = q.eq("dentist_user_id", filterDentist);
      const { data } = await q;
      return (data || []) as Appointment[];
    },
    enabled: !!clinicId,
  });

  const { data: dentists = [] } = useQuery({
    queryKey: ["dentists", clinicId],
    queryFn: async (): Promise<Dentist[]> => {
      if (!clinicId) return [];
      const { data: mems, error } = await supabase
        .from("clinic_members")
        .select("user_id, role, is_active")
        .eq("clinic_id", clinicId)
        .in("role", ["dono", "dentista", "admin"]);
      if (error) throw error;
      const active = (mems ?? []).filter((m) => m.is_active !== false);
      const ids = active.map((m) => m.user_id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      return active.map((m) => {
        const p = byId.get(m.user_id);
        return {
          id: m.user_id,
          name: p?.full_name || p?.email || "Sem nome",
          role: m.role,
        };
      });
    },
    enabled: !!clinicId,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-select", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("patients").select("id, name").eq("clinic_id", clinicId).order("name");
      return data || [];
    },
    enabled: !!clinicId,
  });

  const createMutation = useMutation({
    mutationFn: async (slot: { date: string; time: string }) => {
      if (!clinicId) throw new Error("Sem clínica");
      const { error } = await supabase.from("appointments").insert({
        clinic_id: clinicId,
        date: slot.date,
        time: slot.time,
        status: "confirmado",
        patient_id: newForm.patient_id || null,
        procedure_type: newForm.procedure_type || null,
        estimated_value: newForm.estimated_value ? Number(newForm.estimated_value) : 0,
        dentist_user_id: newForm.dentist_user_id || null,
        duration_minutes: Number(newForm.duration_minutes) || 60,
        notes: newForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Agendamento criado!");
      setSelectedSlot(null);
      setNewForm({ patient_id: "", procedure_type: "", estimated_value: "", dentist_user_id: "", duration_minutes: "60", notes: "" });
    },
    onError: (e: any) => {
      console.error("Erro ao criar agendamento:", e);
      toast.error("Erro ao criar agendamento: " + (e?.message ?? "desconhecido"));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Status atualizado!");
      setSelectedAppointment(null);
    },
  });

  // Multi-dentist appointment map: key → array
  const appointmentMap = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((a) => {
      const hourKey = a.time.substring(0, 2);
      const key = `${a.date}_${hourKey}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [appointments]);

  // KPIs scaled by number of dentists
  const numDentists = Math.max(dentists.length, 1);
  const totalSlots = filterDentist === "all"
    ? DAYS_COUNT * SLOTS_PER_DAY * numDentists
    : DAYS_COUNT * SLOTS_PER_DAY;
  const activeAppts = appointments.filter((a) => a.status !== "cancelou");
  const occupied = activeAppts.length;
  const occupancyRate = totalSlots > 0 ? Math.round((occupied / totalSlots) * 100) : 0;
  const estimatedProduction = activeAppts.reduce((s, a) => s + (a.estimated_value || 0), 0);
  const noShows = appointments.filter((a) => a.status === "faltou").length;
  const noShowRate = occupied > 0 ? Math.round((noShows / occupied) * 100) : 0;
  const freeSlots = totalSlots - occupied;

  // Per-dentist occupancy for alerts
  const dentistAlerts = useMemo(() => {
    if (filterDentist !== "all") return [];
    const perDentist = DAYS_COUNT * SLOTS_PER_DAY;
    const alerts: { text: string; action: string; link?: string }[] = [];
    dentists.forEach((d) => {
      const count = activeAppts.filter((a) => a.dentist_user_id === d.id).length;
      const rate = Math.round((count / perDentist) * 100);
      if (rate < 40) {
        alerts.push({ text: `${d.name} está com agenda ociosa (${rate}%)`, action: "Agendar follow-ups", link: "/vendas/follow-up" });
      } else if (rate > 85) {
        alerts.push({ text: `${d.name} com alta demanda (${rate}%)`, action: "Redistribuir pacientes" });
      }
    });
    return alerts;
  }, [dentists, activeAppts, filterDentist]);

  // General alerts
  const generalAlerts = useMemo(() => {
    const alerts: { text: string; action: string; link?: string }[] = [];
    if (freeSlots > totalSlots * 0.4) alerts.push({ text: `${freeSlots} horários livres esta semana`, action: "Preencher com follow-up", link: "/vendas/follow-up" });
    if (noShows > 0) alerts.push({ text: `${noShows} paciente(s) faltaram esta semana`, action: "Remarcar" });
    return alerts;
  }, [freeSlots, totalSlots, noShows]);

  const allAlerts = [...dentistAlerts, ...generalAlerts];

  return (
    <AppLayout title="Agenda VEGA" subtitle="Gestão inteligente de horários">
      <div className="space-y-4 max-w-6xl">
        {/* Navigation + Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => subWeeks(w, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoje</Button>
            <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addWeeks(w, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {format(weekStart, "dd MMM", { locale: ptBR })} — {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
          </span>
          <div className="ml-auto">
            <Select value={filterDentist} onValueChange={setFilterDentist}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <User className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({numDentists})</SelectItem>
                {dentists.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Ocupação", value: `${occupancyRate}%`, icon: CalendarCheck, color: occupancyRate >= 70 ? "text-green-600" : "text-yellow-600" },
            { label: "Produção Est.", value: `R$ ${estimatedProduction.toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-blue-600" },
            { label: "Faltas", value: `${noShowRate}%`, icon: AlertTriangle, color: noShowRate > 15 ? "text-red-600" : "text-green-600" },
            { label: "Slots Livres", value: String(freeSlots), icon: Clock, color: "text-muted-foreground" },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-lg font-bold font-display ${kpi.color}`}>{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Grid — Desktop */}
        <Card className="hidden lg:block overflow-x-auto">
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="p-2 w-16 text-left text-muted-foreground font-normal">Hora</th>
                  {weekDays.map((d) => (
                    <th key={d.toISOString()} className={`p-2 text-center font-medium ${isToday(d) ? "bg-primary/5" : ""}`}>
                      <span className="block text-muted-foreground uppercase">{format(d, "EEE", { locale: ptBR })}</span>
                      <span className={`block text-sm ${isToday(d) ? "text-primary font-bold" : ""}`}>{format(d, "dd")}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((h) => (
                  <tr key={h} className="border-b last:border-0">
                    <td className="p-2 text-muted-foreground font-mono">{String(h).padStart(2, "0")}:00</td>
                    {weekDays.map((d) => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const hourStr = String(h).padStart(2, "0");
                      const apts = appointmentMap[`${dateStr}_${hourStr}`] || [];
                      return (
                        <td
                          key={dateStr + h}
                          className={`p-1 border-l align-top ${isToday(d) ? "bg-primary/5" : ""} ${apts.length === 0 ? "hover:bg-accent cursor-pointer" : ""}`}
                          onClick={() => {
                            if (apts.length === 0) handleOpenNewSlot({ date: dateStr, time: `${hourStr}:00` });
                          }}
                        >
                          {apts.length > 0 ? (
                            <div className="space-y-1">
                              {apts.map((apt) => (
                                <div
                                  key={apt.id}
                                  className={`rounded-md p-1.5 text-left border-l-[3px] cursor-pointer ${STATUS_CONFIG[apt.status]?.color || "bg-muted"} ${getDentistColor(apt.dentist_user_id, dentists)}`}
                                  onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}
                                >
                                  <div className="flex items-center gap-1">
                                    {filterDentist === "all" && (
                                      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-background text-[8px] font-bold flex-shrink-0">
                                        {getDentistInitials(apt.dentist_user_id, dentists)}
                                      </span>
                                    )}
                                    <p className="font-medium truncate text-[11px]">{apt.patient?.name || "—"}</p>
                                  </div>
                                  <p className="text-[10px] opacity-70 truncate">{apt.procedure_type || ""}</p>
                                </div>
                              ))}
                              <div
                                className="text-center cursor-pointer hover:bg-accent rounded p-0.5"
                                onClick={(e) => { e.stopPropagation(); handleOpenNewSlot({ date: dateStr, time: `${hourStr}:00` }); }}
                              >
                                <Plus className="h-3 w-3 mx-auto text-muted-foreground/40" />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30 flex justify-center items-center h-8"><Plus className="h-3 w-3" /></span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Mobile — single day */}
        <div className="lg:hidden space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {weekDays.map((d, i) => (
              <Button key={i} variant={mobileDay === i ? "default" : "outline"} size="sm" className="flex-shrink-0" onClick={() => setMobileDay(i)}>
                <span className="uppercase text-[10px]">{format(d, "EEE", { locale: ptBR })}</span>
                <span className="ml-1 font-bold">{format(d, "dd")}</span>
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            {HOURS.map((h) => {
              const d = weekDays[mobileDay];
              const dateStr = format(d, "yyyy-MM-dd");
              const hourStr = String(h).padStart(2, "0");
              const apts = appointmentMap[`${dateStr}_${hourStr}`] || [];
              return (
                <div key={h} className="rounded-lg border">
                  <div
                    className={`flex items-center gap-3 p-3 ${apts.length === 0 ? "cursor-pointer hover:bg-accent" : ""}`}
                    onClick={() => { if (apts.length === 0) handleOpenNewSlot({ date: dateStr, time: `${hourStr}:00` }); }}
                  >
                    <span className="text-xs font-mono text-muted-foreground w-12">{hourStr}:00</span>
                    {apts.length === 0 && <span className="text-xs text-muted-foreground/50">Horário livre</span>}
                    {apts.length > 0 && <span className="text-xs text-muted-foreground">{apts.length} atendimento(s)</span>}
                  </div>
                  {apts.length > 0 && (
                    <div className="px-3 pb-3 space-y-2">
                      {apts.map((apt) => (
                        <div
                          key={apt.id}
                          className={`flex items-center gap-3 rounded-md p-2 cursor-pointer border-l-[3px] ${STATUS_CONFIG[apt.status]?.color || "bg-muted"} ${getDentistColor(apt.dentist_user_id, dentists)}`}
                          onClick={() => setSelectedAppointment(apt)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{apt.patient?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {getDentistInitials(apt.dentist_user_id, dentists)} · {apt.procedure_type || ""}
                            </p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_CONFIG[apt.status]?.color || ""}`}>
                            {STATUS_CONFIG[apt.status]?.label || apt.status}
                          </Badge>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => handleOpenNewSlot({ date: dateStr, time: `${hourStr}:00` })}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        {allAlerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold font-display">Alertas da Semana</h3>
            {allAlerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <span className="flex-1 text-yellow-800">{a.text}</span>
                {a.link ? (
                  <Button variant="outline" size="sm" className="text-xs" asChild><a href={a.link}>{a.action}</a></Button>
                ) : (
                  <span className="text-xs text-yellow-600 font-medium">{a.action}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dialog: New Appointment */}
        <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
            {selectedSlot && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedSlot.date + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })} às {selectedSlot.time}
                </p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Paciente</Label>
                    <Select value={newForm.patient_id} onValueChange={(v) => setNewForm((f) => ({ ...f, patient_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Procedimento</Label>
                    <ProcedureSelector
                      value={newForm.procedure_type}
                      onSelect={(p) => {
                        setNewForm((f) => ({
                          ...f,
                          procedure_type: p.name,
                          estimated_value: p.default_value > 0 && !f.estimated_value ? String(p.default_value) : f.estimated_value,
                        }));
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Valor estimado (R$)</Label>
                      <Input type="number" value={newForm.estimated_value} onChange={(e) => setNewForm((f) => ({ ...f, estimated_value: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Duração (min)</Label>
                      <Input type="number" value={newForm.duration_minutes} onChange={(e) => setNewForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Profissional</Label>
                    <Select value={newForm.dentist_user_id} onValueChange={(v) => setNewForm((f) => ({ ...f, dentist_user_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{dentists.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Observações</Label>
                    <Textarea value={newForm.notes} onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSlot(null)}>Cancelar</Button>
              <Button onClick={() => selectedSlot && createMutation.mutate(selectedSlot)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Agendar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Appointment Details */}
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Detalhes do Agendamento</DialogTitle></DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{selectedAppointment.patient?.name || "Paciente não vinculado"}</p>
                    <Badge variant="outline" className={STATUS_CONFIG[selectedAppointment.status]?.color || ""}>
                      {STATUS_CONFIG[selectedAppointment.status]?.label || selectedAppointment.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(selectedAppointment.date + "T12:00:00"), "EEEE, dd/MM", { locale: ptBR })} às {selectedAppointment.time.substring(0, 5)}
                  </p>
                  {selectedAppointment.dentist_user_id && (
                    <p className="text-sm">Profissional: {dentists.find((d) => d.id === selectedAppointment.dentist_user_id)?.name || "—"}</p>
                  )}
                  {selectedAppointment.procedure_type && <p className="text-sm">Procedimento: {selectedAppointment.procedure_type}</p>}
                  {(selectedAppointment.estimated_value ?? 0) > 0 && <p className="text-sm">Valor: R$ {selectedAppointment.estimated_value?.toLocaleString("pt-BR")}</p>}
                  {selectedAppointment.notes && <p className="text-xs text-muted-foreground">{selectedAppointment.notes}</p>}
                </div>
                <div>
                  <p className="text-xs font-medium mb-2">Alterar status:</p>
                  <div className="flex flex-wrap gap-2">
                    {(["confirmado", "faltou", "remarcado", "cancelou"] as const).map((s) => (
                      <Button key={s} variant="outline" size="sm" className="text-xs" disabled={selectedAppointment.status === s}
                        onClick={() => updateStatusMutation.mutate({ id: selectedAppointment.id, status: s })}>
                        {STATUS_CONFIG[s].label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default AgendaVega;
