import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClinic } from "@/hooks/useClinic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  UserPlus,
  CalendarPlus,
  Handshake,
  Stethoscope,
  Loader2,
} from "lucide-react";

type PostAction = "stay" | "agenda" | "negociacao" | "atendimento";

const origins = [
  "Instagram",
  "Google",
  "Indicação",
  "Facebook",
  "WhatsApp",
  "Outros",
];

const statuses = [
  { value: "lead", label: "Lead" },
  { value: "em_avaliacao", label: "Em Avaliação" },
  { value: "em_tratamento", label: "Em Tratamento" },
  { value: "ausente", label: "Ausente" },
  { value: "desistente", label: "Desistente" },
];

export default function CadastroPaciente() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clinicId, loading: clinicLoading } = useClinic();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [origin, setOrigin] = useState("");
  const [status, setStatus] = useState("lead");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  async function handleSubmit(action: PostAction) {
    if (!canSubmit || !clinicId || !user) return;

    setSaving(true);
    try {
      // 1. Create patient
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          origin: origin || null,
          status,
          clinic_id: clinicId,
          responsible_user_id: user.id,
        })
        .select("id")
        .single();

      if (patientError) throw patientError;

      // 2. Auto-create sales funnel entry as "lead"
      const { error: funnelError } = await supabase
        .from("sales_funnel")
        .insert({
          patient_id: patient.id,
          clinic_id: clinicId,
          stage: "lead",
          responsible_user_id: user.id,
        });

      if (funnelError) throw funnelError;

      toast.success("Paciente cadastrado com sucesso!");

      // 3. Navigate based on action
      switch (action) {
        case "agenda":
          navigate("/gestao");
          break;
        case "negociacao":
          navigate("/vendas");
          break;
        case "atendimento":
          navigate("/gestao");
          break;
        default:
          // Reset form
          setName("");
          setPhone("");
          setOrigin("");
          setStatus("lead");
          setNotes("");
      }
    } catch (err: any) {
      toast.error("Erro ao cadastrar paciente: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  }

  if (clinicLoading) {
    return (
      <AppLayout title="Cadastro Rápido" subtitle="Novo paciente">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Cadastro Rápido" subtitle="Novo paciente em segundos">
      <div className="max-w-lg mx-auto space-y-6">
        <div
          className="animate-fade-up"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cadastre o paciente durante a ligação ou conversa no WhatsApp. Apenas nome e telefone são obrigatórios.
          </p>
        </div>

        <Card
          className="animate-fade-up"
          style={{ animationDelay: "100ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <CardContent className="pt-6 space-y-5">
            {/* Required fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nome do paciente"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-medium">
                  Telefone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Optional fields */}
            <div className="border-t pt-4 space-y-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                Opcional — preencha depois se precisar
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="origin" className="text-xs font-medium">
                    Origem
                  </Label>
                  <Select value={origin} onValueChange={setOrigin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {origins.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-medium">
                    Status
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-medium">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Anotações rápidas sobre o paciente..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div
          className="animate-fade-up grid grid-cols-1 sm:grid-cols-3 gap-3"
          style={{ animationDelay: "200ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <Button
            onClick={() => handleSubmit("atendimento")}
            disabled={!canSubmit || saving}
            className="bg-vendas hover:bg-vendas/90 text-vendas-foreground gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4" />}
            Cadastrar e Atender
          </Button>

          <Button
            onClick={() => handleSubmit("agenda")}
            disabled={!canSubmit || saving}
            variant="outline"
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Cadastrar e Agendar
          </Button>

          <Button
            onClick={() => handleSubmit("negociacao")}
            disabled={!canSubmit || saving}
            variant="outline"
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
            Cadastrar e Negociar
          </Button>
        </div>

        {/* Quick add another */}
        <div
          className="animate-fade-up text-center"
          style={{ animationDelay: "300ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <Button
            onClick={() => handleSubmit("stay")}
            disabled={!canSubmit || saving}
            variant="ghost"
            className="gap-2 text-muted-foreground"
          >
            <UserPlus className="h-4 w-4" />
            Cadastrar e adicionar outro
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
