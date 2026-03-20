import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Sparkles, Crown, ChevronRight, ShieldCheck } from "lucide-react";
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
  focus: string;
};

function generateQuestion(objection: string, profile: string): { question: string; focus: string } {
  const ob = objection.toLowerCase();

  // === PERFIL: INSEGURO / MEDO → Foco em Conforto, Tecnologia, Preservação ===
  // === ESPECIALIDADES ARTESANAIS (prioridade máxima, independente de perfil) ===

  // Clareamento — Translucidez e Vitalidade
  if (ob.includes("clarear") || ob.includes("clareamento") || ob.includes("branco artificial") || ob.includes("giz") || ob.includes("branco opaco") || ob.includes("branquear"))
    return {
      focus: "Método VEGA: Translucidez e Vitalidade",
      question: `"Dona Maria, o meu protocolo não é sobre 'pintar' seus dentes de branco, mas sim devolver a vitalidade e a translucidez natural que o tempo escondeu. Você prefere um branco opaco de prateleira ou um sorriso iluminado que respeite a naturalidade do seu esmalte?"`,
    };

  // Harmonização Facial — Gerenciamento de Envelhecimento e Lapidação
  if (ob.includes("harmoniza") || ob.includes("deformad") || ob.includes("inflad") || ob.includes("preenchimento") || ob.includes("botox") || ob.includes("bichectomia") || ob.includes("rosto inchad"))
    return {
      focus: "Método VEGA: Gerenciamento de Envelhecimento e Lapidação",
      question: `"João, meu trabalho é de lapidação, não de preenchimento em massa. O objetivo é que as pessoas notem que você está mais descansado e rejuvenescido, sem conseguir apontar onde foi feito. Você prefere um rosto transformado por padrões genéricos ou uma face lapidada para revelar sua melhor versão de forma invisível?"`,
    };

  // Próteses — Escultura Individualizada e Reabilitação de Identidade
  if (ob.includes("prótese") || ob.includes("dentadura") || ob.includes("perceber") && (ob.includes("dente") || ob.includes("prótese")) || ob.includes("dente postiço") || ob.includes("protocolo"))
    return {
      focus: "Método VEGA: Escultura Individualizada e Reabilitação de Identidade",
      question: `"Sr. José, as minhas peças são esculturas individuais que imitam cada detalhe, sulco e matiz de um dente natural. Como o projeto é feito à mão para o seu rosto, ele devolve a sua identidade, não apenas a função. O senhor prefere uma solução padrão de laboratório ou uma reabilitação artesanal que ninguém perceba que não é sua?"`,
    };

  // Ortodontia — Arquitetura de Sorriso e Engenharia Facial
  if (ob.includes("aparelho") || ob.includes("ortodon") || ob.includes("torto") || ob.includes("alinhador") || ob.includes("invisalign") || ob.includes("dente torto") || ob.includes("mordida") || ob.includes("braquete"))
    return {
      focus: "Método VEGA: Arquitetura de Sorriso e Engenharia Facial",
      question: `"O meu trabalho de ortodontia não é apenas alinhar dentes — é projetar a arquitetura do seu sorriso em harmonia com o seu rosto. Cada movimento é calculado para criar proporção, simetria e equilíbrio facial. Você prefere um alinhamento genérico de fábrica ou um projeto de engenharia facial desenhado exclusivamente para a sua face?"`,
    };

  // Endodontia — Preservação de Raiz e Resgate Biológico
  if (ob.includes("canal") || ob.includes("endodon") || ob.includes("nervo") || ob.includes("raiz") || ob.includes("infecç") || ob.includes("inflamaç") || ob.includes("abscesso") || ob.includes("dente morto"))
    return {
      focus: "Método VEGA: Preservação de Raiz e Resgate Biológico",
      question: `"Eu entendo o receio. Mas o tratamento de canal que faço aqui é um resgate biológico — é preservar a raiz original que a natureza te deu, com tecnologia de ponta e precisão milimétrica. A alternativa é perder esse dente para sempre. O senhor prefere resgatar o que é seu com segurança ou abrir mão de uma estrutura que nenhum implante do mundo replica com a mesma perfeição?"`,
    };

  // Periodontia — Fundação e Longevidade Estrutural
  if (ob.includes("gengiva") || ob.includes("periodon") || ob.includes("sangra") || ob.includes("retraç") || ob.includes("mobilidade") || ob.includes("dente mole") || ob.includes("osso") || ob.includes("raspagem"))
    return {
      focus: "Método VEGA: Fundação e Longevidade Estrutural",
      question: `"A gengiva é a fundação do seu sorriso — sem uma base saudável, nenhum tratamento estético sobrevive. O meu protocolo periodontal é como restaurar os alicerces de uma obra de arte: invisível, mas essencial. Você prefere tratar a fundação agora e garantir a longevidade de tudo que construímos, ou arriscar perder dentes que poderiam durar décadas?"`,
    };

  // === PERFIL: INSEGURO / MEDO ===
  if (profile === "inseguro") {
    // Medo de dor — Implantes / Cirurgia
    if (ob.includes("dor") || ob.includes("dói") || ob.includes("medo") && (ob.includes("implante") || ob.includes("cirurgia") || ob.includes("extração") || ob.includes("agulha") || ob.includes("anestesia")))
      return {
        focus: "Conforto e Tecnologia",
        question: `"João, você prefere focar no desconforto passageiro de alguns minutos ou na dor contínua de não conseguir mastigar o que você gosta por mais um ano?"`,
      };
    // Medo de desgastar os dentes — Facetas / Lentes
    if (ob.includes("desgast") || ob.includes("faceta") || ob.includes("lente") || ob.includes("preparar") || ob.includes("lixar"))
      return {
        focus: "Luxo Artesanal — Irrepetibilidade e Processo Manual",
        question: `"Dona Maria, no meu método, cada faceta é uma escultura artesanal feita à mão. O preparo é milimétrico e respeita a anatomia única do seu rosto — não existe molde de fábrica, não existe padrão genérico. O resultado é irrepetível: nenhum sorriso VEGA é igual ao outro. A senhora prefere um sorriso padronizado que qualquer um pode ter, ou uma obra exclusiva desenhada para devolver a sua melhor versão?"`,
      };
    // Medo de ficar artificial
    if (ob.includes("artificial") || ob.includes("falso") || ob.includes("parecer") || ob.includes("estranho") || ob.includes("exagerad"))
      return {
        focus: "Luxo Artesanal — Personalidade e Exclusividade",
        question: `"Dona Maria, no meu método, o seu sorriso é uma escultura artesanal única. Como cada faceta é trabalhada à mão para respeitar a sua anatomia e a história do seu rosto, o resultado não é um padrão de fábrica — é a sua melhor versão. Nenhum sorriso VEGA é igual ao outro. Você prefere um sorriso que qualquer um possa ter ou um projeto feito exclusivamente para o seu rosto?"`,
      };
    // Medo genérico de dor
    if (ob.includes("dói") || ob.includes("dor") || ob.includes("medo") || ob.includes("agulha") || ob.includes("anestesia"))
      return {
        focus: "Conforto e Tecnologia",
        question: `"Eu entendo perfeitamente o seu receio — e ele é mais comum do que imagina. Mas me permite uma reflexão: o desconforto do procedimento dura minutos, com toda a segurança da tecnologia que usamos aqui. Já o desconforto de conviver com esse problema… esse dura anos. O resultado final vai devolver para você algo que não tem preço: a segurança de sorrir sem pensar duas vezes."`,
      };
    if (ob.includes("pensar") || ob.includes("depois") || ob.includes("calma") || ob.includes("ainda não"))
      return {
        focus: "Segurança e Previsibilidade",
        question: `"Claro, pensar é sábio. Mas me diz uma coisa com sinceridade: o que exatamente você ainda precisa avaliar? Porque o diagnóstico já está feito, a solução já existe, e cada semana que passa é uma semana a mais convivendo com algo que tem conserto. Eu estou aqui justamente para te dar toda a segurança que você precisa para decidir com tranquilidade."`,
      };
    if (ob.includes("caro") || ob.includes("preço") || ob.includes("valor") || ob.includes("custo"))
      return {
        focus: "Segurança e Resultado Estético Final",
        question: `"Eu entendo que o investimento gera reflexão. Mas quero te fazer uma pergunta sincera: quanto está custando para você, hoje, viver com esse incômodo? O custo de não tratar não aparece na conta do banco — mas aparece na sua autoestima, no seu sono, na forma como você se apresenta ao mundo. O procedimento que fazemos aqui é seguro, previsível e o resultado estético é natural."`,
      };
    if (ob.includes("marido") || ob.includes("esposa") || ob.includes("família") || ob.includes("consultar"))
      return {
        focus: "Segurança e Resultado Final",
        question: `"É bonito querer compartilhar decisões com quem a gente ama. Mas essa decisão é sobre a sua saúde — sobre como você se sente, como você dorme, como você sorri. Me permite te mostrar exatamente como vai ficar o resultado final? Quando você visualizar a transformação, vai ter a segurança de saber que essa é a decisão certa."`,
      };
    return {
      focus: "Segurança e Conforto",
      question: `"Eu sei que dar esse passo exige coragem. Mas quero que você saiba: aqui, cada etapa é feita com máxima segurança e previsibilidade. O resultado final vai te devolver algo que você merece — a liberdade de sorrir com confiança. Me permite te mostrar como vai ficar?"`,
    };
  }

  // === PERFIL: FOCADO EM PREÇO → Foco no Custo da Inércia ===
  if (profile === "preco") {
    if (ob.includes("caro") || ob.includes("preço") || ob.includes("valor") || ob.includes("custo") || ob.includes("dinheiro") || ob.includes("investimento"))
      return {
        focus: "Prioridade e Autoestima",
        question: `"Quanto vale para você não ter mais vergonha de sorrir em uma foto ou em uma reunião de negócios? Esse valor é maior ou menor que o investimento no seu tratamento? O custo de não tratar nunca aparece no orçamento — mas ele existe. É o dente vizinho que migra, a mastigação que piora, o tratamento que daqui a um ano custa o dobro."`,
      };
    if (ob.includes("outro") || ob.includes("compara") || ob.includes("concorrente") || ob.includes("dentista") || ob.includes("mais barato"))
      return {
        focus: "Custo da Inércia",
        question: `"Fico feliz que esteja pesquisando — isso mostra responsabilidade. A diferença é que aqui o investimento inclui materiais premium, tecnologia de ponta e acompanhamento completo. O preço mais baixo normalmente cobra depois — em retrabalho, em dor, em frustração. A pergunta real é: você quer economizar hoje e pagar duas vezes, ou investir uma vez e ter resultado para a vida?"`,
      };
    if (ob.includes("parcela") || ob.includes("desconto") || ob.includes("condição") || ob.includes("pagamento"))
      return {
        focus: "Custo da Inércia",
        question: `"Vamos encontrar a melhor condição para você — isso eu resolvo. Mas antes, me responda: se o investimento coubesse confortavelmente no seu orçamento, você decidiria hoje? Porque o que não pode esperar é a sua saúde. Cada mês sem tratar é um mês onde o problema avança — e o custo da inércia sempre é maior do que o custo da ação."`,
      };
    if (ob.includes("pensar") || ob.includes("depois") || ob.includes("calma"))
      return {
        focus: "Custo da Inércia",
        question: `"Pensar é prudente. Mas quero te dar um dado importante: problemas bucais não estacionam — eles progridem. O tratamento que hoje custa X, daqui a seis meses pode custar 2X porque o quadro evoluiu. O senhor prefere resolver agora com conforto, ou esperar e lidar com um problema maior?"`,
      };
    return {
      focus: "Prioridade e Autoestima",
      question: `"O investimento em saúde nunca é gasto — é a decisão mais inteligente que você pode tomar. Quanto vale para você não ter mais vergonha de sorrir? Esse valor é maior ou menor que o investimento no seu tratamento? O custo de não tratar é silencioso: aparece na sua qualidade de vida, na sua confiança, e na conta de um tratamento futuro muito mais complexo."`,
    };
  }

  // === PERFIL: DESEJO ESTÉTICO → Foco na Autoestima e Prioridade Pessoal ===
  if (profile === "estetico") {
    // Medo de ficar artificial
    if (ob.includes("artificial") || ob.includes("falso") || ob.includes("exagerad") || ob.includes("estranho") || ob.includes("parecer"))
      return {
        focus: "Luxo Artesanal — Personalidade e Exclusividade",
        question: `"No meu método, o seu sorriso é uma escultura artesanal única — cada faceta é trabalhada à mão para respeitar a sua anatomia e a personalidade do seu rosto. Nenhum sorriso VEGA é igual ao outro. Não é um produto de fábrica, é a sua melhor versão. Você prefere um sorriso padronizado ou um projeto irrepetível feito exclusivamente para você?"`,
      };
    // Desgaste / Facetas / Lentes
    if (ob.includes("desgast") || ob.includes("faceta") || ob.includes("lente") || ob.includes("lixar"))
      return {
        focus: "Luxo Artesanal — Processo Manual e Preservação",
        question: `"O preparo que faço é uma escultura milimétrica feita à mão — cada movimento respeita a anatomia única dos seus dentes. Não existe molde genérico, não existe padrão de fábrica. O resultado é irrepetível e preserva o que há de melhor na sua estrutura natural. A senhora prefere deixar seus dentes desprotegidos ao desgaste do tempo, ou confiar em um processo artesanal exclusivo que transforma preservando?"`,
      };
    if (ob.includes("marido") || ob.includes("esposa") || ob.includes("família") || ob.includes("consultar") || ob.includes("opinião"))
      return {
        focus: "Autoestima e Prioridade Pessoal",
        question: `"É lindo pensar na família. Mas essa decisão é sobre o seu sorriso, a sua autoestima, a forma como você se sente quando se olha no espelho. Se dependesse só de você — do que você sente, do que você deseja — você já teria decidido? Porque você merece se colocar como prioridade."`,
      };
    if (ob.includes("caro") || ob.includes("preço") || ob.includes("valor"))
      return {
        focus: "Prioridade e Autoestima",
        question: `"Quanto vale para você não ter mais vergonha de sorrir em uma foto ou em uma reunião de negócios? Esse valor é maior ou menor que o investimento no seu tratamento? Esse investimento muda a forma como você se apresenta ao mundo — e você é a sua maior prioridade."`,
      };
    if (ob.includes("pensar") || ob.includes("depois") || ob.includes("calma"))
      return {
        focus: "Autoestima e Prioridade Pessoal",
        question: `"Eu entendo querer refletir. Mas me conta com sinceridade: há quanto tempo você pensa em transformar o seu sorriso? Cada mês que passa é mais um mês que você adia a melhor versão de si mesma. Você merece se olhar no espelho e sentir orgulho — e isso pode começar hoje."`,
      };
    if (ob.includes("medo") || ob.includes("dói") || ob.includes("dor"))
      return {
        focus: "Autoestima e Conforto",
        question: `"O que dói mais — um procedimento seguro que dura minutos, ou continuar evitando sorrir abertamente, escondendo os dentes nas fotos, deixando a autoestima em segundo plano? Você merece se sentir bonita. E eu estou aqui para garantir que o caminho seja confortável."`,
      };
    return {
      focus: "Autoestima e Prioridade Pessoal",
      question: `"O sorriso é a primeira coisa que as pessoas notam em você. Quando você se imagina daqui a 3 meses com o sorriso que sempre sonhou — confiante, radiante, sem esconder nada — isso vale mais do que qualquer hesitação de hoje. Você é a sua prioridade. Me permite te mostrar o caminho?"`,
    };
  }

  return {
    focus: "Autoridade Acolhedora",
    question: `"Me responda com sinceridade: o que precisa acontecer para você tomar essa decisão hoje? Porque eu estou aqui para resolver cada uma das suas dúvidas — e a sua saúde e a sua autoestima não podem esperar."`,
  };
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
      const { question, focus } = generateQuestion(objection, profile);
      setResult({ objection: objection.trim(), profile, question, focus });
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
              placeholder="Ex: 'Tenho medo de dor no implante', 'Vai desgastar meus dentes?', 'Achei caro'..."
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
            {/* Selo de Autoridade VEGA */}
            <div className="bg-accent px-6 py-2.5 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent-foreground" />
              <span className="text-xs font-bold tracking-widest uppercase text-accent-foreground">
                Método VEGA: Excelência Artesanal
              </span>
            </div>

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
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Foco VEGA: {result.focus}
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
