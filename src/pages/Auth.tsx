import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Zap } from "lucide-react";
import vegaLogo from "@/assets/vega-logo.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type AuthMode = "login" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [clinicName, setClinicName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos." : error.message);
    } else {
      // Check for pending invites and auto-accept
      if (data.user) {
        const { data: pendingInvites } = await supabase
          .from("invites")
          .select("*")
          .eq("email", email.trim().toLowerCase())
          .eq("status", "pending");

        if (pendingInvites && pendingInvites.length > 0) {
          for (const inv of pendingInvites) {
            await supabase.from("clinic_members").insert({
              clinic_id: inv.clinic_id,
              user_id: data.user.id,
              role: inv.role,
            });
            await supabase.from("invites").update({
              status: "accepted",
              accepted_at: new Date().toISOString(),
            }).eq("id", inv.id);
          }
          toast.success("Convites aceitos automaticamente!");
        }
      }
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim()) { toast.error("Informe o nome da clínica."); return; }
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });

    if (signUpError) { toast.error(signUpError.message); setLoading(false); return; }
    if (signUpData.user && !signUpData.session) {
      toast.success("Verifique seu e-mail para confirmar o cadastro.");
      setMode("login"); setLoading(false); return;
    }

    if (signUpData.user && signUpData.session) {
      const slug = clinicName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data: clinic, error: clinicError } = await supabase
        .from("clinics").insert({ name: clinicName.trim(), slug: slug || "clinica" }).select("id").single();
      if (clinicError) { toast.error("Erro ao criar clínica: " + clinicError.message); setLoading(false); return; }

      const { error: memberError } = await supabase
        .from("clinic_members").insert({ clinic_id: clinic.id, user_id: signUpData.user.id, role: "dono" as const });
      if (memberError) { toast.error("Erro ao vincular usuário: " + memberError.message); setLoading(false); return; }

      toast.success("Clínica criada com sucesso!");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — gradient branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(135deg, hsl(200 65% 22%), hsl(200 65% 28%) 50%, hsl(42 78% 45% / 0.3))" }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 text-center space-y-6 px-12">
          <img src={vegaLogo} alt="VEGA" className="h-24 w-24 mx-auto animate-glow-pulse" />
          <h2 className="text-3xl font-bold font-display text-white tracking-tight">
            VEGA Dental AI
          </h2>
          <p className="text-white/70 text-sm max-w-xs mx-auto leading-relaxed">
            Inteligência estratégica para dentistas que pensam como CEO.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60">
            <Zap className="h-3 w-3" />
            Gestão · Vendas · Marketing · Autoridade
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="text-center space-y-3 lg:hidden animate-fade-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <img src={vegaLogo} alt="VEGA" className="h-16 w-16 object-contain mx-auto animate-glow-pulse" />
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">VEGA Dental AI</h1>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block animate-fade-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Entre na sua conta para continuar" : "Cadastre-se e comece a usar"}
            </p>
          </div>

          {/* Mobile subtitle */}
          <p className="text-sm text-muted-foreground text-center lg:hidden">
            {mode === "login" ? "Entre na sua conta para continuar" : "Crie sua conta e cadastre sua clínica"}
          </p>

          <div className="animate-fade-up card-premium p-8" style={{ opacity: 0, animationDelay: "100ms", animationFillMode: "forwards" }}>
            <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-5">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seu nome completo</Label>
                    <Input id="fullName" type="text" placeholder="Dr. João Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome da Clínica</Label>
                    <Input id="clinicName" type="text" placeholder="Odonto Excellence" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required className="h-11" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">E-mail</Label>
                <Input id="email" type="email" placeholder="voce@clinica.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11 gap-2 btn-press" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>{mode === "login" ? "Entrar" : "Criar Conta e Clínica"}<ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
