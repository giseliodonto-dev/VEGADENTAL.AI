import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Phone, MapPin, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Configuracoes = () => {
  const { clinicId } = useClinic();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!clinicId) return;
    supabase
      .from("clinics")
      .select("name, phone, address")
      .eq("id", clinicId)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
        }
        setLoading(false);
      });
  }, [clinicId]);

  async function handleSave() {
    if (!clinicId || !name.trim()) {
      toast.error("O nome da clínica é obrigatório.");
      return;
    }
    setSaving(true);
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "clinica";

    const { error } = await supabase
      .from("clinics")
      .update({ name: name.trim(), phone: phone.trim() || null, address: address.trim() || null, slug })
      .eq("id", clinicId);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Configurações salvas com sucesso!");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <AppLayout title="Configurações">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Configurações">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Identidade da Clínica
            </CardTitle>
            <CardDescription>Informações básicas que identificam sua clínica no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="clinicName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nome da Clínica
              </Label>
              <Input id="clinicName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Odonto Excellence" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp</span>
              </Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Endereço</span>
              </Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade - UF" rows={3} />
            </div>

            <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full sm:w-auto h-11 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /><span>Salvar Configurações</span></>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
