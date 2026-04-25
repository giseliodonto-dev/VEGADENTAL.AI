import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowDown, Users, TrendingUp, DollarSign, Megaphone, Compass, Brain, UserCheck, Crown } from "lucide-react";

import ato1 from "/landing/ato-1-caos.jpg";
import ato2 from "/landing/ato-2-ascensao.jpg";
import ato3 from "/landing/ato-3-realidade.jpg";
import ato4 from "/landing/ato-4-chamado.jpg";

// TODO: troque pelo número real de WhatsApp
const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_MSG = "Olá! Acabei de entrar na lista de espera do Vega — quero minha evolução.";

const waitlistSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100, "Máximo 100 caracteres"),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20, "WhatsApp inválido"),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
});

const modules = [
  { icon: Users, name: "Pacientes" },
  { icon: TrendingUp, name: "Funil de Vendas" },
  { icon: DollarSign, name: "Financeiro" },
  { icon: Megaphone, name: "Marketing" },
  { icon: Compass, name: "Vega GPS" },
  { icon: Brain, name: "Inteligência IA" },
  { icon: UserCheck, name: "Equipe" },
  { icon: Crown, name: "Autoridade" },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const SaltoEvolutivo = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "" });
  const [loading, setLoading] = useState(false);

  const ato1Reveal = useReveal();
  const ato2Reveal = useReveal();
  const ato3Reveal = useReveal();
  const ato4Reveal = useReveal();

  useEffect(() => {
    document.title = "Vega — O Salto Evolutivo";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "O mundo evoluiu, Doutor. E você? Entre na lista de espera do Vega.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = waitlistSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast({ title: "Verifique seus dados", description: first.message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("evolution_waitlist").insert({
        name: parsed.data.name,
        whatsapp: parsed.data.whatsapp,
        email: parsed.data.email || null,
        source: "landing_evolucao",
        user_agent: navigator.userAgent.slice(0, 500),
      });
      if (error) throw error;

      toast({ title: "Você está dentro.", description: "Te encontro no WhatsApp em instantes." });
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`;
      setTimeout(() => { window.location.href = url; }, 800);
    } catch (err) {
      console.error(err);
      toast({ title: "Algo deu errado", description: "Tente novamente em alguns segundos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans">
      {/* Logo fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/40 backdrop-blur-md border-b border-emerald-900/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-bagel text-2xl tracking-wide" style={{ color: "#10B981", textShadow: "0 0 20px rgba(16,185,129,0.5)" }}>
            VEGA
          </span>
          <a href="#chamado" className="text-xs uppercase tracking-[0.2em] text-emerald-400 hover:text-emerald-300 transition">
            Lista de Espera
          </a>
        </div>
      </header>

      {/* ATO I — A DOR */}
      <section ref={ato1Reveal.ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={ato1} alt="Dentista soterrada em papelada" className="w-full h-full object-cover opacity-40" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950/60 to-black" />
        </div>
        <div className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-1000 ${ato1Reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400 mb-6">Ato I · O Caos Terrestre</p>
          <h1 className="font-bagel leading-[0.95] mb-8" style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}>
            O caos não é o<br />preço do sucesso.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            O consultório que você sonhou se tornou a prisão que você habita?
            <br /><br />
            Agendas lotadas, mas o caixa vazio. Uma secretária que se esforça,
            mas não vende porque ninguém a ensinou a navegar no funil.
            <br /><br />
            <span className="text-white font-medium">É apenas falta de visão.</span>
          </p>
          <ArrowDown className="mx-auto mt-12 h-6 w-6 text-emerald-400 animate-bounce" />
        </div>
      </section>

      {/* ATO II — A ASCENSÃO */}
      <section ref={ato2Reveal.ref} className="relative min-h-screen flex items-center justify-center overflow-hidden py-24">
        <div className="absolute inset-0">
          <img src={ato2} alt="Vega — explosão de luz esmeralda" loading="lazy" className="w-full h-full object-cover opacity-50" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-emerald-950/40 to-black/90" />
        </div>
        <div className={`relative z-10 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${ato2Reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <p className="text-xs uppercase tracking-[0.4em] mb-6" style={{ color: "#10B981" }}>Ato II · A Ascensão</p>
          <h2 className="font-bagel leading-[0.95] mb-8" style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", color: "#10B981", textShadow: "0 0 40px rgba(16,185,129,0.4)" }}>
            Conheça o Vega.
          </h2>
          <p className="text-lg md:text-xl text-slate-200 leading-relaxed max-w-3xl mx-auto mb-16">
            O GPS que guia cada decisão, do primeiro contato ao lucro real.
            Onde a complexidade do funil de vendas se transforma em cliques simples,
            e onde o seu <span className="text-emerald-400 font-medium">markup é a lei que protege o seu patrimônio</span>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {modules.map((m, i) => (
              <div
                key={m.name}
                className="group relative rounded-xl border border-emerald-900/40 bg-black/60 backdrop-blur-sm p-5 hover:border-emerald-500/60 hover:-translate-y-1 transition-all duration-300"
                style={{
                  transitionDelay: ato2Reveal.visible ? `${i * 60}ms` : "0ms",
                  boxShadow: "inset 0 1px 0 rgba(16,185,129,0.05)",
                }}
              >
                <m.icon className="h-6 w-6 mb-3 mx-auto text-emerald-400 group-hover:text-emerald-300 transition" />
                <p className="text-xs uppercase tracking-wider text-slate-300 group-hover:text-white transition">{m.name}</p>
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none" style={{ boxShadow: "0 0 30px rgba(16,185,129,0.2)" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ATO III — A NOVA REALIDADE */}
      <section ref={ato3Reveal.ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={ato3} alt="Quiet luxury — vida em equilíbrio" loading="lazy" className="w-full h-full object-cover opacity-60" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />
        </div>
        <div className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-1000 ${ato3Reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <p className="text-xs uppercase tracking-[0.4em] text-amber-200/80 mb-6">Ato III · A Nova Realidade</p>
          <h2 className="font-bagel leading-[0.95] mb-8" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}>
            Quando a inteligência<br />assume o controle.
          </h2>
          <p className="text-lg md:text-xl text-slate-100 leading-relaxed max-w-2xl mx-auto">
            O consultório continua rodando sem você.
            Mais dinheiro entrando, pacientes encantados
            e o mais importante: <span className="text-amber-200">a sua família mais unida</span>.
            <br /><br />
            Você, dentista, trabalhando com felicidade,
            sabendo que o <span className="text-white font-medium">seu legado está seguro</span>.
          </p>
        </div>
      </section>

      {/* ATO IV — O CHAMADO */}
      <section id="chamado" ref={ato4Reveal.ref} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black py-24">
        <div className="absolute inset-0">
          <img src={ato4} alt="Logo Vega esmeralda" loading="lazy" className="w-full h-full object-cover opacity-30" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/60 to-black" />
        </div>
        <div className={`relative z-10 max-w-2xl mx-auto px-6 text-center transition-all duration-1000 ${ato4Reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <p className="text-xs uppercase tracking-[0.4em] mb-6" style={{ color: "#10B981" }}>Ato IV · O Chamado</p>
          <h2 className="font-bagel leading-[0.95] mb-6" style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}>
            O mundo evoluiu, Doutor.<br />
            <span style={{ color: "#10B981", textShadow: "0 0 30px rgba(16,185,129,0.5)" }}>E você?</span>
          </h2>
          <p className="text-base md:text-lg text-slate-300 mb-10">
            Onde quer estar no próximo ciclo? Entre para a lista de espera.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <input
                type="text"
                placeholder="Seu nome completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                required
                className="w-full bg-black/60 border border-emerald-900/50 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="WhatsApp com DDD (ex: 11999999999)"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, "") })}
                maxLength={15}
                required
                className="w-full bg-black/60 border border-emerald-900/50 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="E-mail (opcional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                className="w-full bg-black/60 border border-emerald-900/50 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="font-bagel w-full mt-6 px-8 py-5 rounded-xl text-black text-lg md:text-xl tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #047857 100%)",
                boxShadow: "0 0 40px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Entrando…</>
              ) : (
                "QUERO MINHA EVOLUÇÃO AGORA"
              )}
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-4 uppercase tracking-widest">
              Vagas limitadas · Acesso por ordem de cadastro
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black border-t border-emerald-900/30 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span className="font-bagel text-sm" style={{ color: "#10B981" }}>VEGA Dental AI</span>
          <span>© {new Date().getFullYear()} · Inteligência estratégica para dentistas</span>
        </div>
      </footer>
    </div>
  );
};

export default SaltoEvolutivo;
