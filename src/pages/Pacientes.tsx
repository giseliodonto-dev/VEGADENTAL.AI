import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClinic } from "@/hooks/useClinic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, UserPlus, MessageCircle, UserCircle, Briefcase, Loader2, Phone } from "lucide-react";

export default function Pacientes() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Estados do Cadastro
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");

  // 1. Busca a lista de pacientes do banco
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // 2. Filtro de busca
  const filtered = useMemo(() => {
    return patients.filter(p =>
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone || "").includes(searchTerm)
    );
  }, [patients, searchTerm]);

  // 3. FUNÇÃO DE SALVAR
  const addMut = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Clínica não identificada. Recarregue a página.");
      const { error } = await supabase.from("patients").insert({
        clinic_id: clinicId,
        name: name.trim(),
        phone: phone.trim(),
        // Profissão é guardada em "origin" (campo livre existente)
        origin: occupation.trim() || null,
        status: 'lead'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente cadastrado com sucesso no VEGA!");
      queryClient.invalidateQueries({ queryKey: ["patients-list"] });
      setIsAddOpen(false);
      setName(""); setPhone(""); setOccupation("");
    },
    onError: (e: any) => toast.error("Erro ao salvar: " + e.message)
  });

  return (
    <AppLayout title="Central de Pacientes" subtitle="Gestão de leads e novos cadastros">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Nome ou celular do paciente..." 
              className="pl-10 h-12 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 bg-[#103444] hover:bg-[#0a232d] gap-2 px-6 shadow-lg">
                <UserPlus className="h-5 w-5" /> Cadastrar Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#103444]">Novo Paciente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Maria Souza" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp (com DDD)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11988887777" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occ">Profissão</Label>
                  <Input id="occ" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Ex: Advogada" />
                </div>
                <Button 
                  className="w-full bg-[#103444] h-12 mt-4" 
                  onClick={() => addMut.mutate()} 
                  disabled={!name || !phone || addMut.isPending}
                >
                  {addMut.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Finalizar Cadastro"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3">
          {isLoading ? (
            <div className="flex flex-col items-center py-20 text-slate-400">
              <Loader2 className="animate-spin h-10 w-10 mb-2" />
              <p>Carregando prontuários...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-all border-l-4 border-l-[#103444]">
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#103444]/5 flex items-center justify-center">
                      <UserCircle className="h-8 w-8 text-[#103444]/40" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg leading-tight">{p.name}</p>
                      <div className="flex gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {p.origin || "N/I"}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => window.open(`https://wa.me/55${p.phone?.replace(/\D/g,'')}`)}
                    >
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </Button>
                    <Button variant="secondary" className="bg-slate-100 text-[#103444]">
                      Ver Ficha
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Nenhum paciente cadastrado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
