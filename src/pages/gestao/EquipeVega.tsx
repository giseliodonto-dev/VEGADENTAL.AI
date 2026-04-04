import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { UserPlus, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Equipe() {
  const { clinicId } = useClinic();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Busca quem já faz parte da clínica (Sem travar no cache!)
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["clinic-members", clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_members")
        .select("*")
        .eq("clinic_id", clinicId);
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId,
  });

  // 2. Função de Gerar Convite (A única que importa!)
  const handleInvite = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: { email, clinicId, role: 'dentist' }
      });
      if (error) throw error;
      toast.success("Convite enviado com sucesso!");
      setEmail("");
    } catch (e: any) {
      toast.error("Erro ao enviar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Minha Equipe" subtitle="Gerencie acessos de dentistas e secretárias">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* TOPO COM BOTÃO DE CONVITE */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-[#103444]">Gerenciar Acessos</h3>
            <p className="text-sm text-slate-500">Adicione novos colaboradores à sua clínica.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#103444] hover:bg-[#0a232d] gap-2">
                <UserPlus className="h-5 w-5" /> Convidar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Convite de Acesso</DialogTitle>
              </DialogHeader>
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
                <Button 
                  className="w-full bg-[#103444]" 
                  onClick={handleInvite}
                  disabled={!email || loading}
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Gerar Link de Acesso"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* LISTA DE MEMBROS ATUAIS */}
        <div className="grid gap-4">
          <h4 className="font-semibold text-slate-700 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" /> Colaboradores Ativos
          </h4>
          
          {isLoading ? (
            <p className="text-slate-400 text-center py-10">Buscando equipe...</p>
          ) : members.length > 0 ? (
            members.map((m: any) => (
              <Card key={m.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-full"><Mail className="h-5 w-5 text-slate-400" /></div>
                    <p className="font-medium text-slate-800">{m.user_email || "E-mail não informado"}</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase font-bold">
                    {m.role}
                  </span>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400">Nenhum colaborador cadastrado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-slate-700">{children}</label>;
}
