import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { Search, UserPlus, MessageCircle, UserCircle, Briefcase, Loader2, Phone, ChevronRight } from "lucide-react";

export default function Pacientes() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");

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

  const filtered = useMemo(() => {
    return patients.filter(p =>
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone || "").includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const addMut = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Clínica não identificada. Recarregue a página.");
      const phoneDigits = phone.replace(/\D+/g, "");
      if (phoneDigits.length < 10) {
        throw new Error("Telefone precisa ter DDD + número.");
      }
      const { data, error } = await supabase.from("patients").insert({
        clinic_id: clinicId,
        name: name.trim(),
        phone: phone.trim(),
        origin: occupation.trim() || null,
        status: 'lead'
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Paciente cadastrado! Abrindo ficha completa...");
      queryClient.invalidateQueries({ queryKey: ["patients-list"] });
      setIsAddOpen(false);
      setName(""); setPhone(""); setOccupation("");
      if (data?.id) navigate(`/pacientes/${data.id}`);
    },
    onError: (e: any) => toast.error("Erro ao salvar: " + e.message)
  });

  return (
    <AppLayout title="Central de Pacientes" subtitle="Prontuários e fichas completas">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#103444]/40" />
            <Input
              placeholder="Buscar por nome ou celular..."
              className="pl-10 h-12 shadow-sm border-[#103444]/10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 bg-[#103444] hover:bg-[#0a232d] gap-2 px-6 shadow-lg border border-amber-500/60">
                <UserPlus className="h-5 w-5" /> Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#103444]">Cadastro Rápido</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Maria Souza" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp (com DDD)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11988887777" />
                  <p className="text-xs text-[#103444]/50 leading-snug">
                    Digite com DDD. Para internacional, inclua o código do país (ex: 5511988887777).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occ">Profissão (opcional)</Label>
                  <Input id="occ" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Ex: Advogada" />
                </div>
                <Button
                  className="w-full bg-[#103444] h-12 mt-4 border border-amber-500/60"
                  onClick={() => addMut.mutate()}
                  disabled={!name || !phone || addMut.isPending}
                >
                  {addMut.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Cadastrar e abrir ficha"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center py-20 text-[#103444]/40">
              <Loader2 className="animate-spin h-10 w-10 mb-2" />
              <p>Carregando prontuários...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((p) => (
              <Card
                key={p.id}
                onClick={() => navigate(`/pacientes/${p.id}`)}
                className="group cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all bg-white border border-amber-400/30 hover:border-amber-500/70"
              >
                <CardContent className="py-5 px-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-12 w-12 rounded-full bg-[#103444]/5 flex items-center justify-center ring-1 ring-amber-400/40">
                      <UserCircle className="h-7 w-7 text-[#103444]/50" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#103444]/30 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <p className="font-bold text-[#103444] text-lg leading-tight mb-2">{p.name}</p>
                  <div className="space-y-1 text-xs text-[#103444]/60">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {p.phone || "Sem telefone"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3" /> {p.origin || "Sem profissão"}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#103444]/5 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600">
                      {p.status}
                    </span>
                    {p.phone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/55${p.phone?.replace(/\D/g, '')}`);
                        }}
                        className="text-green-600 hover:scale-110 transition-transform"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-amber-400/30">
              <p className="text-[#103444]/40 font-medium">Nenhum paciente cadastrado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
