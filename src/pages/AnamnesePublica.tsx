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
    (async () => {
      const { data: anamneseData, error: anamneseErr } = await (supabase as any)
        .from("anamneses")
        .select("*")
        .eq("public_token", token)
        .headers({ "x-anamnese-token": token })
        .maybeSingle();

      if (anamneseErr || !anamneseData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (anamneseData.status === "respondida") {
        setAlreadyAnswered(true);
        setLoading(false);
        return;
      }

      const { data: patientData } = await supabase
        .from("patients")
        .select("name")
        .eq("id", anamneseData.patient_id)
        .maybeSingle();

      setPatientName(patientData?.name || "");

      if (anamneseData.diseases?.length) setDiseases(anamneseData.diseases);
      if (anamneseData.surgeries) setSurgeries(true);
      if (anamneseData.allergies) setAllergies(anamneseData.allergies);
      if (anamneseData.medications) setMedications(anamneseData.medications);
      if (anamneseData.smoker) setSmoker(true);
      if (anamneseData.alcohol) setAlcohol(true);
      if (anamneseData.bruxism) setBruxism(true);
      if (anamneseData.current_pain) setCurrentPain(true);
      if (anamneseData.gum_bleeding) setGumBleeding(true);
      if (anamneseData.sensitivity) setSensitivity(true);

      setLoading(false);
    })();
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
    const { error } = await (supabase as any)
      .from("anamneses")
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
      })
      .eq("public_token", token!)
      .headers({ "x-anamnese-token": token! });

    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
    } else {
      setSubmitted(true);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-3">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Link inválido</h1>
          <p className="text-sm text-muted-foreground">Este link não foi encontrado ou expirou.</p>
        </CardContent>
      </Card>
    </div>
  );

  if (alreadyAnswered) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-xl font-bold text-foreground">Anamnese já respondida</h1>
          <p className="text-sm text-muted-foreground">Este formulário já foi preenchido e assinado.</p>
        </CardContent>
      </Card>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-xl font-bold text-foreground">Anamnese enviada!</h1>
          <p className="text-sm text-muted-foreground">Obrigado, {patientName}. Suas informações foram registradas com sucesso.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <ClipboardList className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Anamnese</h1>
          {patientName && (
            <p className="text-sm text-muted-foreground">Paciente: <strong>{patientName}</strong></p>
          )}
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Doenças */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Possui alguma doença?</Label>
              <div className="grid grid-cols-2 gap-3">
                {DISEASE_OPTIONS.map((d) => (
                  <label key={d.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={diseases.includes(d.value)}
                      onCheckedChange={(checked) => {
                        setDiseases(checked
                          ? [...diseases, d.value]
                          : diseases.filter((v) => v !== d.value));
                      }}
                    />
                    <span className="text-sm">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cirurgias */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Já fez cirurgias?</Label>
              <Switch checked={surgeries} onCheckedChange={setSurgeries} />
            </div>

            {/* Alergias */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Alergias</Label>
              <Input placeholder="Nenhuma" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
            </div>

            {/* Medicamentos */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Medicamentos em uso</Label>
              <Input placeholder="Nenhum" value={medications} onChange={(e) => setMedications(e.target.value)} />
            </div>

            {/* Hábitos */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Hábitos e sintomas</Label>
              <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center justify-between pr-4">
                  <span className="text-sm">Fumante</span>
                  <Switch checked={smoker} onCheckedChange={setSmoker} />
                </div>
                <div className="flex items-center justify-between pr-4">
                  <span className="text-sm">Álcool</span>
                  <Switch checked={alcohol} onCheckedChange={setAlcohol} />
                </div>
                <div className="flex items-center justify-between pr-4">
                  <span className="text-sm">Bruxismo</span>
                  <Switch checked={bruxism} onCheckedChange={setBruxism} />
                </div>
                <div className="flex items-center justify-between pr-4">
                  <span className="text-sm">Dor atual</span>
                  <Switch checked={currentPain} onCheckedChange={setCurrentPain} />
                </div>
                <div className="flex items-center justify-between pr-4">
                  <span className="text-sm">Sangramento gengival</span>
                  <Switch checked={gumBleeding} onCheckedChange={setGumBleeding} />
                </div>
                <div className="flex items-center justify-between pr-4">
                  <span className="text-sm">Sensibilidade</span>
                  <Switch checked={sensitivity} onCheckedChange={setSensitivity} />
                </div>
              </div>
            </div>

            {/* Assinatura */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-semibold">Assinatura digital</Label>
              <p className="text-xs text-muted-foreground">Digite seu nome completo para confirmar as informações acima.</p>
              <Input
                placeholder="Seu nome completo"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="h-11"
              />
            </div>

            <Button
              className="w-full h-11 gap-2"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Assinar e Enviar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
