import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Zap } from "lucide-react";
import vegaLogo from "@/assets/vega-logo.svg";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    // Supabase recovery link sets a session via the URL hash automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("A senha deve ter ao menos 6 caracteres."); return; }
    if (password !== confirm) { toast.error("As senhas não coincidem."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha redefinida com sucesso!");
      await supabase.auth.signOut();
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center"
        style={{ background: "linear-gradient(135deg, #103444, #1a4a5e)" }}>
        <div className="relative z-10 text-center space-y-6 px-12">
          <img src={vegaLogo} alt="VEGA" className="h-24 w-24 mx-auto" />
          <h2 className="text-3xl font-bold text-white">VEGA Dental AI</h2>
          <p className="text-white/70 text-sm max-w-xs mx-auto">
            Defina uma nova senha para acessar sua clínica.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs text-white/60">
            <Zap className="h-3 w-3" /> Segurança · Privacidade
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold text-slate-900">Redefinir senha</h1>
            <p className="text-sm text-slate-500 mt-1">
              {ready ? "Escolha uma nova senha de acesso." : "Validando link de recuperação..."}
            </p>
          </div>

          {ready && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Nova senha</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#103444]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Confirmar senha</label>
                <input type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6}
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#103444]" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-12 bg-[#103444] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#1a4a5e] transition-all disabled:opacity-50">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (<>Salvar nova senha<ArrowRight className="h-4 w-4" /></>)}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
