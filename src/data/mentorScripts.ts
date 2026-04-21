export type MentorCategory = "vendas" | "gestao" | "posicionamento" | "melhoria";

export type MentorScript = {
  id: string;
  category: MentorCategory;
  subcategory: string;
  title: string;
  why: string;
  body: string;
  tags: string[];
};

export const CATEGORY_LABELS: Record<MentorCategory, string> = {
  vendas: "Vendas",
  gestao: "Gestão & Liderança",
  posicionamento: "Posicionamento & Luxo",
  melhoria: "Estratégias de Melhoria",
};

export const mentorScripts: MentorScript[] = [
  // ========== VENDAS ==========
  {
    id: "v-prospect-01",
    category: "vendas",
    subcategory: "Prospecção",
    title: "Primeiro contato — paciente que demonstrou interesse",
    why: "Abre com escuta antes de oferecer. Princípio NEPQ: gerar consciência do problema antes de apresentar solução, reduzindo resistência inicial.",
    body: "Olá, {{nome}}. Aqui é da {{clinica}}. Vi que você demonstrou interesse em {{procedimento}}. Antes de te enviar qualquer informação, posso te fazer duas perguntas rápidas para entender exatamente o que você procura? Assim consigo te orientar de forma certeira, sem te tomar tempo com o que não faz sentido pra você.",
    tags: ["prospecção", "primeiro contato", "abertura", "lead novo"],
  },
  {
    id: "v-reativacao-01",
    category: "vendas",
    subcategory: "Reativação",
    title: "Reativação de paciente inativo (6+ meses)",
    why: "Reposiciona o contato como cuidado, não venda. Cria gatilho de reciprocidade sem pressão comercial.",
    body: "{{nome}}, faz um tempo que não nos vemos por aqui e lembrei de você. Como está sua saúde bucal? Se quiser, reservo um horário só para uma avaliação tranquila — sem compromisso de tratamento. Só para garantir que está tudo bem.",
    tags: ["reativação", "inativo", "retorno", "follow-up"],
  },
  {
    id: "v-objecao-preco-01",
    category: "vendas",
    subcategory: "Quebra de Objeção: Preço",
    title: "Quando o paciente diz 'está caro'",
    why: "Não defende o preço — investiga o que está por trás. 'Caro' raramente é sobre dinheiro: é sobre percepção de valor ou medo de errar.",
    body: "Entendo, {{nome}}. Quando você diz que está caro, é caro em relação a quê especificamente? Pergunto porque às vezes é uma comparação com outro orçamento, às vezes é o investimento no momento, e às vezes é só não estar 100% claro o que está incluído. Me ajuda a entender para eu te dar a resposta certa.",
    tags: ["objeção", "preço", "caro", "valor", "negociação"],
  },
  {
    id: "v-objecao-preco-02",
    category: "vendas",
    subcategory: "Quebra de Objeção: Preço",
    title: "Reposicionar valor após 'achei caro'",
    why: "Substitui a discussão de preço pela discussão de custo de não tratar. Ancora no problema, não na solução.",
    body: "{{nome}}, te entendo. Posso te perguntar uma coisa? Se você não fizer {{procedimento}} agora, o que tende a acontecer nos próximos 12 meses? Faço essa pergunta porque o tratamento custa {{valor}}, mas o problema sem tratar costuma custar bem mais — em retrabalho, em desconforto e em tempo. Quero te ajudar a tomar a melhor decisão, não só fechar uma venda.",
    tags: ["objeção", "preço", "valor", "ancoragem", "custo de não tratar"],
  },
  {
    id: "v-objecao-tempo-01",
    category: "vendas",
    subcategory: "Quebra de Objeção: Tempo",
    title: "Quando o paciente diz 'não tenho tempo agora'",
    why: "Valida a objeção e converte tempo em prioridade. A pergunta força reflexão sem pressão.",
    body: "Faz total sentido, {{nome}}. Posso te perguntar: o que precisaria mudar na sua agenda nas próximas 4 semanas para esse cuidado caber? Se não houver nenhuma janela possível, eu prefiro ser honesto e dizer agora — assim a gente combina de retomar quando for o momento certo, sem você ficar com a sensação de algo pendente.",
    tags: ["objeção", "tempo", "agenda", "prioridade"],
  },
  {
    id: "v-objecao-conjuge-01",
    category: "vendas",
    subcategory: "Quebra de Objeção: Decisão Compartilhada",
    title: "Quando precisa 'falar com o marido/esposa'",
    why: "Não força fechamento — equipa o paciente para conduzir a conversa em casa. Aumenta chance de retorno positivo.",
    body: "Claro, {{nome}}. Decisão de saúde a dois é assim mesmo. Posso te enviar um resumo curto, em texto, com os pontos que você pode levar para a conversa? Assim você apresenta com clareza e a gente combina de retomar em até 48h. Pode ser?",
    tags: ["objeção", "cônjuge", "decisão", "marido", "esposa"],
  },
  {
    id: "v-objecao-pensar-01",
    category: "vendas",
    subcategory: "Quebra de Objeção: Indecisão",
    title: "Quando o paciente diz 'vou pensar'",
    why: "Identifica a verdadeira hesitação. 'Vou pensar' é quase sempre uma dúvida não-verbalizada — descobrir qual é vale mais que insistir.",
    body: "Sem problema, {{nome}}. Só para eu te ajudar melhor: tem algum ponto específico que ficou em aberto — valor, prazo, etapa do tratamento — ou é mais uma questão de absorver tudo com calma? Se for o segundo, te dou espaço. Se for o primeiro, prefiro esclarecer agora.",
    tags: ["objeção", "vou pensar", "indecisão", "hesitação"],
  },
  {
    id: "v-fechamento-01",
    category: "vendas",
    subcategory: "Fechamento Alto Ticket",
    title: "Fechamento consultivo — alto ticket",
    why: "Pergunta de comprometimento. Move da conversa para a ação sem pressão, dando ao paciente o controle da decisão.",
    body: "{{nome}}, com base no que conversamos, {{procedimento}} é o caminho que vai te dar o resultado que você quer. Se eu reservar agora um horário pra começarmos na próxima semana, isso funciona pra você? Se preferir começar mais para frente, também combinamos — só quero garantir que sua vaga fique guardada.",
    tags: ["fechamento", "alto ticket", "compromisso", "agendamento"],
  },
  {
    id: "v-resgate-orc-3d",
    category: "vendas",
    subcategory: "Resgate de Orçamento",
    title: "Follow-up 3 dias após orçamento",
    why: "Janela ideal de top of mind. Não cobra resposta — oferece ajuda para tirar dúvidas residuais.",
    body: "{{nome}}, passando aqui rapidamente. Te enviei o plano de {{procedimento}} há alguns dias e queria saber: surgiu alguma dúvida ao ler com calma? Estou à disposição para esclarecer qualquer ponto, sem compromisso.",
    tags: ["follow-up", "orçamento", "3 dias", "resgate"],
  },
  {
    id: "v-resgate-orc-7d",
    category: "vendas",
    subcategory: "Resgate de Orçamento",
    title: "Follow-up 7 dias — reforço de valor",
    why: "Reforça o porquê do tratamento, não o orçamento. Mantém a conversa viva sem parecer cobrança.",
    body: "Oi, {{nome}}. Estava revendo seu caso e queria reforçar uma coisa: o que vimos em consulta não é urgência médica, mas é uma janela boa para resolver de forma simples. Se deixar passar, costuma ficar mais complexo. Quer que eu separe um horário para conversarmos de novo, sem compromisso?",
    tags: ["follow-up", "orçamento", "7 dias", "resgate", "reforço"],
  },
  {
    id: "v-resgate-orc-14d",
    category: "vendas",
    subcategory: "Resgate de Orçamento",
    title: "Follow-up 14 dias — fechamento gentil",
    why: "Última tentativa elegante. Dá saída honrosa para o paciente sem queimar a relação.",
    body: "{{nome}}, vou ser direto e respeitoso: notei que o plano que te enviei ficou em aberto. Tudo bem se não for o momento — só me avisa para eu não te incomodar, e quando fizer sentido você me procura. Aqui sua avaliação fica registrada e a gente retoma de onde parou.",
    tags: ["follow-up", "orçamento", "14 dias", "encerramento"],
  },

  // ========== GESTÃO ==========
  {
    id: "g-meta-secretaria-01",
    category: "gestao",
    subcategory: "Alinhamento de Equipe",
    title: "Alinhamento semanal de meta com a recepção",
    why: "Trata a meta como acordo, não imposição. Cria co-responsabilidade e abre espaço para a recepção sinalizar bloqueios cedo.",
    body: "{{nome}}, vamos alinhar a semana. Nossa meta é {{valor}} em fechamentos. Olhando a agenda atual, o que você enxerga como nosso maior gargalo: número de avaliações, taxa de comparecimento ou conversão pós-orçamento? Quero ouvir você antes de eu definir as ações.",
    tags: ["meta", "secretária", "recepção", "alinhamento", "equipe"],
  },
  {
    id: "g-feedback-01",
    category: "gestao",
    subcategory: "Feedback",
    title: "Feedback construtivo — situação específica",
    why: "Modelo SBI (Situação-Comportamento-Impacto). Foca em fato, não em personalidade. Reduz defensividade.",
    body: "{{nome}}, queria conversar sobre {{procedimento}} (situação específica). O que aconteceu foi [comportamento observado]. O impacto disso para a clínica/paciente foi [impacto]. Quero entender sua percepção e combinarmos como a gente ajusta daqui para frente. Pode ser agora ou prefere marcar 15 minutos hoje à tarde?",
    tags: ["feedback", "equipe", "construtivo", "SBI", "conversa difícil"],
  },
  {
    id: "g-cobranca-01",
    category: "gestao",
    subcategory: "Cobrança Elegante",
    title: "Primeira cobrança de inadimplente — tom premium",
    why: "Trata o paciente como adulto responsável. Cobrança sem culpa preserva relacionamento e LTV.",
    body: "Olá, {{nome}}. Aqui é da {{clinica}}. Estou passando para te avisar que a parcela de {{valor}} referente ao seu tratamento ficou em aberto. Imagino que pode ter sido só um esquecimento — me avisa como você prefere acertar e a gente resolve de forma simples. Fico no aguardo.",
    tags: ["cobrança", "inadimplente", "financeiro", "elegante"],
  },
  {
    id: "g-comunicado-01",
    category: "gestao",
    subcategory: "Comunicado Interno",
    title: "Comunicado de mudança operacional",
    why: "Estrutura clara: o que muda, por quê, quando, o que esperam de você. Reduz ruído e ansiedade.",
    body: "Equipe, a partir de {{data}} vamos mudar [o quê]. O motivo é [por quê — sempre conectar a paciente ou clínica]. Na prática, isso significa que cada um precisa [ação esperada]. Vou estar disponível na quinta às 8h para tirar dúvidas. Conto com vocês.",
    tags: ["comunicado", "interno", "mudança", "equipe"],
  },

  // ========== POSICIONAMENTO ==========
  {
    id: "p-vip-01",
    category: "posicionamento",
    subcategory: "Recepção VIP",
    title: "Boas-vindas para paciente novo de alto valor",
    why: "Primeiro contato define a percepção de toda a jornada. Tom calmo e personalizado sinaliza categoria sem precisar dizer 'somos premium'.",
    body: "Olá, {{nome}}. Sua avaliação está confirmada para {{data}}. Aqui na {{clinica}} a gente reserva o horário inteiro para você — sem espera, sem encaixe. Quando chegar, é só pedir por mim na recepção. Se precisar remarcar, me avise direto por aqui que resolvo na hora.",
    tags: ["VIP", "boas-vindas", "premium", "recepção", "alto valor"],
  },
  {
    id: "p-diferencial-01",
    category: "posicionamento",
    subcategory: "Diferenciais",
    title: "Explicar diferenciais sem soar arrogante",
    why: "Diferencial precisa ser sentido, não anunciado. Conectar característica → benefício direto para o paciente.",
    body: "{{nome}}, antes de você decidir, queria que você soubesse três coisas sobre como trabalhamos: 1) cada paciente tem horário exclusivo, sem sala de espera lotada; 2) o planejamento é feito pelo dentista, não por um vendedor; 3) você sai daqui com plano por escrito, sem surpresa. Se isso faz sentido para você, seguimos.",
    tags: ["diferencial", "valor", "premium", "posicionamento"],
  },
  {
    id: "p-justificativa-01",
    category: "posicionamento",
    subcategory: "Justificativa de Valor Premium",
    title: "Por que nosso investimento é diferente",
    why: "Trabalha o conceito de 'caro relativo' — ancora em consequências de longo prazo, não em comparação direta com concorrentes.",
    body: "{{nome}}, te explico de forma honesta: trabalhamos com {{procedimento}} em padrão que prioriza durabilidade e previsibilidade. Isso custa mais no curto prazo e custa menos no longo prazo, porque retrabalho é raro. Não é o caminho mais barato — é o caminho com menos surpresa. Se isso é o que você procura, faz sentido seguir.",
    tags: ["justificativa", "premium", "valor", "investimento"],
  },

  // ========== MELHORIA ==========
  {
    id: "m-depoimento-01",
    category: "melhoria",
    subcategory: "Social Proof",
    title: "Pedido de depoimento pós-tratamento",
    why: "Pedido feito no pico de satisfação (logo após resultado). Facilita ao máximo: dá estrutura para o paciente não precisar pensar.",
    body: "{{nome}}, ver seu sorriso pronto foi muito gratificante. Posso te pedir um favor? Se você gravar um vídeo curto de 30 segundos contando como foi sua experiência aqui — o que te fez escolher, como foi o atendimento, e o resultado — isso ajuda outras pessoas a tomar a decisão com mais segurança. Sem pressa, quando puder.",
    tags: ["depoimento", "social proof", "vídeo", "review"],
  },
  {
    id: "m-indicacao-01",
    category: "melhoria",
    subcategory: "Indicação Ativa",
    title: "Pedido de indicação direta",
    why: "Indicação direta pessoal converte 5x mais que campanha. O segredo é pedir nomes, não pedir 'se conhecer alguém'.",
    body: "{{nome}}, fico feliz que tenha gostado do resultado. Posso te fazer um pedido? Pensa em duas pessoas próximas a você que talvez precisem de um cuidado parecido. Se você me passar o nome delas, eu mesmo entro em contato com cuidado, mencionando que foi você quem indicou. Quem te vem à cabeça?",
    tags: ["indicação", "referral", "LTV", "boca a boca"],
  },
  {
    id: "m-aniversario-01",
    category: "melhoria",
    subcategory: "Fidelização",
    title: "Mensagem de aniversário sem ser comercial",
    why: "Aniversário é território emocional. Vender no aniversário queima relação. Apenas estar presente é o que fideliza.",
    body: "{{nome}}, feliz aniversário. Que esse novo ciclo venha com mais saúde, mais leveza e bons motivos pra sorrir. Aqui da {{clinica}}, com carinho.",
    tags: ["aniversário", "fidelização", "LTV", "relacionamento"],
  },
  {
    id: "m-pos-tratamento-01",
    category: "melhoria",
    subcategory: "Follow-up Pós-Tratamento",
    title: "Acompanhamento 7 dias após procedimento",
    why: "Demonstra cuidado real além da venda. Reduz reclamação no Google e aumenta sensação de pertencimento.",
    body: "{{nome}}, passou uma semana desde {{procedimento}}. Como está se sentindo? Algum incômodo, dúvida ou ajuste que você queira me contar? Se estiver tudo bem, ótimo. Se não, prefiro saber agora para te atender rápido.",
    tags: ["pós-tratamento", "follow-up", "cuidado", "qualidade"],
  },
];
