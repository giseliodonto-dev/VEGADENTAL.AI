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
import { Users, UserPlus, Crown, Stethoscope, PhoneCall, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Briefcase, Radio } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Member {
  id: string;
  user_id: string;
  role: AppRole;
  profile?: { full_name: string | null; email: string | null };
}

const roleLabels: Record<AppRole, string> = {
  dono: "Dono",
  recepcao: "Recepção",
  dentista: "Dentista",
  crm: "CRM",
  sdr: "SDR",
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  dono: <Crown className="h-3.5 w-3.5" />,
  recepcao: <PhoneCall className="h-3.5 w-3.5" />,
  dentista: <Stethoscope className="h-3.5 w-3.5" />,
  crm: <Briefcase className="h-3.5 w-3.5" />,
  sdr: <Radio className="h-3.5 w-3.5" />,
};

const roleBadgeVariant: Record<AppRole, "default" | "secondary" | "outline"> = {
  dono: "default",
  recepcao: "secondary",
  dentista: "outline",
  crm: "secondary",
  sdr: "outline",
};

const Usuarios = () => {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member form
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("dentista");
  const [adding, setAdding] = useState(false);

  async function fetchMembers() {
    if (!clinicId) return;
    const { data } = await supabase
      .from("clinic_members")
      .select("id, user_id, role")
      .eq("clinic_id", clinicId);

    if (!data) { setLoading(false); return; }

    // Fetch profiles for each member
    const userIds = data.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const enriched: Member[] = data.map((m) => ({
      ...m,
      profile: profileMap.get(m.user_id) || undefined,
    }));

    setMembers(enriched);
    setLoading(false);
  }

  useEffect(() => { fetchMembers(); }, [clinicId]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId || !email.trim()) return;
    setAdding(true);

    // Find user by email in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (!profile) {
      toast.error("Usuário não encontrado. Ele precisa criar uma conta primeiro.");
      setAdding(false);
      return;
    }

    // Check if already a member
    const existing = members.find((m) => m.user_id === profile.id);
    if (existing) {
      toast.error("Esse usuário já é membro desta clínica.");
      setAdding(false);
      return;
    }

    const { error } = await supabase
      .from("clinic_members")
      .insert({ clinic_id: clinicId, user_id: profile.id, role });

    if (error) {
      toast.error("Erro ao adicionar: " + error.message);
    } else {
      toast.success(`${roleLabels[role]} adicionado com sucesso!`);
      setEmail("");
      await fetchMembers();
    }
    setAdding(false);
  }

  async function handleRemove(memberId: string, memberUserId: string) {
    if (memberUserId === user?.id) {
      toast.error("Você não pode remover a si mesmo.");
      return;
    }
    const { error } = await supabase
      .from("clinic_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast.error("Erro ao remover: " + error.message);
    } else {
      toast.success("Membro removido.");
      await fetchMembers();
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
              {members.length} {members.length === 1 ? "membro" : "membros"} vinculados a esta clínica.
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleRemove(m.id, m.user_id)}
                    >
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

        {/* Add member */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              Adicionar Membro
            </CardTitle>
            <CardDescription>
              O usuário precisa ter uma conta no VEGA para ser adicionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    E-mail do usuário
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@email.com"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Função
                  </Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dono">
                        <span className="flex items-center gap-2"><Crown className="h-3.5 w-3.5" /> Dono</span>
                      </SelectItem>
                      <SelectItem value="recepcao">
                        <span className="flex items-center gap-2"><PhoneCall className="h-3.5 w-3.5" /> Recepção</span>
                      </SelectItem>
                      <SelectItem value="dentista">
                        <span className="flex items-center gap-2"><Stethoscope className="h-3.5 w-3.5" /> Dentista</span>
                      </SelectItem>
                      <SelectItem value="crm">
                        <span className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> CRM</span>
                      </SelectItem>
                      <SelectItem value="sdr">
                        <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5" /> SDR</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={adding || !email.trim()} className="h-11 gap-2">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /><span>Adicionar</span></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Usuarios;