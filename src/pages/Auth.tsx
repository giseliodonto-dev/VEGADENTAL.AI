import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zap, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type AuthMode = "login" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [clinicName, setClinicName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "Email ou senha incorretos."
        : error.message);
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim()) {
      toast.error("Informe o nome da clínica.");
      return;
    }
    setLoading(true);

    // 1. Create user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required
    if (signUpData.user && !signUpData.session) {
      toast.success("Verifique seu e-mail para confirmar o cadastro.");
      setMode("login");
      setLoading(false);
      return;
    }

    // 2. Create clinic + link as dono
    if (signUpData.user && signUpData.session) {
      const slug = clinicName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { data: clinic, error: clinicError } = await supabase
        .from("clinics")
        .insert({ name: clinicName.trim(), slug: slug || "clinica" })
        .select("id")
        .single();

      if (clinicError) {
        toast.error("Erro ao criar clínica: " + clinicError.message);
        setLoading(false);
        return;
      }

      const { error: memberError } = await supabase
        .from("clinic_members")
        .insert({
          clinic_id: clinic.id,
          user_id: signUpData.user.id,
          role: "dono" as const,
        });

      if (memberError) {
        toast.error("Erro ao vincular usuário: " + memberError.message);
        setLoading(false);
        return;
      }

      toast.success("Clínica criada com sucesso!");
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3 animate-fade-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mx-auto">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
            VEGA Dental AI
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Entre na sua conta para continuar"
              : "Crie sua conta e cadastre sua clínica"}
          </p>
        </div>

        {/* Form Card */}
        <div
          className="animate-fade-up rounded-2xl border bg-card p-8 shadow-sm"
          style={{ opacity: 0, animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-5">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Seu nome completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Dr. João Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nome da Clínica
                  </Label>
                  <Input
                    id="clinicName"
                    type="text"
                    placeholder="Odonto Excellence"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Entrar" : "Criar Conta e Clínica"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === "login"
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
