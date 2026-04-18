import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, CalendarIcon, Megaphone, TrendingUp, DollarSign, Target } from "lucide-react";
import { toast } from "sonner";

const channels = [
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google Ads" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "outros", label: "Outros" },
];

const Campanhas = () => {
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("instagram");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [investment, setInvestment] = useState("");
  const [notes, setNotes] = useState("");

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId || !startDate) return;
      const { error } = await supabase.from("campaigns").insert({
        clinic_id: clinicId,
        name,
        channel,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        investment: Number(investment) || 0,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campanha criada!");
      resetForm();
    },
    onError: () => toast.error("Erro ao criar campanha"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("campaigns").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campanha atualizada!");
    },
  });

  const resetForm = () => {
    setName("");
    setChannel("instagram");
    setStartDate(new Date());
    setEndDate(undefined);
    setInvestment("");
    setNotes("");
    setDialogOpen(false);
  };

  const activeCampaigns = campaigns.filter((c) => c.status === "ativa");
  const totalInvestment = campaigns.reduce((s, c) => s + Number(c.investment || 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads_generated || 0), 0);
  const totalSales = campaigns.reduce((s, c) => s + (c.sales_closed || 0), 0);

  return (
    <AppLayout title="Campanhas" subtitle="Controle suas ações de marketing">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Megaphone className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Campanhas Ativas</p>
              <p className="text-2xl font-bold">{activeCampaigns.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <DollarSign className="h-5 w-5 text-red-500 mb-2" />
              <p className="text-xs text-muted-foreground">Investido</p>
              <p className="text-2xl font-bold">R$ {totalInvestment.toLocaleString("pt-BR")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Target className="h-5 w-5 text-blue-500 mb-2" />
              <p className="text-xs text-muted-foreground">Leads Gerados</p>
              <p className="text-2xl font-bold">{totalLeads}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <TrendingUp className="h-5 w-5 text-green-500 mb-2" />
              <p className="text-xs text-muted-foreground">Vendas Fechadas</p>
              <p className="text-2xl font-bold">{totalSales}</p>
            </CardContent>
          </Card>
        </div>

        {/* New Campaign Button */}
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Nova Campanha</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Campanha *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promoção Clareamento Março" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Canal</Label>
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {channels.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Investimento (R$)</Label>
                    <Input type="number" value={investment} onChange={(e) => setInvestment(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd/MM/yyyy") : "Data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Fim (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd/MM/yyyy") : "Data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <Label>Observação</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes da campanha..." />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button onClick={() => createMutation.mutate()} disabled={!name || !startDate || createMutation.isPending}>
                    Criar Campanha
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaigns List */}
        <div className="space-y-3">
          {campaigns.map((c) => {
            const roi = c.investment && c.investment > 0 && c.sales_closed
              ? (((c.sales_closed * 1000) - Number(c.investment)) / Number(c.investment) * 100).toFixed(0)
              : null;

            return (
              <Card key={c.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{c.name}</h3>
                        <Badge className={c.status === "ativa" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}>
                          {c.status === "ativa" ? "Ativa" : "Finalizada"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {channels.find((ch) => ch.value === c.channel)?.label || c.channel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(c.start_date + "T12:00:00"), "dd/MM/yyyy")}
                        {c.end_date ? ` → ${format(new Date(c.end_date + "T12:00:00"), "dd/MM/yyyy")}` : " → em andamento"}
                      </p>
                      {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Investido</p>
                        <p className="font-semibold">R$ {Number(c.investment || 0).toLocaleString("pt-BR")}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Leads</p>
                        <Input
                          type="number"
                          className="w-16 h-8 text-center text-sm"
                          value={c.leads_generated || 0}
                          onChange={(e) => updateMutation.mutate({ id: c.id, updates: { leads_generated: Number(e.target.value) || 0 } })}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Vendas</p>
                        <Input
                          type="number"
                          className="w-16 h-8 text-center text-sm"
                          value={c.sales_closed || 0}
                          onChange={(e) => updateMutation.mutate({ id: c.id, updates: { sales_closed: Number(e.target.value) || 0 } })}
                        />
                      </div>
                      {roi && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">ROI</p>
                          <p className={cn("font-bold", Number(roi) > 0 ? "text-green-600" : "text-red-500")}>{roi}%</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMutation.mutate({
                          id: c.id,
                          updates: { status: c.status === "ativa" ? "finalizada" : "ativa" },
                        })}
                      >
                        {c.status === "ativa" ? "Finalizar" : "Reativar"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {campaigns.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhuma campanha cadastrada. Crie a primeira!</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Campanhas;
