## Refinamento do Insight Premium — foco em margem + numerais dourados

A integração base já está em produção (`src/components/InsightPremium.tsx` + queries em `src/pages/InteligenciaVega.tsx`). Esta etapa **refina o prompt** e o **render visual** para entregar a estética Quiet Luxury exigida.

### 1. Prompt — foco total em margem + reativação

Reescrever `buildPrompt()` em `InsightPremium.tsx` para:

- Reforçar **lucratividade real** (não faturamento bruto): margem de contribuição, mix de procedimentos de alto markup (2,38× a 3,30×), aumento de ticket médio.
- Tratar **pacientes parados no funil há +7 dias** como ativo recuperável, não como métrica passiva.
- Pedir resposta **estritamente em 3 itens numerados** `1.` `2.` `3.`, com formato fixo:
  - Linha 1: título curto em negrito.
  - Linha 2-3: justificativa estratégica (por que isso protege margem).
  - Linha final: `Impacto: …` (estimativa numérica ou faixa quando possível).
- System prompt da Edge Function permanece o mesmo ("inteligência central do Vega Dental…"); o foco vem no `user message`.

Texto final do prompt:

> "Atue como consultor sênior de gestão odontológica premium. Dados da clínica este mês — Faturamento: R$ X · Despesas: R$ Y · Lucro: R$ Z · Conversão do funil: W% · Pacientes parados no funil há +7 dias: N. Entregue **as 3 ações prioritárias para a Dra. Giseli aumentar a LUCRATIVIDADE esta semana**, com foco absoluto em (a) margem de contribuição e ticket médio e (b) reativação dos N pacientes parados no funil. Não sugira ações de volume puro nem investimento em mídia paga. Responda em português, em exatamente 3 itens numerados (1. 2. 3.). Cada item deve ter: **título curto em negrito**, 1-2 frases de justificativa estratégica e uma linha final começando com `Impacto:` com estimativa numérica."

### 2. Parser + render com numerais dourados

Substituir o bloco atual (`<p whitespace-pre-wrap>`) por um parser leve que divide a resposta em itens `1.` `2.` `3.` e renderiza cada um como uma linha do tipo:

```text
┌────────────────────────────────────────────┐
│  01   Título da ação em negrito            │
│       Justificativa em corpo serif claro.  │
│       Impacto: +15% margem.                │
└────────────────────────────────────────────┘
```

Detalhes:

- Numeral grande à esquerda: `font-display text-4xl text-gold/70 leading-none tabular-nums`, formatado como `01`, `02`, `03`.
- Texto do item em `text-sm leading-relaxed text-foreground` com `**negrito**` simples (regex `**…**` → `<strong className="text-autoridade">`).
- Linha `Impacto:` destacada em itálico, `text-xs text-gold/80 mt-2 block`.
- Separador sutil entre itens: `divide-y divide-border/40` no container.
- Container externo mantém `rounded-xl border border-gold/20 bg-background/60 p-6`.

Parsing simples no client (sem dependência nova):

```ts
const items = insight
  .split(/\n(?=\s*\d+\.\s)/)        // quebra antes de "1." "2." "3."
  .map((s) => s.replace(/^\s*\d+\.\s*/, "").trim())
  .filter(Boolean)
  .slice(0, 3);
```

Para cada item, separar título (primeira linha entre `**…**` ou primeira frase até `.`) do corpo, e isolar a linha que começa com `Impacto:`.

### 3. Estilo Quiet Luxury — ajustes finais

- Card já usa `border-autoridade/30` e gradiente sutil → manter.
- Header: trocar ícone `Crown` por par `Sparkles + Crown` lado a lado é exagero; manter só `Crown` em dourado (`text-gold` em vez de `text-autoridade`) para reforçar identidade.
- Botão CTA: já em `bg-primary text-gold` — sem mudança.
- Tipografia do corpo das ações: usar `font-body` com `tracking-[0.005em] leading-[1.7]`.
- Rodapé "Gerado em …" mantém estilo discreto atual.

### 4. Sem mudanças em backend / dados

- Edge Function `claude-ai-service`: nenhuma alteração.
- Queries em `InteligenciaVega.tsx`: nenhuma alteração (já trazem `revenue`, `expenses`, `conversionRate`, `stagnantFunnelCount`).
- Sem nova dependência (sem `react-markdown`).

### Arquivos

- **Editado:** `src/components/InsightPremium.tsx` (prompt + parser + render com numerais dourados)