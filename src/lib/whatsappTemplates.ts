/**
 * Biblioteca de mensagens WhatsApp prontas para a clínica.
 * Variáveis no formato {nome}, {data}, {hora}, {clinica}, {valor}, {procedimento}.
 */

export type WaTemplate = {
  id: string;
  label: string;
  category: "confirmacao" | "lembrete" | "cobranca" | "reativacao" | "pos_consulta" | "lead";
  body: string;
};

export const WA_TEMPLATES: WaTemplate[] = [
  {
    id: "confirm_24h",
    label: "Confirmação 24h antes",
    category: "confirmacao",
    body: "Olá {nome}! Aqui é da {clinica} 🦷\n\nLembrete da sua consulta amanhã, {data} às {hora}.\n\nPode confirmar sua presença respondendo SIM? 😊",
  },
  {
    id: "confirm_today",
    label: "Confirmação no mesmo dia",
    category: "confirmacao",
    body: "Bom dia, {nome}! Tudo bem?\n\nSó passando pra confirmar sua consulta hoje às {hora} aqui na {clinica}. Te esperamos! ✨",
  },
  {
    id: "lembrete_retorno",
    label: "Lembrete de retorno / manutenção",
    category: "lembrete",
    body: "Oi {nome}! Faz um tempinho desde sua última consulta na {clinica} 😊\n\nQue tal agendar uma avaliação de rotina? É super importante pra manter sua saúde bucal em dia.\n\nMe responde aqui que já te encaixo! 🦷",
  },
  {
    id: "cobranca_amigavel",
    label: "Cobrança amigável",
    category: "cobranca",
    body: "Olá {nome}, tudo bem?\n\nIdentificamos que ficou pendente o valor de {valor} referente a {procedimento}.\n\nPode me confirmar a melhor forma pra acertar? Pix, cartão ou boleto — o que for melhor pra você 💙",
  },
  {
    id: "reativacao",
    label: "Reativação de paciente inativo",
    category: "reativacao",
    body: "Oi {nome}! Sentimos sua falta aqui na {clinica} 💙\n\nTemos novidades pra te mostrar e gostaríamos de cuidar do seu sorriso novamente.\n\nQuer agendar uma avaliação sem compromisso?",
  },
  {
    id: "pos_consulta",
    label: "Pós-consulta (cuidados)",
    category: "pos_consulta",
    body: "Oi {nome}! Tudo certo após o procedimento? 🦷\n\nLembretes importantes:\n• Evite alimentos muito quentes nas próximas horas\n• Em caso de qualquer dúvida ou desconforto, me chama aqui\n\nObrigado pela confiança! ✨",
  },
  {
    id: "lead_primeiro_contato",
    label: "Lead — primeiro contato",
    category: "lead",
    body: "Olá {nome}! 😊\n\nAqui é da {clinica}. Vi seu interesse e vim te dar boas-vindas!\n\nMe conta rapidinho: o que te motivou a buscar a gente? Assim consigo te orientar melhor.",
  },
  {
    id: "lead_followup",
    label: "Lead — follow-up",
    category: "lead",
    body: "Oi {nome}, tudo bem?\n\nPassando pra saber se você ainda tem interesse em conversar sobre seu tratamento aqui na {clinica}.\n\nPosso te encaixar uma avaliação esta semana? 🗓️",
  },
];

export function renderTemplate(body: string, vars: Record<string, string | number | undefined>): string {
  return body.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? `{${k}}` : String(v);
  });
}

export const TEMPLATE_CATEGORIES: { id: WaTemplate["category"]; label: string }[] = [
  { id: "confirmacao", label: "Confirmação" },
  { id: "lembrete", label: "Lembrete / Retorno" },
  { id: "cobranca", label: "Cobrança" },
  { id: "reativacao", label: "Reativação" },
  { id: "pos_consulta", label: "Pós-consulta" },
  { id: "lead", label: "Leads" },
];
