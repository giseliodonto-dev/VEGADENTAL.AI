import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  UserPlus,
  Mail,
  ShieldCheck,
  Loader2,
  Copy,
  MessageCircle,
  X,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { getPublicAppOrigin } from "@/lib/publicUrl";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "dentista", label: "Dentista" },
  { value: "recepcao", label: "Recepção" },
  { value: "crm", label: "CRM" },
  { value: "sdr", label: "SDR" },
  { value: "protetico", label: "Protético" },
  { value: "admin", label: "Admin" },
];

const ROLE_LABEL: Record<AppRole, string> = {
  dono: "Dono",
  dentista: "Dentista",
  recepcao: "Recepção",
  crm: "CRM",
  sdr: "SDR",
  protetico: "Protético",
  admin: "Admin",
};

export default function Equipe() {
  const { clinicId } = useClinic();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("dentista");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["clinic-members", clinicId],
    queryFn: async () => {
      const { data: mems, error } = await supabase
        .from("clinic_members")
        .select("id, role, user_id")
        .eq("clinic_id", clinicId!);
      if (error) throw error;
      const ids = (mems ?? []).map((m) => m.user_id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      if (pErr) throw pErr;
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      return (mems ?? []).map((m) => ({ ...m, profiles: byId.get(m.user_id) ?? null }));
    },
    enabled: !!clinicId,
  });

  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ["clinic-invites", clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invites")
        .select("id, email, role, token, created_at")
        .eq("clinic_id", clinicId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId,
  });

  const handleInvite = async () => {
    if (!clinicId) return;
    setLoading(true);
    setGeneratedLink(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        throw new Error("E-mail inválido");
      }

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user?.id) throw new Error("Sessão expirada");
      const userId = userData.user.id;

      // UPSERT atômico — cria ou reativa convite em uma única operação
      const { data: upserted, error: upErr } = await supabase
        .from("invites")
        .upsert(
          {
            clinic_id: clinicId,
            email: cleanEmail,
            role,
            invited_by: userId,
            status: "pending",
            accepted_at: null,
          },
          { onConflict: "clinic_id,email" },
        )
        .select("token")
        .single();
      if (upErr) throw upErr;

      const inviteUrl = `${getPublicAppOrigin()}/convite/${upserted.token}`;
      setGeneratedLink(inviteUrl);
      toast.success("Convite criado com sucesso!");
      qc.invalidateQueries({ queryKey: ["clinic-invites", clinicId] });
    } catch (e: any) {
      toast.error("Erro: " + (e.message ?? "falha ao criar convite"));
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setEmail("");
    setRole("dentista");
    setGeneratedLink(null);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado");
  };

  const whatsappUrl = (link: string) =>
    `https://wa.me/?text=${encodeURIComponent(
      `Você foi convidado(a) para acessar a clínica no VEGA Dental. Clique para entrar: ${link}`,
    )}`;

  const cancelInvite = async (id: string) => {
    const { error } = await supabase
      .from("invites")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast.error("Não foi possível cancelar: " + error.message);
      return;
    }
    toast.success("Convite cancelado");
    qc.invalidateQueries({ queryKey: ["clinic-invites", clinicId] });
  };

  const linkFor = (token: string) => `${getPublicAppOrigin()}/convite/${token}`;

  return (
    <AppLayout
      title="Minha Equipe"
      subtitle="Gerencie acessos de dentistas, recepção e demais cargos"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-card p-6 rounded-xl shadow-sm border">
          <div>
            <h3 className="text-lg font-bold text-primary">
              Gerenciar Acessos
            </h3>
            <p className="text-sm text-muted-foreground">
              Adicione novos colaboradores à sua clínica.
            </p>
          </div>

          <Dialog
            open={open}
            onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-5 w-5" /> Convidar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Link de Convite</DialogTitle>
              </DialogHeader>

              {!generatedLink ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>E-mail do Colaborador</Label>
                    <Input
                      type="email"
                      placeholder="exemplo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Select
                      value={role}
                      onValueChange={(v) => setRole(v as AppRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleInvite}
                    disabled={!email || loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      "Gerar Link de Acesso"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    O sistema <strong>não envia e-mail automático</strong>.
                    Copie o link abaixo e envie ao colaborador via WhatsApp,
                    e-mail manual ou outro canal de sua preferência.
                  </p>
                  <div className="flex gap-2">
                    <Input value={generatedLink} readOnly className="text-xs" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copy(generatedLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1 gap-2">
                      <a
                        href={whatsappUrl(generatedLink)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" /> Enviar via
                        WhatsApp
                      </a>
                    </Button>
                    <Button variant="outline" onClick={closeDialog}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* CONVITES PENDENTES */}
        <div className="grid gap-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" /> Convites Pendentes
          </h4>
          {loadingPending ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum convite pendente.
            </p>
          ) : (
            pending.map((inv: any) => (
              <Card key={inv.id}>
                <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-muted p-2 rounded-full">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {ROLE_LABEL[inv.role as AppRole] ?? inv.role}
                      </p>
                      <p className="text-[10px] text-muted-foreground italic">
                        Envio manual — sem e-mail automático
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copy(linkFor(inv.token))}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar link
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={whatsappUrl(linkFor(inv.token))}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelInvite(inv.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* MEMBROS ATIVOS */}
        <div className="grid gap-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" /> Colaboradores
            Ativos
          </h4>

          {loadingMembers ? (
            <p className="text-muted-foreground text-center py-10">
              Buscando equipe...
            </p>
          ) : members.length > 0 ? (
            members.map((m: any) => (
              <Card key={m.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {m.profiles?.full_name || m.profiles?.email || "—"}
                      </p>
                      {m.profiles?.email && (
                        <p className="text-xs text-muted-foreground">
                          {m.profiles.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded uppercase font-bold">
                    {ROLE_LABEL[m.role as AppRole] ?? m.role}
                  </span>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-muted/40 rounded-2xl border-2 border-dashed">
              <p className="text-muted-foreground">
                Nenhum colaborador cadastrado ainda.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
