import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Sparkles, Crown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const profiles: Record<string, string> = {
  inseguro: "Inseguro / Medo",
  preco: "Focado em Preço",
  estetico: "Desejo Estético",
};

type ResponseEntry = {
  objection: string;
  profile: string;
  question: string;
};

function generateQuestion(objection: string, profile: string): string {
  const ob = objection.toLowerCase();

  if (profile === "inseguro") {
    if (ob.includes("caro") || ob.includes("preço") || ob.includes("valor"))
      return `"Eu entendo que investir na sua saúde gera reflexão. Mas me diz uma coisa: quanto custa para você viver mais um ano com esse desconforto — nas suas noites de sono, na sua autoestima, na sua segurança ao sorrir?"`;
    if (ob.includes("marido") || ob.includes("esposa") || ob.includes("família") || ob.includes("consultar"))
      return `"É natural querer alinhar com quem a gente ama. Mas me permite uma pergunta sincera: se o seu marido estivesse sentindo essa mesma dor, esse mesmo incômodo, você pediria que ele esperasse — ou cuidasse logo de si mesmo?"`;
    if (ob.includes("pensar") || ob.includes("depois") || ob.includes("calma"))
      return `"Claro, pensar é sábio. Mas o que exatamente você precisa avaliar? Porque a sua saúde já te deu o diagnóstico — e cada dia que passa sem tratamento é um dia a mais convivendo com algo que tem solução."`;
    if (ob.includes("medo") || ob.includes("dói") || ob.includes("dor"))
      return `"Eu respeito muito o que você sente. Mas posso te fazer uma pergunta? O que dói mais: o procedimento que dura alguns minutos — ou continuar anos com esse problema afetando sua qualidade de vida?"`;
    return `"Entendo sua preocupação. Me responda com sinceridade: daqui a seis meses, o que vai pesar mais — ter investido na solução, ou continuar convivendo com o problema?"`;
  }

  if (profile === "preco") {
    if (ob.includes("caro") || ob.includes("preço") || ob.includes("valor"))
      return `"Quando você compara valores, está comparando exatamente o quê? Porque aqui o investimento inclui tecnologia de ponta, materiais premium e um acompanhamento que não existe no mercado. A pergunta real é: você quer o mais barato — ou o que vai durar e te dar segurança por anos?"`;
    if (ob.includes("outro") || ob.includes("compara") || ob.includes("concorrente") || ob.includes("dentista"))
      return `"Fico feliz que esteja pesquisando — isso mostra que você leva a sério. A diferença é que aqui a gente não entrega apenas um procedimento, a gente entrega um resultado com garantia de acompanhamento. O preço mais baixo normalmente cobra depois — em retrabalho."`;
    if (ob.includes("parcela") || ob.includes("desconto") || ob.includes("condição"))
      return `"Vamos encontrar a melhor condição para você. Mas antes, me responde: se o investimento coubesse no seu orçamento de forma confortável, você decidiria hoje? Porque o mais importante é que a solução não pode esperar — a sua saúde já decidiu por você."`;
    return `"Investir em saúde nunca é gasto — é a decisão mais inteligente que você pode tomar. Me permite te mostrar exatamente o que está incluso e por que cada centavo faz diferença no seu resultado?"`;
  }

  if (profile === "estetico") {
    if (ob.includes("caro") || ob.includes("preço") || ob.includes("valor"))
      return `"Você já imaginou como vai se sentir quando olhar no espelho e ver o sorriso que sempre quis? Esse é o tipo de investimento que muda a forma como você se apresenta ao mundo. A pergunta é: quanto vale para você se sentir confiante todos os dias?"`;
    if (ob.includes("pensar") || ob.includes("depois") || ob.includes("calma"))
      return `"Eu entendo querer refletir. Mas me conta: há quanto tempo você pensa em transformar o seu sorriso? Cada mês que passa é mais um mês que você deixa de viver com a confiança que merece."`;
    if (ob.includes("natural") || ob.includes("resultado") || ob.includes("fica bom"))
      return `"O nosso compromisso é com a naturalidade. Ninguém vai olhar para você e ver um 'procedimento' — vão ver a melhor versão do seu sorriso. Posso te mostrar casos reais de pacientes com o mesmo perfil que o seu?"`;
    if (ob.includes("marido") || ob.includes("esposa") || ob.includes("família"))
      return `"É bonito pensar na família. Mas essa decisão é sobre você — sobre como você se sente quando sorri, quando fala, quando se olha no espelho. Me diz: se dependesse só de você, você já teria decidido?"`;
    return `"O sorriso é a primeira coisa que as pessoas notam. Quando você se imagina daqui a 3 meses com o sorriso que sempre sonhou — isso vale mais do que qualquer hesitação de hoje?"`;
  }

  return `"Me responda com sinceridade: o que precisa acontecer para você tomar essa decisão hoje? Porque eu estou aqui para resolver cada uma das suas dúvidas — e a sua saúde não pode esperar."`;
}

const PerguntasDecisao = () => {
  const [objection, setObjection] = useState("");
  const [profile, setProfile] = useState("");
  const [result, setResult] = useState<ResponseEntry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!objection.trim() || !profile) return;
    setIsGenerating(true);
    setResult(null);

    setTimeout(() => {
      const question = generateQuestion(objection, profile);
      setResult({ objection: objection.trim(), profile, question });
      setIsGenerating(false);
    }, 800);
  };

  return (
    <AppLayout title="Perguntas de Decisão">
      <div className="max-w-2xl space-y-8">
        {/* Header */}
        <div
          className="animate-fade-up flex items-center gap-3"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Crown className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Oráculo VEGA</h2>
            <p className="text-xs text-muted-foreground">
              Perguntas que transformam objeções em decisões
            </p>
          </div>
        </div>

        {/* Form */}
        <Card
          className="animate-fade-up space-y-5 p-6"
          style={{ animationDelay: "80ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold">Objeção do Paciente</label>
            <Textarea
              value={objection}
              onChange={(e) => setObjection(e.target.value)}
              placeholder="Ex: 'Achei caro', 'Vou falar com meu marido', 'Preciso pensar'..."
              className="min-h-[88px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Perfil do Paciente</label>
            <Select value={profile} onValueChange={setProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(profiles).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!objection.trim() || !profile || isGenerating}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.98] transition-all font-semibold text-sm h-11"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Gerando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Gerar Pergunta de Decisão VEGA
              </span>
            )}
          </Button>
        </Card>

        {/* Result */}
        {result && (
          <Card
            className="animate-fade-up overflow-hidden"
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="border-b bg-accent/10 px-6 py-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent">
                Pergunta de Decisão VEGA
              </span>
              <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                {profiles[result.profile]}
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>Objeção:</strong> "{result.objection}"
                </span>
              </div>
              <blockquote className="border-l-2 border-accent pl-4 text-sm leading-relaxed font-medium italic">
                {result.question}
              </blockquote>
              <p className="text-[11px] text-muted-foreground/60 text-right">
                — Mentoria VEGA GPS Dental
              </p>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default PerguntasDecisao;
