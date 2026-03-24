import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const DISEASE_OPTIONS = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hipertensao", label: "Hipertensão" },
  { value: "cardiopatia", label: "Cardiopatia" },
  { value: "outros", label: "Outros" },
];

export default function AnamnesePublica() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientName, setPatientName] = useState("");

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
  const [signature, setSignature] = useState("");

  useEffect(() => {
    if (!token) return;
    supabase
      .from("anamneses" as any)
      .select("*, patients!inner(name)")
      .eq("public_token", token)
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (error || !data) {
          setNotFound(true);
        } else if (data.status === "respondida") {
          setAlreadyAnswered(true);
        } else {
          setPatientName(data.patients?.name || "");
        }
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit() {
    if (!signature.trim()) {
      toast.error("Por favor, digite seu nome completo para assinar.");
      return;
    }
    if (signature.trim().length < 3) {
      toast.error("Nome muito curto. Digite seu nome completo.");
      return;
    }

    setSubmitting(true);
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
        signature: signature.trim(),
        signed_at: new Date().toISOString(),
        response_date: new Date().toISOString(),
        status: "respondida",
      } as any)
      .eq("public_token", token!);

    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
    } else {
      setSubmitted(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground" />
            <h1 className="text-xl font-bold text-foreground">Link inválido</h1>
            <p className="text-sm text-muted-foreground">Este link de anamnese não foi encontrado ou expirou.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyAnswered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <h1 className="text-xl font-bold text-foreground">Anamnese já respondida</h1>
            <p className="text-sm text-muted-foreground">Esta anamnese já foi preenchida anteriormente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <h1 className="text-xl font-bold text-foreground">Anamnese enviada!</h1>
            <p className="text-sm text-muted-foreground">
              Obrigado, {signature}! Suas informações foram registradas com sucesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 pb-12 space-y-6">
        {/* Header */}
        <div className="text-center pt-6 space-y-2">
          <ClipboardList className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Anamnese</h1>
          {patientName && (
            <p className="text-sm text-muted-foreground">Paciente: <strong>{patientName}</strong></p>
          )}
          <p className="text-xs text-muted-foreground">
            Preencha o formulário abaixo com suas informações de saúde.
          </p>
        </div>

        {/* Doenças */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-semibold">Possui doenças que possam limitar o tratamento?</Label>
            <div className="grid grid-cols-2 gap-3">
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
          </CardContent>
        </Card>

        {/* Toggles */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <Label className="text-sm font-semibold">Histórico de saúde</Label>
            {[
              { label: "Já fez cirurgias?", value: surgeries, set: setSurgeries },
              { label: "Fumante?", value: smoker, set: setSmoker },
              { label: "Consome álcool?", value: alcohol, set: setAlcohol },
              { label: "Bruxismo (range os dentes)?", value: bruxism, set: setBruxism },
              { label: "Sente dor atualmente?", value: currentPain, set: setCurrentPain },
              { label: "Sangramento gengival?", value: gumBleeding, set: setGumBleeding },
              { label: "Sensibilidade nos dentes?", value: sensitivity, set: setSensitivity },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item.label}</span>
                <Switch checked={item.value} onCheckedChange={item.set} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Campos texto */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Alergias</Label>
              <Textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Descreva alergias conhecidas (medicamentos, materiais, etc.)"
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Medicamentos em uso</Label>
              <Textarea
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="Liste os medicamentos que está tomando atualmente"
                rows={2}
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assinatura */}
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-semibold">Assinatura Digital</Label>
            <p className="text-xs text-muted-foreground">
              Ao assinar, confirmo que as informações acima são verdadeiras e foram preenchidas por mim.
            </p>
            <Input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Digite seu nome completo"
              maxLength={100}
              className="text-base"
            />
          </CardContent>
        </Card>

        <Button
          className="w-full h-12 text-base"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Assinar e Enviar
        </Button>
      </div>
    </div>
  );
}
