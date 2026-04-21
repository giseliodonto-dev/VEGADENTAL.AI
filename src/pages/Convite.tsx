import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import vegaLogo from "@/assets/vega-logo.svg";

const roleLabels: Record<string, string> = {
  dono: "Dono",
  recepcao: "Recepção",
  dentista: "Dentista",
  crm: "CRM",
  sdr: "SDR",
  admin: "Admin",
  protetico: "Protético",
};

const Convite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<any>(null);
  const [clinicName, setClinicName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function loadInvite() {
      if (!token) { setError("Link inválido."); setLoading(false); return; }

      const { data, error: fetchError } = await supabase
        .from("invites")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .maybeSingle();

      if (fetchError || !data) {
        setError("Convite não encontrado ou já utilizado.");
        setLoading(false);
        return;
      }

      setInvite(data);
      setEmail(data.email);

      const { data: clinic } = await supabase
        .from("clinics")
        .select("name")
        .eq("id", data.clinic_id)
        .single();

      if (clinic) setClinicName(clinic.name);
      setLoading(false);
    }
    loadInvite();
  }, [token]);

  async function acceptAndGo(userId: string, userEmail: string) {
    const { error: rpcError } = await supabase.rpc("accept_pending_invites", {
      _user_id: userId,
      _email: userEmail,
    });
    if (rpcError) {
      console.error(rpcError);
      toast.error("Conta criada, mas houve erro ao vincular à clínica. Faça login novamente.");
      navigate("/auth");
      return;
    }
    toast.success(`Bem-vindo(a) à ${clinicName}!`);
    window.location.href = "/";
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (signUpError) {
      // Caso já tenha conta, oferecer login
      if (signUpError.message?.toLowerCase().includes("registered") || signUpError.message?.toLowerCase().includes("already")) {
        toast.info("Esta conta já existe. Faça login para aceitar o convite.");
        setMode("signin");
        setSubmitting(false);
        return;
      }
      toast.error(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (signUpData.user && signUpData.session) {
      await acceptAndGo(signUpData.user.id, invite.email);
      setSubmitting(false);
      return;
    }

    // Fallback: confirmação de email ainda ativa
    if (signUpData.user && !signUpData.session) {
      setSuccess(true);
      setSubmitting(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password,
    });

    if (signInError || !signInData.session) {
      toast.error(signInError?.message || "Não foi possível entrar.");
      setSubmitting(false);
      return;
    }

    await acceptAndGo(signInData.user.id, invite.email);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <img src={vegaLogo} alt="VEGA" className="h-12 w-12 mx-auto opacity-50" />
          <h1 className="text-xl font-bold text-foreground">Convite Inválido</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-xl font-bold text-foreground">Quase lá!</h1>
          <p className="text-sm text-muted-foreground">
            Verifique seu e-mail para confirmar o cadastro. Após confirmar, faça login normalmente e você já estará vinculado à clínica <strong>{clinicName}</strong>.
          </p>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <img src={vegaLogo} alt="VEGA" className="h-14 w-14 mx-auto" />
          <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
            Convite para {clinicName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Você foi convidado como <strong>{roleLabels[invite?.role] || invite?.role}</strong>.
          </p>
        </div>

        <div className="card-premium p-8">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "signup" | "signin")}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
              <TabsTrigger value="signin">Já tenho conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Seu nome completo
                  </Label>
                  <Input
                    type="text"
                    placeholder="Dr. João Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    E-mail
                  </Label>
                  <Input type="email" value={email} disabled className="h-11 bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Senha
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar Conta e Entrar<ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form onSubmit={handleSignin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    E-mail
                  </Label>
                  <Input type="email" value={email} disabled className="h-11 bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Senha
                  </Label>
                  <Input
                    type="password"
                    placeholder="Sua senha atual"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar e Aceitar Convite<ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Convite;
