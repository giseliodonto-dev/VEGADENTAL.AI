import { AppLayout } from "@/components/AppLayout";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const respostasNEPQ: Record<string, string> = {
  caro: `**Entendo sua preocupação com o investimento.** Permita-me fazer uma pergunta: quanto você acha que custaria *não* resolver esse problema agora?\n\n**Técnica NEPQ — Inversão de Valor:**\n1. "Compreendo. E se eu te mostrasse que o custo de adiar pode ser 3× maior?"\n2. "Muitos pacientes pensavam o mesmo. Depois perceberam que resolver agora evitou procedimentos mais complexos."\n3. "Posso dividir em parcelas que cabem no seu orçamento. O importante é começar."`,
  
  medo: `**É completamente normal sentir receio.** Vamos trabalhar isso juntos.\n\n**Técnica NEPQ — Empatia + Prova Social:**\n1. "Eu entendo perfeitamente. Sabia que 9 em 10 pacientes dizem que o procedimento foi muito mais tranquilo do que imaginavam?"\n2. "Vou te explicar cada etapa para você se sentir seguro(a)."\n3. "Temos anestesia de última geração. Você vai se surpreender com o conforto."`,
  
  pensar: `**Claro, é uma decisão importante.** Mas posso te fazer uma pergunta?\n\n**Técnica NEPQ — Urgência Sutil:**\n1. "O que exatamente você precisa pensar? Talvez eu possa esclarecer agora."\n2. "Entendo. Só quero que saiba que condições como essa tendem a se agravar com o tempo."\n3. "Que tal reservarmos a data? Caso mude de ideia, é só avisar. Assim você garante a agenda."`,
  
  dor: `**Sinto muito que esteja passando por isso.** Vamos resolver.\n\n**Técnica NEPQ — Conexão Emocional:**\n1. "Imagino como isso afeta seu dia a dia. Comer, sorrir, dormir..."\n2. "A boa notícia é que temos um tratamento que pode resolver isso rapidamente."\n3. "Se começarmos agora, em X dias você já estará sem dor. Como seria isso pra você?"`,
  
  default: `**Boa pergunta!** Aqui vai uma abordagem NEPQ para essa situação:\n\n**Princípios-chave:**\n1. **Nunca pressione** — faça perguntas que levem o paciente à própria conclusão\n2. **Mostre consequências** de não agir (sem ser alarmista)\n3. **Use prova social** — "outros pacientes na mesma situação..."\n4. **Ofereça opções** — "podemos fazer A ou B, qual prefere?"\n5. **Crie urgência sutil** — "as condições atuais permitem esse tratamento, mas com o tempo..."\n\nDescreva com mais detalhes o que o paciente falou para eu dar uma resposta mais personalizada.`,
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("caro") || lower.includes("preço") || lower.includes("valor") || lower.includes("custo") || lower.includes("dinheiro"))
    return respostasNEPQ.caro;
  if (lower.includes("medo") || lower.includes("doi") || lower.includes("anestesia") || lower.includes("receio") || lower.includes("nervoso"))
    return respostasNEPQ.medo;
  if (lower.includes("pensar") || lower.includes("depois") || lower.includes("calma") || lower.includes("ainda não"))
    return respostasNEPQ.pensar;
  if (lower.includes("dor") || lower.includes("doendo") || lower.includes("incomod") || lower.includes("sensib"))
    return respostasNEPQ.dor;
  return respostasNEPQ.default;
}

const IAVendasNEPQ = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá, doutor(a)! 👋 Sou seu assistente de vendas NEPQ. Descreva o que seu paciente falou e eu sugiro a melhor resposta para fechar o tratamento.\n\nExemplos:\n- *\"O paciente disse que está muito caro\"*\n- *\"Ele tem medo de sentir dor\"*\n- *\"Ela quer pensar antes de decidir\"*",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(userMsg.content);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <AppLayout title="IA de Vendas NEPQ">
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
        {/* Header */}
        <div
          className="animate-fade-up flex items-center gap-3 mb-4"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Assistente NEPQ</h3>
            <p className="text-xs text-muted-foreground">
              Neuro-Emotional Persuasion Questions — técnica de vendas consultivas
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto rounded-xl border bg-card shadow-sm p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fade-up`}
              style={{ animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: "forwards" }}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  msg.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed max-w-[80%] ${
                  msg.role === "assistant"
                    ? "bg-muted/50 text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {msg.content.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-1.5" : ""}>
                    {line.split(/(\*\*.*?\*\*|\*.*?\*)/).map((part, k) => {
                      if (part.startsWith("**") && part.endsWith("**"))
                        return <strong key={k}>{part.slice(2, -2)}</strong>;
                      if (part.startsWith("*") && part.endsWith("*"))
                        return <em key={k}>{part.slice(1, -1)}</em>;
                      return part;
                    })}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                Analisando...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <Textarea
            placeholder="Descreva o que o paciente falou..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-[48px] max-h-32 resize-none"
            rows={1}
          />
          <Button onClick={handleSend} size="icon" disabled={!input.trim()} className="shrink-0 h-12 w-12">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default IAVendasNEPQ;
