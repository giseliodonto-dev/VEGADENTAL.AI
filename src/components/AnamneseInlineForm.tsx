import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, ClipboardList, Copy, Save, Plus } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DISEASE_OPTIONS = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hipertensao", label: "Hipertensão" },
  { value: "cardiopatia", label: "Cardiopatia" },
  { value: "outros", label: "Outros" },
];

interface AnamneseInlineFormProps {
  patientId: string;
  patientPhone?: string | null;
  anamnese: any;
  isLoading: boolean;
}

export function AnamneseInlineForm({ patientId, patientPhone, anamnese, isLoading }: AnamneseInlineFormProps) {
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();

  // Form state
  const [diseases, setDiseases] = useState<string[]>([]);
  const [surgeries, setSurgeries] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [smoker, setSmoker] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [bruxism, setBruxism] = useState(false);
  const [currentPain, setCurrentPain] = useState(false);
  const [gumBleeding, setGumBleeding] = useState(false);
  const [sensitivity, setSensitivity] = useState(false);

  // Sync form state when anamnese loads
  useEffect(() => {
    if (anamnese) {
      setDiseases(anamnese.diseases || []);
      setSurgeries(anamnese.surgeries || false);
      setAllergies(anamnese.allergies || "");
      setMedications(anamnese.medications || "");
      setSmoker(anamnese.smoker || false);
      setAlcohol(anamnese.alcohol || false);
      setBruxism(anamnese.bruxism || false);
      setCurrentPain(anamnese.current_pain || false);
      setGumBleeding(anamnese.gum_bleeding || false);
      setSensitivity(anamnese.sensitivity || false);
    }
  }, [anamnese]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId || !patientId) throw new Error("Dados incompletos");
      const { error } = await supabase.from("anamneses" as any).insert({
        clinic_id: clinicId,
        patient_id: patientId,
        status: "nao_enviada",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anamnese criada!");
      queryClient.invalidateQueries({ queryKey: ["anamnese", patientId] });
    },
    onError: () => toast.error("Erro ao criar anamnese"),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!anamnese?.id) throw new Error("Anamnese não encontrada");
      const { error } = await supabase
        .from("anamneses" as any)
        .update({
          diseases,
          surgeries,
          allergies: allergies.trim() || null,
          medications: medications.trim() || null,
          smoker,
          alcohol,
          bruxism,
          current_pain: currentPain,
          gum_bleeding: gumBleeding,
          sensitivity,
        } as any)
        .eq("id", anamnese.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anamnese salva!");
      queryClient.invalidateQueries({ queryKey: ["anamnese", patientId] });
    },
    onError: () => toast.error("Erro ao salvar anamnese"),
  });

  function copyLink(token: string) {
    const url = `${window.location.origin}/anamnese/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link da anamnese copiado!");
  }

  function sendWhatsApp(token: string) {
    const url = `${window.location.origin}/anamnese/${token}`;
    openWhatsApp(patientPhone, `Olá! Por favor, preencha sua anamnese: ${url}`);
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    nao_enviada: { label: "Não enviada", color: "bg-muted text-muted-foreground" },
    enviada: { label: "Enviada", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    respondida: { label: "Respondida", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!anamnese) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Nenhuma anamnese criada.</p>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Plus className="h-4 w-4" /> Criar Anamnese
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sc = statusConfig[anamnese.status] || statusConfig.nao_enviada;

  const toggleItems = [
    { label: "Já fez cirurgias?", value: surgeries, set: setSurgeries },
    { label: "Fumante?", value: smoker, set: setSmoker },
    { label: "Consome álcool?", value: alcohol, set: setAlcohol },
    { label: "Bruxismo (range os dentes)?", value: bruxism, set: setBruxism },
    { label: "Sente dor atualmente?", value: currentPain, set: setCurrentPain },
    { label: "Sangramento gengival?", value: gumBleeding, set: setGumBleeding },
    { label: "Sensibilidade nos dentes?", value: sensitivity, set: setSensitivity },
  ];

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header with status + actions */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
            {anamnese.response_date && (
              <span className="text-xs text-muted-foreground">
                Respondida em {format(new Date(anamnese.response_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Copiar link" onClick={() => copyLink(anamnese.public_token)}>
              <Copy className="h-4 w-4" />
            </Button>
            {patientPhone && (
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Enviar WhatsApp" onClick={() => sendWhatsApp(anamnese.public_token)}>
                <WhatsAppIcon size={16} bare bgColor="#16a34a" />
              </Button>
            )}
          </div>
        </div>

        {/* Signature info if responded */}
        {anamnese.signature && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
            <strong className="text-foreground">Assinado por:</strong>{" "}
            <span className="text-muted-foreground">{anamnese.signature}</span>
            {anamnese.signed_at && (
              <span className="text-xs text-muted-foreground ml-2">
                em {format(new Date(anamnese.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
        )}

        {/* Diseases */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Doenças que possam limitar o tratamento</Label>
          <div className="grid grid-cols-2 gap-2">
            {DISEASE_OPTIONS.map((d) => (
              <div key={d.value} className="flex items-center gap-2">
                <Checkbox
                  checked={diseases.includes(d.value)}
                  onCheckedChange={(checked) => {
                    setDiseases((prev) =>
                      checked ? [...prev, d.value] : prev.filter((v) => v !== d.value)
                    );
                  }}
                />
                <span className="text-sm text-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold">Histórico de saúde</Label>
          {toggleItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item.label}</span>
              <Switch checked={item.value} onCheckedChange={item.set} />
            </div>
          ))}
        </div>

        {/* Text fields */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Alergias</Label>
            <Textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Descreva alergias conhecidas..."
              rows={2}
              maxLength={500}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Medicamentos em uso</Label>
            <Textarea
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="Liste os medicamentos..."
              rows={2}
              maxLength={500}
            />
          </div>
        </div>

        {/* Save button */}
        <Button
          className="w-full gap-1"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" /> Salvar Anamnese
        </Button>
      </CardContent>
    </Card>
  );
}
