import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, CalendarIcon, ChevronLeft, ChevronRight, Film, Image, MessageSquare, Video } from "lucide-react";
import { toast } from "sonner";

const contentTypes = [
  { value: "reels", label: "Reels", icon: Film },
  { value: "story", label: "Story", icon: MessageSquare },
  { value: "post", label: "Post", icon: Image },
  { value: "video", label: "Vídeo", icon: Video },
];

const statusOptions = [
  { value: "planejado", label: "Planejado", color: "bg-muted text-muted-foreground" },
  { value: "em_producao", label: "Em produção", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "postado", label: "Postado", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
];

const PlanejamentoConteudo = () => {
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("post");
  const [theme, setTheme] = useState("");
  const [status, setStatus] = useState("planejado");
  const [notes, setNotes] = useState("");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: contents = [] } = useQuery({
    queryKey: ["content-calendar", clinicId, format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from("content_calendar")
        .select("*")
        .eq("clinic_id", clinicId)
        .gte("scheduled_date", format(monthStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(monthEnd, "yyyy-MM-dd"))
        .order("scheduled_date");
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId || !selectedDate) return;
      const { error } = await supabase.from("content_calendar").insert({
        clinic_id: clinicId,
        title,
        content_type: contentType,
        theme: theme || null,
        status,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
      toast.success("Conteúdo cadastrado!");
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar conteúdo"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("content_calendar").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
      toast.success("Status atualizado!");
    },
  });

  const resetForm = () => {
    setTitle("");
    setContentType("post");
    setTheme("");
    setStatus("planejado");
    setNotes("");
    setSelectedDate(undefined);
    setDialogOpen(false);
  };

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getStatusBadge = (s: string) => {
    const opt = statusOptions.find((o) => o.value === s);
    return opt ? <Badge className={cn("text-[10px]", opt.color)}>{opt.label}</Badge> : null;
  };

  const getTypeIcon = (t: string) => {
    const ct = contentTypes.find((c) => c.value === t);
    return ct ? <ct.icon className="h-3 w-3" /> : null;
  };

  const counts = {
    planejado: contents.filter((c) => c.status === "planejado").length,
    em_producao: contents.filter((c) => c.status === "em_producao").length,
    postado: contents.filter((c) => c.status === "postado").length,
  };

  return (
    <AppLayout title="Planejamento de Conteúdo" subtitle="Organize sua presença digital">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 text-xs">
              <span className="text-muted-foreground">Planejados: <strong>{counts.planejado}</strong></span>
              <span className="text-yellow-600">Produção: <strong>{counts.em_producao}</strong></span>
              <span className="text-green-600">Postados: <strong>{counts.postado}</strong></span>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo conteúdo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Conteúdo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Dica de clareamento" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {contentTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Tema</Label>
                    <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex: Estética dental" />
                  </div>
                  <div>
                    <Label>Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !selectedDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Observação</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ideia do conteúdo, roteiro rápido..." />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                    <Button onClick={() => createMutation.mutate()} disabled={!title || !selectedDate || createMutation.isPending}>
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 bg-muted">
            {weekDays.map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="border-t border-r min-h-[100px] bg-muted/30" />
            ))}
            {days.map((day) => {
              const dayContents = contents.filter((c) => isSameDay(new Date(c.scheduled_date + "T12:00:00"), day));
              return (
                <div key={day.toISOString()} className="border-t border-r min-h-[100px] p-1">
                  <span className={cn("text-xs font-medium", isSameDay(day, new Date()) && "bg-primary text-primary-foreground rounded-full px-1.5 py-0.5")}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayContents.map((c) => (
                      <div
                        key={c.id}
                        className="text-[10px] p-1 rounded bg-card border cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          const nextStatus = c.status === "planejado" ? "em_producao" : c.status === "em_producao" ? "postado" : "planejado";
                          updateStatusMutation.mutate({ id: c.id, newStatus: nextStatus });
                        }}
                        title="Clique para alterar status"
                      >
                        <div className="flex items-center gap-1">
                          {getTypeIcon(c.content_type)}
                          <span className="truncate font-medium">{c.title}</span>
                        </div>
                        {getStatusBadge(c.status)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PlanejamentoConteudo;
