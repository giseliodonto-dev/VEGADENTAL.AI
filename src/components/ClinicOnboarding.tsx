import { useState } from "react";
import { useClinic } from "@/hooks/useClinic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Zap, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ClinicOnboarding() {
  const { createClinic } = useClinic();
  const [clinicName, setClinicName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicName.trim()) return;
    setSaving(true);
    try {
      await createClinic(clinicName.trim());
      toast.success("Clínica criada com sucesso!");
      window.location.reload();
    } catch (err: any) {
      toast.error("Erro ao criar clínica: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3 animate-fade-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mx-auto">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
            Bem-vindo ao VEGA
          </h1>
          <p className="text-sm text-muted-foreground">
            Para começar, cadastre o nome da sua clínica.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="animate-fade-up rounded-2xl border bg-card p-8 shadow-sm space-y-5"
          style={{ opacity: 0, animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <div className="space-y-2">
            <Label htmlFor="clinicName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Nome da Clínica
            </Label>
            <Input
              id="clinicName"
              placeholder="Ex: Odonto Excellence"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              required
              autoFocus
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full h-11 gap-2" disabled={saving || !clinicName.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Criar Clínica</span><ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}
