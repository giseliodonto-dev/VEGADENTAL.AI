import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Users, Plus, UserCog, Trash2 } from "lucide-react";

const EquipeVega = () => {
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("dentista");

  // Busca quem está autorizado
  const { data: members = [] } = useQuery({
    queryKey: ["equipe-members", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase
        .from("clinic_members")
        .select("id, role, email_autorizado")
        .eq("clinic_id", clinicId);
      return data || [];
    },
    enabled: !!clinicId,
  });

  // LIBERAR ACESSO (O MÉTODO FÁCIL)
  const addMemberMut = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Sem clínica vinculada");
      const { error } = await supabase.from("clinic_members").insert({
        clinic_id: clinicId,
        role: formRole,
        email_autorizado: formEmail.trim().toLowerCase(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("E-mail autorizado! O colaborador já pode criar a conta dele.");
      queryClient.invalidateQueries({ queryKey: ["equipe-members"] });
      setAddOpen(false);
      setFormEmail("");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  // REMOVER ACESSO
  const removeMember = async (id: string) => {
    const { error } = await supabase.from("clinic_members").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else {
      toast.success("Acesso removido");
      queryClient.invalidateQueries({ queryKey: ["equipe-members"] });
    }
  };

  return (
    <AppLayout title="Equipe" subtitle="Gerencie quem acessa sua clínica">
      <div className="max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5" /> Colaboradores Autorizados
          </h2>
          <Button onClick={() => setAddOpen(true)} className="gap-2 bg-[#103444]">
            <Plus className="h-4 w-4" /> Liberar Novo Acesso
          </Button>
        </div>

        <div className="grid gap-3">
          {members.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-slate-100 text-slate-600 uppercase">
                      {m.role[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{m.email_autorizado || "Membro Ativo"}</p>
                    <p className="text-xs text-muted-foreground uppercase font-bold">{m.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardContent>
            </Card>
          ))}

          {members.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
              <UserCog className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>Nenhum acesso liberado. Comece clicando no botão acima.</p>
            </div>
          )}
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Liberar Acesso</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>E-mail do Colaborador</Label>
                <Input placeholder="exemplo@clinica.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dentista">Dentista</SelectItem>
                    <SelectItem value="sdr">SDR / Comercial</SelectItem>
                    <SelectItem value="recepcao">Recepção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button onClick={() => addMemberMut.mutate()} disabled={!formEmail || addMemberMut.isPending} className="bg-[#103444]">
                {addMemberMut.isPending ? "Salvando..." : "Autorizar Agora"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default EquipeVega;
