import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquareText, Send, Bot, User, Lightbulb, Target, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const scripts = [
  {
    situation: "Paciente diz que está caro",
    response: "Entendo sua preocupação com o investimento. Vamos pensar juntos: quanto custa para você conviver com esse desconforto por mais 6 meses? O tratamento não é um gasto — é a decisão de parar de perder qualidade de vida.",
  },
  {
    situation: "Paciente quer pensar",
    response: "Claro, é importante pensar bem. Me permite fazer uma pergunta? O que exatamente você precisa avaliar — é o valor, o tempo de tratamento ou outra coisa? Assim posso te ajudar a ter clareza para decidir.",
  },
  {
    situation: "Paciente compara com outro dentista",
    response: "Fico feliz que esteja pesquisando. A diferença está nos materiais que usamos, na tecnologia do consultório e no acompanhamento pós-tratamento. Posso te mostrar exatamente o que está incluso?",
  },
];

const Vendas = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const handleSend = () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);

    const matched = scripts.find((s) =>
      userMsg.toLowerCase().includes("caro") || userMsg.toLowerCase().includes("preço")
        ? s.situation.includes("caro")
        : userMsg.toLowerCase().includes("pensar") || userMsg.toLowerCase().includes("depois")
        ? s.situation.includes("pensar")
        : userMsg.toLowerCase().includes("outro") || userMsg.toLowerCase().includes("compara")
        ? s.situation.includes("compara")
        : false
    );

    const response = matched
      ? matched.response
      : "Baseado na técnica NEPQ, sugiro: faça uma pergunta que conecte o paciente à dor de não resolver o problema. Ex: 'Como seria sua vida daqui 1 ano se esse problema estivesse resolvido?' — isso ativa a motivação interna.";

    setTimeout(() => {
      setChatHistory((prev) => [...prev, { role: "assistant", content: response }]);
    }, 600);
    setMessage("");
  };

  return (
    <AppLayout title="Vendas — IA NEPQ">
      <div className="max-w-4xl space-y-6">
        {/* Scripts rápidos */}
        <div
          className="animate-fade-up grid gap-3 sm:grid-cols-3"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          {scripts.map((s, i) => (
            <Card
              key={i}
              className="p-4 cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
              onClick={() => {
                setChatHistory([
                  { role: "user", content: s.situation },
                  { role: "assistant", content: s.response },
                ]);
              }}
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{s.situation}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Chat */}
        <div
          className="animate-fade-up rounded-xl border bg-card shadow-sm flex flex-col"
          style={{ animationDelay: "80ms", opacity: 0, animationFillMode: "forwards", height: "420px" }}
        >
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <Bot className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">Assistente de Vendas NEPQ</span>
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-4">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground">
                <Target className="h-8 w-8 text-accent/40" />
                <p className="text-sm">Descreva o que o paciente disse e receba a melhor resposta para fechar o tratamento.</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t p-4 flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: O paciente disse que vai pensar..."
              className="min-h-[44px] max-h-[88px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} size="icon" className="shrink-0 self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Vendas;
