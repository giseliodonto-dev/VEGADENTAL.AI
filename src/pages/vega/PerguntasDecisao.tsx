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

  // === PERFIL: INSEGURO / MEDO → Foco em Segurança e Resultado Estético Final ===
  if (profile === "inseguro") {
    if (ob.includes("dói") || ob.includes("dor") || ob.includes("medo") || ob.includes("agulha") || ob.includes("anestesia"))
      return `"Eu entendo perfeitamente o seu receio — e ele é mais comum do que imagina. Mas me permite uma reflexão: o desconforto do procedimento dura minutos, com toda a segurança da tecnologia que usamos aqui. Já o desconforto de conviver com esse problema… esse dura anos. O resultado final vai devolver para você algo que não tem preço: a segurança de sorrir sem pensar duas vezes."`;
    if (ob.includes("pensar") || ob.includes("depois") || ob.includes("calma") || ob.includes("ainda não"))
      return `"Claro, pensar é sábio. Mas me diz uma coisa com sinceridade: o que exatamente você ainda precisa avaliar? Porque o diagnóstico já está feito, a solução já existe, e cada semana que passa é uma semana a mais convivendo com algo que tem conserto. Eu estou aqui justamente para te dar toda a segurança que você precisa para decidir com tranquilidade."`;
    if (ob.includes("caro") || ob.includes("preço") || ob.includes("valor") || ob.includes("custo"))
      return `"Eu entendo que o investimento gera reflexão. Mas quero te fazer uma pergunta sincera: quanto está custando para você, hoje, viver com esse incômodo? O custo de não tratar não aparece na conta do banco — mas aparece na sua autoestima, no seu sono, na forma como você se apresenta ao mundo. O procedimento que fazemos aqui é seguro, previsível e o resultado estético é natural."`;
    if (ob.includes("marido") || ob.includes("esposa") || ob.includes("família") || ob.includes("consultar"))
      return `"É bonito querer compartilhar decisões com quem a gente ama. Mas essa decisão é sobre a sua saúde — sobre como você se sente, como você dorme, como você sorri. Me permite te mostrar exatamente como vai ficar o resultado final? Quando você visualizar a transformação, vai ter a segurança de saber que essa é a decisão certa — para você e para quem te ama."`;
    return `"Eu sei que dar esse passo exige coragem. Mas quero que você saiba: aqui, cada etapa é feita com máxima segurança e previsibilidade. O resultado final vai te devolver algo que você merece — a liberdade de sorrir com confiança. Me permite te mostrar como vai ficar?"`;
  }

  // === PERFIL: FOCADO EM PREÇO → Foco no Custo da Inércia ===
  if (profile === "preco") {
    if (ob.includes("caro") || ob.includes("preço") || ob.includes("valor") || ob.includes("custo") || ob.includes("dinheiro"))
      return `"Eu entendo a preocupação com o investimento. Mas me permite uma reflexão importante: o custo de não tratar nunca aparece no orçamento — mas ele existe. É o dente vizinho que começa a migrar, é a mastigação que piora, é o tratamento que daqui a um ano vai custar o dobro. O senhor prefere investir agora na solução definitiva, ou arcar amanhã com um problema maior e mais caro?"`;
    if (ob.includes("outro") || ob.includes("compara") || ob.includes("concorrente") || ob.includes("dentista") || ob.includes("mais barato"))
      return `"Fico feliz que esteja pesquisando — isso mostra responsabilidade. A diferença é que aqui o investimento inclui materiais premium, tecnologia de ponta e acompanhamento completo. O preço mais baixo normalmente cobra depois — em retrabalho, em dor, em frustração. A pergunta real é: você quer economizar hoje e pagar duas vezes, ou investir uma vez e ter resultado para a vida?"`;
    if (ob.includes("parcela") || ob.includes("desconto") || ob.includes("condição") || ob.includes("pagamento"))
      return `"Vamos encontrar a melhor condição para você — isso eu resolvo. Mas antes, me responda: se o investimento coubesse confortavelmente no seu orçamento, você decidiria hoje? Porque o que não pode esperar é a sua saúde. Cada mês sem tratar é um mês onde o problema avança — e o custo da inércia sempre é maior do que o custo da ação."`;
    if (ob.includes("pensar") || ob.includes("depois") || ob.includes("calma"))
      return `"Pensar é prudente. Mas quero te dar um dado importante: problemas bucais não estacionam — eles progridem. O tratamento que hoje custa X, daqui a seis meses pode custar 2X porque o quadro evoluiu. O senhor prefere resolver agora com conforto, ou esperar e lidar com um problema maior?"`;
    return `"O investimento em saúde nunca é gasto — é a decisão mais inteligente que você pode tomar. Porque o custo de não tratar é silencioso: ele aparece na sua qualidade de vida, na sua confiança, e na conta de um tratamento futuro muito mais complexo. Me permite te mostrar exatamente o que está incluso e por que cada centavo faz diferença?"`;
  }

  // === PERFIL: DESEJO ESTÉTICO → Foco na Autoestima e Prioridade Pessoal ===
  if (profile === "estetico") {
    if (ob.includes("marido") || ob.includes("esposa") || ob.includes("família") || ob.includes("consultar") || ob.includes("opinião"))
      return `"É lindo pensar na família. Mas me permite uma pergunta com carinho: essa decisão é sobre o seu sorriso, a sua autoestima, a forma como você se sente quando se olha no espelho. Se dependesse só de você — do que você sente, do que você deseja — você já teria decidido? Porque você merece se colocar como prioridade."`;
    if (ob.includes("caro") || ob.includes("preço") || ob.includes("valor"))
      return `"Já imaginou como vai se sentir quando olhar no espelho e ver o sorriso que sempre quis? Esse investimento muda a forma como você se apresenta ao mundo, como você sorri numa foto, como você se sente numa reunião. A pergunta é: quanto vale para você viver todos os dias com a confiança que merece? Você é a sua maior prioridade."`;
    if (ob.includes("pensar") || ob.includes("depois") || ob.includes("calma"))
      return `"Eu entendo querer refletir. Mas me conta com sinceridade: há quanto tempo você pensa em transformar o seu sorriso? Cada mês que passa é mais um mês que você adia a melhor versão de si mesma. Você merece se olhar no espelho e sentir orgulho — e isso pode começar hoje."`;
    if (ob.includes("natural") || ob.includes("resultado") || ob.includes("fica bom") || ob.includes("aparência"))
      return `"O nosso compromisso é com a naturalidade absoluta. Ninguém vai olhar para você e ver um 'procedimento' — vão ver a melhor versão do seu sorriso. Posso te mostrar casos reais de pacientes com o mesmo perfil? Quando você se vir neles, vai entender que essa transformação é para você."`;
    if (ob.includes("medo") || ob.includes("dói") || ob.includes("dor"))
      return `"Eu respeito muito o que você sente. Mas pense comigo: o que dói mais — um procedimento seguro que dura minutos, ou continuar evitando sorrir abertamente, escondendo os dentes nas fotos, deixando a autoestima em segundo plano? Você merece se sentir bonita. E eu estou aqui para garantir que o caminho seja confortável."`;
    return `"O sorriso é a primeira coisa que as pessoas notam em você. Quando você se imagina daqui a 3 meses com o sorriso que sempre sonhou — confiante, radiante, sem esconder nada — isso vale mais do que qualquer hesitação de hoje. Você é a sua prioridade. Me permite te mostrar o caminho?"`;
  }

  return `"Me responda com sinceridade: o que precisa acontecer para você tomar essa decisão hoje? Porque eu estou aqui para resolver cada uma das suas dúvidas — e a sua saúde e a sua autoestima não podem esperar."`;
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
