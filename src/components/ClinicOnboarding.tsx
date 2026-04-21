import { useEffect, useState } from "react";
import { useClinic } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Zap, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ClinicOnboarding() {
  const { createClinic } = useClinic();
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);

  // Verifica convites pendentes antes de mostrar tela de criação
  useEffect(() => {
    (async () => {
      if (!user?.email) { setCheckingInvite(false); return; }
      try {
        const { data: pending } = await supabase
          .from("invites")
          .select("id")
          .eq("email", user.email)
          .eq("status", "pending")
          .limit(1)
          .maybeSingle();

        if (pending) {
          await supabase.rpc("accept_pending_invites", {
            _user_id: user.id,
            _email: user.email,
          });
          toast.success("Convite aceito! Entrando na clínica...");
          window.location.href = "/";
          return;
        }
      } catch (e) {
        console.warn("Verificação de convite falhou:", e);
      }
      setCheckingInvite(false);
    })();
  }, [user?.id, user?.email]);

  // Pre-fill from signup if available
  useEffect(() => {
    try {
      const pending = localStorage.getItem("pending_clinic_name");
      if (pending) setClinicName(pending);
    } catch {}
  }, []);

  if (checkingInvite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = clinicName.trim();
    if (!name) {
      toast.error("Informe o nome da clínica.");
      return;
    }
    setSaving(true);
    try {
      const newClinicId = await createClinic(name);
      if (!newClinicId) {
        throw new Error("Não foi possível criar a clínica. Tente novamente.");
      }
      // Seed default procedures (non-blocking)
      try {
        await supabase.rpc("seed_default_procedures", { _clinic_id: newClinicId });
      } catch (seedErr) {
        console.warn("Seed procedures falhou (não crítico):", seedErr);
      }
      try { localStorage.removeItem("pending_clinic_name"); } catch {}
      toast.success("Clínica criada com sucesso!");
      window.location.href = "/";
    } catch (err: any) {
      console.error("Erro ao criar clínica:", err);
      const msg = err?.message || "";
      if (msg.includes("row-level security") || msg.includes("policy")) {
        toast.error("Você já está vinculado a uma clínica. Recarregue a página.");
      } else if (msg.includes("duplicate") || msg.includes("unique")) {
        toast.error("Já existe uma clínica com esse nome. Tente outro.");
      } else {
        toast.error("Erro ao criar clínica: " + (msg || "Tente novamente"));
      }
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
            Para começar, confirme o nome da sua clínica.
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
