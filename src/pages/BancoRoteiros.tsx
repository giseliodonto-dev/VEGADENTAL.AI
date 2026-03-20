import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Video, Search, Sparkles, Crown, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Categoria = "Estética" | "Implantes" | "Autoridade" | "Todas";

interface Roteiro {
  titulo: string;
  categoria: "Estética" | "Implantes" | "Autoridade";
  roteiro: string;
}

const roteiros: Roteiro[] = [
  // ESTÉTICA (20)
  { titulo: "3 sinais de que seu sorriso está envelhecendo", categoria: "Estética", roteiro: "Gancho: 'Seu sorriso pode estar te envelhecendo sem você saber.' Mostre 3 sinais: dentes amarelados, gengiva retraída, desgaste. Finalize com antes/depois e CTA." },
  { titulo: "Lente de contato dental: verdade vs mito", categoria: "Estética", roteiro: "Comece desfazendo o mito mais comum. Mostre o processo real. Use depoimento de paciente. Termine com 'Agende sua avaliação'." },
  { titulo: "Por que seu clareamento não durou", categoria: "Estética", roteiro: "Liste 3 erros comuns pós-clareamento. Dê dicas práticas de manutenção. Mostre resultado ideal vs mal cuidado." },
  { titulo: "O sorriso ideal para seu formato de rosto", categoria: "Estética", roteiro: "Mostre 3 formatos de rosto e o sorriso que harmoniza. Use simulação digital se possível." },
  { titulo: "Antes e depois que vão te surpreender", categoria: "Estética", roteiro: "Selecione 3-5 casos transformadores. Narre a história do paciente brevemente. Foque na emoção da transformação." },
  { titulo: "Clareamento caseiro vs consultório", categoria: "Estética", roteiro: "Compare os dois métodos com honestidade. Mostre prós e contras. Recomende o melhor para cada perfil de paciente." },
  { titulo: "O que ninguém te conta sobre facetas", categoria: "Estética", roteiro: "Desmistifique: desgaste dental, durabilidade, manutenção. Seja transparente para gerar confiança." },
  { titulo: "Harmonização dental: o que é possível", categoria: "Estética", roteiro: "Mostre casos reais de harmonização. Explique o planejamento digital do sorriso. CTA para avaliação." },
  { titulo: "5 alimentos que mancham seus dentes", categoria: "Estética", roteiro: "Liste os vilões: café, vinho, molho de tomate, etc. Dê alternativas ou dicas de prevenção." },
  { titulo: "Gengivoplastia: o segredo do sorriso gengival", categoria: "Estética", roteiro: "Explique o que é sorriso gengival. Mostre o procedimento de forma leve. Antes/depois impactante." },
  { titulo: "Sorriso perfeito em 1 semana: é possível?", categoria: "Estética", roteiro: "Mostre um caso real de tratamento rápido. Explique o que é viável. Gerencie expectativas com honestidade." },
  { titulo: "Resina vs Porcelana: qual escolher?", categoria: "Estética", roteiro: "Compare durabilidade, estética, preço. Use casos clínicos para ilustrar. Ajude o paciente a decidir." },
  { titulo: "Dentes perfeitos existem?", categoria: "Estética", roteiro: "Reflexão sobre padrões de beleza. Mostre que 'perfeito' é relativo. Foque em harmonia e saúde." },
  { titulo: "Como funciona o design de sorriso digital", categoria: "Estética", roteiro: "Mostre o software em ação. Explique cada etapa do planejamento. Paciente vendo o resultado antes." },
  { titulo: "Transformação de sorriso em 60 segundos", categoria: "Estética", roteiro: "Timelapse de um procedimento estético. Música envolvente. Antes/depois dramático no final." },
  { titulo: "Os erros mais comuns em lentes de contato", categoria: "Estética", roteiro: "Mostre casos mal feitos (sem expor pacientes). Explique o que diferencia um bom trabalho." },
  { titulo: "Branqueamento dental: mitos perigosos", categoria: "Estética", roteiro: "Alerte sobre receitas caseiras perigosas. Mostre os riscos. Oriente sobre o caminho seguro." },
  { titulo: "Seu sorriso combina com você?", categoria: "Estética", roteiro: "Teste interativo: peça para o seguidor avaliar seu sorriso. Ofereça avaliação gratuita como CTA." },
  { titulo: "A cor ideal para seus dentes", categoria: "Estética", roteiro: "Explique a escala de cores. Mostre que branco demais é artificial. Encontre o tom natural ideal." },
  { titulo: "Sorriso de celebridade: quanto custa?", categoria: "Estética", roteiro: "Aborde com transparência. Mostre faixas de investimento. Desmistifique que é só para ricos." },

  // IMPLANTES (20)
  { titulo: "Implante dói? A verdade que ninguém conta", categoria: "Implantes", roteiro: "Quebre o medo principal. Explique a anestesia. Use depoimento de paciente. Mostre o pós-operatório real." },
  { titulo: "Perdi um dente: e agora?", categoria: "Implantes", roteiro: "Mostre as 3 opções (prótese, ponte, implante). Compare prós e contras. Guie para a melhor solução." },
  { titulo: "Implante ou prótese: qual a melhor opção?", categoria: "Implantes", roteiro: "Compare com honestidade. Foque em qualidade de vida. Use casos reais para cada opção." },
  { titulo: "O passo a passo do implante dental", categoria: "Implantes", roteiro: "Explique cada etapa de forma simples. Use animações ou ilustrações. Reduza a ansiedade do paciente." },
  { titulo: "Quanto tempo dura um implante?", categoria: "Implantes", roteiro: "Dê dados reais de durabilidade. Explique os cuidados que prolongam a vida útil. Casos de 10+ anos." },
  { titulo: "Carga imediata: saia com dente no mesmo dia", categoria: "Implantes", roteiro: "Explique quando é possível. Mostre o processo. Gerencie expectativas sobre quem é candidato." },
  { titulo: "5 mitos sobre implantes dentários", categoria: "Implantes", roteiro: "Liste e desminta: idade, dor, rejeição, preço, duração. Use dados e evidências." },
  { titulo: "Protocolo sobre implantes: volta a sorrir", categoria: "Implantes", roteiro: "Explique o protocolo completo. Mostre transformação dramática. Foque no impacto emocional." },
  { titulo: "Posso fazer implante com pouco osso?", categoria: "Implantes", roteiro: "Explique enxerto ósseo. Mostre que é possível. Dê esperança com casos reais." },
  { titulo: "Rejeição de implante: isso existe?", categoria: "Implantes", roteiro: "Explique que rejeição é raro. Diferencie de falha. Mostre taxas de sucesso reais (97%+)." },
  { titulo: "A vida antes e depois do implante", categoria: "Implantes", roteiro: "Depoimento emocional de paciente. Foque em comer, sorrir, autoestima. História real e tocante." },
  { titulo: "Implante dental e diabetes: pode?", categoria: "Implantes", roteiro: "Aborde com responsabilidade. Explique os cuidados especiais. Quando é seguro prosseguir." },
  { titulo: "Quanto custa um implante em 2026?", categoria: "Implantes", roteiro: "Seja transparente com faixas de preço. Explique o que influencia o valor. Compare com custo de não tratar." },
  { titulo: "Implante na terceira idade", categoria: "Implantes", roteiro: "Desmistifique a idade como barreira. Mostre pacientes 60+. Foque em qualidade de vida." },
  { titulo: "Enxerto ósseo: quando e por quê", categoria: "Implantes", roteiro: "Explique de forma simples. Mostre que não é tão assustador. Use animações didáticas." },
  { titulo: "Implante zigomático: última alternativa", categoria: "Implantes", roteiro: "Explique para quem é indicado. Mostre a técnica. Posicione como solução avançada." },
  { titulo: "Dia do implante: o que esperar", categoria: "Implantes", roteiro: "Rotina completa do dia. Reduza ansiedade. Dicas práticas de preparação." },
  { titulo: "All-on-4: tudo sobre a técnica", categoria: "Implantes", roteiro: "Explique o conceito. Para quem é indicado. Vantagens sobre métodos tradicionais." },
  { titulo: "Cuidados pós-implante que fazem diferença", categoria: "Implantes", roteiro: "Lista prática de cuidados. O que evitar. Sinais de alerta para procurar o dentista." },
  { titulo: "Por que meu implante falhou?", categoria: "Implantes", roteiro: "Aborde causas comuns com empatia. Ofereça soluções. Mostre que é possível refazer." },

  // AUTORIDADE (20)
  { titulo: "Um dia na vida de um dentista", categoria: "Autoridade", roteiro: "Mostre a rotina real. Bastidores do consultório. Humanize a profissão com humor e autenticidade." },
  { titulo: "Por que me tornei dentista", categoria: "Autoridade", roteiro: "Conte sua história pessoal. Seja vulnerável. Conecte emocionalmente com a audiência." },
  { titulo: "Os equipamentos que uso na clínica", categoria: "Autoridade", roteiro: "Tour pelo consultório. Mostre tecnologia. Explique como isso beneficia o paciente." },
  { titulo: "Meus 5 maiores aprendizados como dentista", categoria: "Autoridade", roteiro: "Reflexões genuínas. Misture técnica e humano. Mostre evolução profissional." },
  { titulo: "Caso clínico que mudou minha carreira", categoria: "Autoridade", roteiro: "Conte um caso desafiador (com permissão). Mostre o processo de decisão. Resultado impactante." },
  { titulo: "O que os dentistas gostariam que você soubesse", categoria: "Autoridade", roteiro: "Verdades que pacientes ignoram. Seja direto mas empático. Educação com personalidade." },
  { titulo: "Minha especialização: por que escolhi essa área", categoria: "Autoridade", roteiro: "Explique sua jornada de especialização. O que te apaixona. Como isso ajuda seus pacientes." },
  { titulo: "Congresso odontológico: o que aprendi", categoria: "Autoridade", roteiro: "Compartilhe novidades. Mostre atualização constante. Posicione-se como referência." },
  { titulo: "Perguntas que todo paciente deveria fazer", categoria: "Autoridade", roteiro: "Empodere o paciente. Liste 5 perguntas essenciais. Mostre que transparência é seu valor." },
  { titulo: "Odontologia baseada em evidências", categoria: "Autoridade", roteiro: "Explique como você toma decisões clínicas. Cite estudos. Diferencie-se de práticas antigas." },
  { titulo: "Minha equipe: quem cuida de você", categoria: "Autoridade", roteiro: "Apresente cada membro. Mostre o ambiente. Gere confiança no time inteiro." },
  { titulo: "Tecnologia 3D na odontologia", categoria: "Autoridade", roteiro: "Mostre scanner, impressora 3D, planejamento digital. Explique benefícios práticos." },
  { titulo: "Como escolher um bom dentista", categoria: "Autoridade", roteiro: "Dê critérios objetivos. Posicione-se indiretamente. Eduque o paciente a valorizar qualidade." },
  { titulo: "Mitos da internet sobre saúde bucal", categoria: "Autoridade", roteiro: "Desminta 5 mitos virais. Use humor. Posicione-se como fonte confiável." },
  { titulo: "Biossegurança: como protegemos você", categoria: "Autoridade", roteiro: "Mostre protocolos de esterilização. Gere confiança. Diferencie de clínicas populares." },
  { titulo: "O futuro da odontologia", categoria: "Autoridade", roteiro: "Tendências: IA, impressão 3D, telessaúde. Mostre visão de futuro e inovação." },
  { titulo: "Respondendo comentários dos seguidores", categoria: "Autoridade", roteiro: "Selecione perguntas reais. Responda com expertise. Gere engajamento e confiança." },
  { titulo: "Erros que cometi como dentista iniciante", categoria: "Autoridade", roteiro: "Seja autêntico. Mostre vulnerabilidade. Transforme erros em lições valiosas." },
  { titulo: "Por que invisto em formação contínua", categoria: "Autoridade", roteiro: "Mostre certificados, cursos, congressos. Explique como isso impacta o paciente." },
  { titulo: "Tour pelo meu consultório renovado", categoria: "Autoridade", roteiro: "Mostre o espaço. Destaque conforto do paciente. Faça o seguidor querer conhecer pessoalmente." },
];

const categoriaConfig: Record<string, { icon: typeof Video; color: string }> = {
  Estética: { icon: Sparkles, color: "bg-accent/15 text-accent" },
  Implantes: { icon: Wrench, color: "bg-primary/15 text-primary" },
  Autoridade: { icon: Crown, color: "bg-success/15 text-success" },
};

const BancoRoteiros = () => {
  const [filtro, setFiltro] = useState<Categoria>("Todas");
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);

  const filtrados = roteiros.filter((r) => {
    const matchCategoria = filtro === "Todas" || r.categoria === filtro;
    const matchBusca = r.titulo.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  return (
    <AppLayout title="Banco de Roteiros">
      <div className="space-y-5 max-w-4xl">
        {/* Header */}
        <div
          className="animate-fade-up flex items-center gap-3"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">60 Roteiros para Reels</h3>
            <p className="text-xs text-muted-foreground">Prontos para gravar — escolha, adapte e publique</p>
          </div>
        </div>

        {/* Filters */}
        <div
          className="animate-fade-up flex flex-col sm:flex-row gap-3"
          style={{ animationDelay: "80ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar roteiro..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["Todas", "Estética", "Implantes", "Autoridade"] as Categoria[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltro(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  filtro === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-muted-foreground">
          {filtrados.length} roteiro{filtrados.length !== 1 ? "s" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
        </p>

        {/* List */}
        <div className="space-y-2">
          {filtrados.map((roteiro, i) => {
            const config = categoriaConfig[roteiro.categoria];
            const Icon = config.icon;
            const isOpen = expandido === i;

            return (
              <div
                key={i}
                className="animate-fade-up rounded-xl border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                style={{ animationDelay: `${120 + i * 30}ms`, opacity: 0, animationFillMode: "forwards" }}
              >
                <button
                  onClick={() => setExpandido(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/20 active:scale-[0.995]"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{roteiro.titulo}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {roteiro.categoria}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-0 border-t">
                    <div className="mt-3 rounded-lg bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Roteiro
                      </p>
                      <p className="text-sm leading-relaxed">{roteiro.roteiro}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default BancoRoteiros;
