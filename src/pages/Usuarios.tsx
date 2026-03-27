import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Crown, Stethoscope, PhoneCall, Loader2, Trash2, Copy, Check, Link2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Briefcase, Radio, Shield, Wrench } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Member {
  id: string;
  user_id: string;
  role: AppRole;
  profile?: { full_name: string | null; email: string | null };
}

interface Invite {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  token: string;
  created_at: string;
}

const roleLabels: Record<AppRole, string> = {
  dono: "Dono",
  recepcao: "Recepção",
  dentista: "Dentista",
  crm: "CRM",
  sdr: "SDR",
  admin: "Admin",
  protetico: "Protético",
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  dono: <Crown className="h-3.5 w-3.5" />,
  recepcao: <PhoneCall className="h-3.5 w-3.5" />,
  dentista: <Stethoscope className="h-3.5 w-3.5" />,
  crm: <Briefcase className="h-3.5 w-3.5" />,
  sdr: <Radio className="h-3.5 w-3.5" />,
  admin: <Shield className="h-3.5 w-3.5" />,
  protetico: <Wrench className="h-3.5 w-3.5" />,
};

const roleBadgeVariant: Record<AppRole, "default" | "secondary" | "outline"> = {
  dono: "default",
  recepcao: "secondary",
  dentista: "outline",
  crm: "secondary",
  sdr: "outline",
  admin: "default",
  protetico: "secondary",
};

const Usuarios = () => {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Invite form
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("dentista");
  const [adding, setAdding] = useState(false);

  async function fetchData() {
    if (!clinicId) return;

    // Fetch members
    const { data: membersData } = await supabase
      .from("clinic_members")
      .select("id, user_id, role")
      .eq("clinic_id", clinicId);

    if (membersData) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      setMembers(membersData.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) || undefined,
      })));
    }

    // Fetch pending invites
    const { data: invitesData } = await supabase
      .from("invites")
      .select("id, email, role, status, token, created_at")
      .eq("clinic_id", clinicId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setInvites(invitesData || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [clinicId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId || !email.trim() || !user) return;
    setAdding(true);

    // Check if already a member by email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      const isMember = members.find((m) => m.user_id === existingProfile.id);
      if (isMember) {
        toast.error("Esse usuário já é membro desta clínica.");
        setAdding(false);
        return;
      }
    }

    const { data: invite, error } = await supabase
      .from("invites")
      .insert({
        clinic_id: clinicId,
        email: email.trim().toLowerCase(),
        role,
        invited_by: user.id,
      })
      .select("token")
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("Já existe um convite pendente para este e-mail.");
      } else {
        toast.error("Erro ao criar convite: " + error.message);
      }
    } else {
      const link = `${window.location.origin}/convite/${invite.token}`;
      await navigator.clipboard.writeText(link);
      toast.success("Convite criado! Link copiado para a área de transferência.");
      setEmail("");
      await fetchData();
    }
    setAdding(false);
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedToken(null), 2000);
  }

  async function handleCancelInvite(inviteId: string) {
    const { error } = await supabase
      .from("invites")
      .update({ status: "cancelled" })
      .eq("id", inviteId);

    if (error) {
      toast.error("Erro ao cancelar: " + error.message);
    } else {
      toast.success("Convite cancelado.");
      await fetchData();
    }
  }

  async function handleRemove(memberId: string, memberUserId: string) {
    if (memberUserId === user?.id) {
      toast.error("Você não pode remover a si mesmo.");
      return;
    }
    const { error } = await supabase.from("clinic_members").delete().eq("id", memberId);
    if (error) {
      toast.error("Erro ao remover: " + error.message);
    } else {
      toast.success("Membro removido.");
      await fetchData();
    }
  }

  if (loading) {
    return (
      <AppLayout title="Usuários">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Usuários">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Members list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Equipe da Clínica
            </CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? "membro" : "membros"} vinculados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {m.profile?.full_name || "Sem nome"}
                      {m.user_id === user?.id && (
                        <span className="text-xs text-muted-foreground ml-1">(você)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{m.profile?.email || "—"}</p>
                  </div>
                  <Badge variant={roleBadgeVariant[m.role]} className="gap-1 shrink-0">
                    {roleIcons[m.role]}
                    {roleLabels[m.role]}
                  </Badge>
                  {m.user_id !== user?.id && (
                    <Button variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleRemove(m.id, m.user_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum membro encontrado.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending invites */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-amber-500" />
                Convites Pendentes
              </CardTitle>
              <CardDescription>
                {invites.length} {invites.length === 1 ? "convite aguardando" : "convites aguardando"} aceitação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Enviado em {new Date(inv.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant={roleBadgeVariant[inv.role]} className="gap-1 shrink-0">
                      {roleIcons[inv.role]}
                      {roleLabels[inv.role]}
                    </Badge>
                    <Button variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground shrink-0"
                      onClick={() => copyInviteLink(inv.token)}>
                      {copiedToken === inv.token ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleCancelInvite(inv.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send invite */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-primary" />
              Convidar Membro
            </CardTitle>
            <CardDescription>
              Um link de convite será gerado para o e-mail informado. Envie o link para a pessoa criar a conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    E-mail do convidado
                  </Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@email.com" required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Função
                  </Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dono"><span className="flex items-center gap-2"><Crown className="h-3.5 w-3.5" /> Dono</span></SelectItem>
                      <SelectItem value="recepcao"><span className="flex items-center gap-2"><PhoneCall className="h-3.5 w-3.5" /> Recepção</span></SelectItem>
                      <SelectItem value="dentista"><span className="flex items-center gap-2"><Stethoscope className="h-3.5 w-3.5" /> Dentista</span></SelectItem>
                      <SelectItem value="crm"><span className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> CRM</span></SelectItem>
                      <SelectItem value="sdr"><span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5" /> SDR</span></SelectItem>
                      <SelectItem value="admin"><span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Admin</span></SelectItem>
                      <SelectItem value="protetico"><span className="flex items-center gap-2"><Wrench className="h-3.5 w-3.5" /> Protético</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={adding || !email.trim()} className="h-11 gap-2">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /><span>Gerar Convite</span></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Usuarios;