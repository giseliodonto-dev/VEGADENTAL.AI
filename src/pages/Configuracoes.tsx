import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Phone, MapPin, Save, Loader2, Award, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";

const Configuracoes = () => {
  const { clinicId } = useClinic();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [responsibleCro, setResponsibleCro] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [cancellationFee, setCancellationFee] = useState<string>("100");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!clinicId) return;
    supabase
      .from("clinics")
      .select("name, phone, address, responsible_name, responsible_cro, logo_url, cancellation_fee")
      .eq("id", clinicId)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setName(data.name || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setResponsibleName(data.responsible_name || "");
          setResponsibleCro(data.responsible_cro || "");
          setLogoUrl(data.logo_url || "");
          setCancellationFee(String(data.cancellation_fee ?? 100));
        }
        setLoading(false);
      });
  }, [clinicId]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !clinicId) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${clinicId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-logos").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro no upload: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("clinic-logos").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Logo enviado! Lembre-se de salvar.");
  }

  async function handleSave() {
    if (!clinicId || !name.trim()) { toast.error("O nome da clínica é obrigatório."); return; }
    setSaving(true);
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "clinica";

    const { error } = await supabase
      .from("clinics")
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        slug,
        responsible_name: responsibleName.trim() || null,
        responsible_cro: responsibleCro.trim() || null,
        logo_url: logoUrl || null,
        cancellation_fee: Number(cancellationFee) || 0,
      } as any)
      .eq("id", clinicId);

    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Configurações salvas com sucesso!");
    setSaving(false);
  }

  if (loading) {
    return <AppLayout title="Configurações"><div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  return (
    <AppLayout title="Configurações">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5 text-primary" />Identidade da Clínica</CardTitle>
            <CardDescription>Informações básicas que identificam sua clínica no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="clinicName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome da Clínica</Label>
              <Input id="clinicName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: GC Odontologia" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wider"><span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp</span></Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-medium text-muted-foreground uppercase tracking-wider"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Endereço</span></Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade - UF" rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Award className="h-5 w-5 text-primary" />Responsável Técnica & Contrato</CardTitle>
            <CardDescription>Estes dados aparecem no cabeçalho dos contratos e planos de tratamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Logo da Clínica</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain border rounded-lg p-1" />
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>
                )}
                <div className="flex-1">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {logoUrl ? "Trocar logo" : "Enviar logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">PNG ou JPG, fundo transparente recomendado</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="respName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome da Responsável Técnica</Label>
              <Input id="respName" value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} placeholder="Ex: Dra. Giseli da Costa Lage" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="respCro" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inscrição CRO</Label>
              <Input id="respCro" value={responsibleCro} onChange={(e) => setResponsibleCro(e.target.value)} placeholder="Ex: CROSP 165.429" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxa de cancelamento (R$)</Label>
              <Input id="fee" type="number" step="0.01" value={cancellationFee} onChange={(e) => setCancellationFee(e.target.value)} placeholder="100,00" className="h-11" />
              <p className="text-xs text-muted-foreground">Cobrada em faltas sem aviso prévio de 24h. Aparece nas cláusulas do contrato.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="h-11 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /><span>Salvar Configurações</span></>}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
