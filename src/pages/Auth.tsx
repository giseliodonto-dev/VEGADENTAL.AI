import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Zap } from "lucide-react";
import vegaLogo from "@/assets/vega-logo.svg";
import { toast } from "sonner";

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos." : error.message);
    } else {
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
      options: { data: { full_name: fullName } },
    });

    if (signUpError) { 
      toast.error(signUpError.message); 
    } else {
      toast.success("Verifique seu e-mail para confirmar o cadastro.");
      setMode("login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Lado Esquerdo - Branding Vega */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center"
        style={{ background: "linear-gradient(135deg, #103444, #1a4a5e)" }}>
        <div className="relative z-10 text-center space-y-6 px-12">
          <img src={vegaLogo} alt="VEGA" className="h-24 w-24 mx-auto" />
          <h2 className="text-3xl font-bold text-white">VEGA Dental AI</h2>
          <p className="text-white/70 text-sm max-w-xs mx-auto">
            Inteligência estratégica para dentistas que pensam como CEO.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs text-white/60">
            <Zap className="h-3 w-3" /> Gestão · Vendas · Marketing · Autoridade
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário Limpo */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === "login" ? "Entre para gerir sua clínica" : "Cadastre sua clínica agora"}
            </p>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Seu nome completo</label>
                  <input type="text" placeholder="Dr. João Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} required 
                    className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#103444]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Nome da Clínica</label>
                  <input type="text" placeholder="Odonto Excellence" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required 
                    className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#103444]" />
                </div>
              </>
            )}
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">E-mail</label>
              <input type="email" placeholder="voce@clinica.com" value={email} onChange={(e) => setEmail(e.target.value)} required 
                className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#103444]" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Senha</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} 
                className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#103444]" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-[#103444] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#1a4a5e] transition-all disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>{mode === "login" ? "Entrar" : "Criar Conta"}<ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="text-center">
            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-slate-500 hover:text-[#103444] font-medium transition-colors">
              {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
