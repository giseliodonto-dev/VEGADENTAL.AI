

## Plano: Módulo "Inteligência VEGA"

### Análise

O VEGA GPS já implementa alertas básicos (faturamento abaixo da meta, funil estagnado, leads sem contato, agenda vazia). A Inteligência VEGA será uma camada mais profunda que usa IA (Lovable AI via edge function) para analisar todos os dados da clínica e gerar recomendações estratégicas priorizadas, indo além dos thresholds fixos do GPS.

### O que será criado

1. **Edge function `vega-intelligence`** — Coleta dados agregados da clínica (leads, funil, agenda, financeiro, metas) e envia ao Lovable AI Gateway para gerar análise estratégica com recomendações priorizadas em JSON estruturado.

2. **Página `/inteligencia`** (`src/pages/InteligenciaVega.tsx`) — Interface que exibe as recomendações da IA organizadas por prioridade (Alta/Média/Baixa) com ações diretas (links para follow-up, leads, funil, gestão).

3. **Integração com VEGA GPS** — Card de destaque no GPS linkando para a Inteligência VEGA + resumo das recomendações de alta prioridade.

### Estrutura da página

```text
/inteligencia
├── Botão "Gerar Análise" (chama a edge function)
├── Recomendações por prioridade
│   ├── 🔴 Alta (impacto direto no faturamento)
│   ├── 🟡 Média (otimização operacional)
│   └── 🟢 Baixa (melhorias incrementais)
├── Cada recomendação contém:
│   ├── Título claro
│   ├── Explicação em linguagem simples
│   ├── Ação sugerida com botão/link
│   └── Impacto estimado (%)
└── Timestamp da última análise
```

### Edge Function (`supabase/functions/vega-intelligence/index.ts`)

- Recebe `clinic_id` do frontend
- Usa service role key para consultar dados agregados (contagens, valores, datas)
- Monta prompt com contexto real da clínica
- Chama Lovable AI Gateway com tool calling para retornar JSON estruturado
- Retorna array de recomendações: `{ priority, title, description, action_label, action_link, estimated_impact }`

### Arquivos

1. **Criar `supabase/functions/vega-intelligence/index.ts`** — Edge function com lógica de agregação + chamada AI
2. **Criar `src/pages/InteligenciaVega.tsx`** — UI das recomendações
3. **Editar `src/App.tsx`** — Rota `/inteligencia`
4. **Editar `src/components/AppSidebar.tsx`** — Link "Inteligência VEGA" com ícone `Brain`
5. **Editar `src/pages/VegaGPS.tsx`** — Card de destaque com link para `/inteligencia`

### Detalhes Técnicos

- Modelo: `google/gemini-3-flash-preview` (rápido, bom para análise)
- System prompt em português, tom de consultor de negócios
- Tool calling para output estruturado (array de recomendações com campos tipados)
- Análise sob demanda (botão) para não consumir créditos desnecessários
- Dados enviados ao AI são apenas agregados numéricos (contagens, médias), sem dados pessoais de pacientes

