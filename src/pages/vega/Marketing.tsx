import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Video, Search, Copy, CheckCheck, Sparkles, Crown, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Categoria = "Todos" | "Estética" | "Implantes" | "Autoridade";

const categoryIcons: Record<string, React.ReactNode> = {
  Estética: <Sparkles className="h-3.5 w-3.5" />,
  Implantes: <Wrench className="h-3.5 w-3.5" />,
  Autoridade: <Crown className="h-3.5 w-3.5" />,
};

const roteiros = [
  { id: 1, categoria: "Estética", titulo: "O segredo do sorriso natural", roteiro: "Gancho: 'Seu sorriso pode parecer natural E ser perfeito.' Desenvolvimento: Mostrar antes/depois de lentes de contato dental. Explicar a diferença entre lentes e facetas. CTA: 'Salve para mostrar ao seu dentista.'" },
  { id: 2, categoria: "Estética", titulo: "Clareamento: mitos e verdades", roteiro: "Gancho: 'Clareamento caseiro funciona? A verdade vai te surpreender.' Listar 3 mitos comuns. Mostrar o procedimento profissional. CTA: 'Quer saber se você é candidato? Comente EU QUERO.'" },
  { id: 3, categoria: "Estética", titulo: "Harmonização x Naturalidade", roteiro: "Gancho: 'Harmonização orofacial não precisa ser exagerada.' Mostrar casos sutis. Explicar a importância do planejamento. CTA: 'Me siga para mais conteúdo sobre odontologia estética.'" },
  { id: 4, categoria: "Implantes", titulo: "Implante dói? A verdade", roteiro: "Gancho: 'Você tem medo de colocar implante? Assista até o final.' Explicar o procedimento passo a passo. Desmistificar a dor. CTA: 'Compartilhe com alguém que precisa ver isso.'" },
  { id: 5, categoria: "Implantes", titulo: "Prótese x Implante: qual escolher?", roteiro: "Gancho: 'Prótese ou implante? A resposta depende de um fator.' Comparar vantagens de cada opção. Quando um é melhor que o outro. CTA: 'Agende uma avaliação gratuita — link na bio.'" },
  { id: 6, categoria: "Implantes", titulo: "Carga imediata: dente no mesmo dia", roteiro: "Gancho: 'Sabia que é possível sair do consultório com dente no mesmo dia?' Explicar o protocolo de carga imediata. Para quem é indicado. CTA: 'Toque no link da bio para saber mais.'" },
  { id: 7, categoria: "Autoridade", titulo: "Um dia na vida de um dentista", roteiro: "Gancho: 'Você sabe como é a rotina real de um dentista?' Mostrar bastidores reais do consultório. Humanizar com café da manhã, preparo, atendimento. CTA: 'Me siga para conhecer mais da rotina.'" },
  { id: 8, categoria: "Autoridade", titulo: "Por que escolhi a odontologia", roteiro: "Gancho: 'Eu quase desisti da faculdade no 3º ano.' Contar história pessoal e motivação. O momento que mudou tudo. CTA: 'Comente sua história nos comentários.'" },
  { id: 9, categoria: "Autoridade", titulo: "Erros que pacientes cometem", roteiro: "Gancho: 'O maior erro que meus pacientes cometem é...' Listar 3 erros comuns de cuidado bucal. Dar soluções simples para cada um. CTA: 'Salve esse vídeo para não esquecer.'" },
  { id: 10, categoria: "Estética", titulo: "Gengivoplastia: o sorriso gengival", roteiro: "Gancho: 'Incomodado com o sorriso gengival? Existe solução.' Explicar procedimento simples. Mostrar resultado. CTA: 'Marque alguém que precisa ver isso.'" },
  { id: 11, categoria: "Estética", titulo: "Botox para bruxismo", roteiro: "Gancho: 'Você range os dentes durante a noite?' Explicar o bruxismo e suas consequências. Como o botox pode ajudar. CTA: 'Agende uma avaliação — link na bio.'" },
  { id: 12, categoria: "Autoridade", titulo: "Equipamentos que uso na clínica", roteiro: "Gancho: 'Esses equipamentos custaram mais que um carro.' Mostrar scanner intraoral, laser, etc. Explicar por que cada um faz diferença. CTA: 'Tecnologia importa. Me siga para mais conteúdo.'" },
  { id: 13, categoria: "Implantes", titulo: "ALL-on-4: tudo sobre", roteiro: "Gancho: 'Todos os dentes em apenas 4 implantes? Sim, é possível.' Explicar técnica ALL-on-4. Casos ideais. CTA: 'Envie para alguém que usa dentadura.'" },
  { id: 14, categoria: "Estética", titulo: "Preenchimento labial com ácido hialurônico", roteiro: "Gancho: 'Lábios mais volumosos sem exagero — é possível?' Mostrar técnica e resultado natural. CTA: 'Salve e compartilhe.'" },
  { id: 15, categoria: "Autoridade", titulo: "Quanto custa abrir um consultório?", roteiro: "Gancho: 'R$ 200 mil, R$ 500 mil ou R$ 1 milhão?' Mostrar faixas reais de investimento. Dicas para economizar. CTA: 'Me siga para mais conteúdo sobre gestão dental.'" },
  { id: 16, categoria: "Estética", titulo: "Design do Sorriso Digital", roteiro: "Gancho: 'O sorriso dos seus sonhos pode ser planejado no computador.' Mostrar software de planejamento. Resultado previsível. CTA: 'Quer ver o seu? Comente SIM.'" },
  { id: 17, categoria: "Implantes", titulo: "Enxerto ósseo: quando é necessário?", roteiro: "Gancho: 'Seu dentista disse que precisa de enxerto? Não tenha medo.' Explicar procedimento. Quando é necessário. CTA: 'Compartilhe com quem precisa dessa informação.'" },
  { id: 18, categoria: "Autoridade", titulo: "Cases de sucesso da minha clínica", roteiro: "Gancho: 'Essa paciente chorou ao ver o resultado.' Mostrar transformação real (com autorização). Contar a história. CTA: 'Quer a sua transformação? Link na bio.'" },
  { id: 19, categoria: "Estética", titulo: "Facetas de porcelana: vale a pena?", roteiro: "Gancho: 'Facetas de porcelana duram para sempre? A resposta é...' Duração real. Cuidados necessários. CTA: 'Salve para consultar depois.'" },
  { id: 20, categoria: "Implantes", titulo: "Implante e diabetes: pode?", roteiro: "Gancho: 'Sou diabético, posso fazer implante?' Explicar relação diabetes x implante. Cuidados especiais. CTA: 'Envie para alguém diabético que precisa saber disso.'" },
];

const Roteiros = () => {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Todos");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtrados = roteiros.filter((r) => {
    const matchSearch =
      r.titulo.toLowerCase().includes(search.toLowerCase()) ||
      r.roteiro.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoria === "Todos" || r.categoria === categoria;
    return matchSearch && matchCat;
  });

  const copyRoteiro = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Roteiro copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categorias: Categoria[] = ["Todos", "Estética", "Implantes", "Autoridade"];

  return (
    <AppLayout title="Marketing — Roteiros Reels">
      <div className="space-y-5 max-w-4xl">
        <div
          className="animate-fade-up flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar roteiro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {categorias.map((cat) => (
              <Button
                key={cat}
                variant={categoria === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoria(cat)}
                className="gap-1.5 text-xs"
              >
                {cat !== "Todos" && categoryIcons[cat]}
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <p
          className="animate-fade-up text-xs text-muted-foreground"
          style={{ animationDelay: "60ms", opacity: 0, animationFillMode: "forwards" }}
        >
          {filtrados.length} roteiros encontrados
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {filtrados.map((r, i) => (
            <div
              key={r.id}
              className="animate-fade-up rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md group"
              style={{
                animationDelay: `${120 + i * 50}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-accent shrink-0" />
                  <h3 className="text-sm font-semibold leading-tight">{r.titulo}</h3>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent/10 text-accent whitespace-nowrap">
                  {r.categoria}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                {r.roteiro}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs w-full"
                onClick={() => copyRoteiro(r.id, `${r.titulo}\n\n${r.roteiro}`)}
              >
                {copiedId === r.id ? (
                  <>
                    <CheckCheck className="h-3 w-3" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copiar Roteiro
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Roteiros;
