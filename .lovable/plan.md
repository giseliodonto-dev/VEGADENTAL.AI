## Insight Premium com Claude na página /inteligencia

Adicionar um novo bloco "Insight de Gestão Premium" no topo da página `InteligenciaVega.tsx` que coleta os KPIs vivos da clínica (mesmos do VegaGPS) e envia para a Edge Function `claude-ai-service` para gerar 3 ações prioritárias da semana.

### 1. Nova Edge Function helper — reaproveitar `claude-ai-service`

Nenhuma alteração na função. Ela já aceita `messages: [{role, content}]` e usa o system prompt do Vega. Vamos enviar a pergunta como mensagem do usuário (com os dados embutidos), mantendo o contrato atual.

### 2. Novo componente `src/components/InsightPremium.tsx`

Responsável por:

- Receber props: `revenue`, `expenses`, `profit`, `conversionRate`, `stagnantFunnelCount`, `clinicaName` (opcional, "Dra. Giseli" como default).
- Botão "Gerar Insight Premium" (estilo Azul Petróleo + dourado, ícone `Sparkles`).
- Ao clicar, monta o prompt:
  > "Com base nestes dados da clínica (Faturamento: R$ X, Lucro: R$ Y, Conversão: Z%, Pacientes parados no funil: N), quais são as 3 ações prioritárias para a Dra. Giseli aumentar a lucratividade esta semana? Responda em português, formato lista numerada, tom premium e direto."
- Chama `supabase.functions.invoke("claude-ai-service", { body: { messages: [{ role: "user", content: prompt }] } })`.
- Estados: `loading`, `error`, `insight` (string markdown), `generatedAt`.
- Loading: skeleton com `Loader2` + texto "Vega está analisando seus números…".
- Erro: banner com botão "Tentar novamente".
- Resposta: renderizada com `react-markdown` (já usado em `MentoraClaude`), dentro de um Card com:
  - borda `border-autoridade/30`, fundo sutil com gradiente Azul Petróleo → transparente
  - tipografia: título `font-display` em dourado (`text-gold` ou `text-autoridade`), corpo em `prose prose-sm` com leading relaxado e itálico nos destaques
  - rodapé pequeno: "Gerado em {hh:mm} • Inteligência Vega · Claude 3.5".
  - quais são as **3 ações prioritárias** para a Dra. Giseli aumentar a **lucratividade** esta semana? **Priorize ações que melhorem a margem de contribuição e o ticket médio, não apenas o volume de vendas**. **Considere que o lucro é a prioridade sobre o faturamento.**"

### 3. Integração em `src/pages/InteligenciaVega.tsx`

- Adicionar queries (mesmo padrão do `VegaGPS.tsx`) para buscar do mês atual:
  - `revenue`: financials `entrada` `pago`
  - `expenses`: financials `saida` `pago`
  - `funnelData` → derivar `conversionRate` e `stagnantFunnel.length` (>7 dias)
- Renderizar `<InsightPremium>` logo abaixo do header e acima do botão "Gerar Análise" existente.
- Manter intacto o fluxo da `vega-intelligence` já existente.

### 4. Estilo "Quiet Luxury"

- Card com `rounded-xl`, `shadow-sm`, padding generoso (`p-6`), sem cores berrantes.
- Heading: `font-display text-lg tracking-tight text-autoridade`.
- Lista numerada destacada com numerais dourados grandes (`text-gold/60 font-display text-2xl`).
- Botão CTA: `bg-primary text-gold hover:bg-primary/90` com ícone `Sparkles` (mantém padrão dos botões premium do projeto).

### Detalhes técnicos

- Reaproveita `react-markdown` (já no projeto via `MentoraClaude.tsx`).
- Sem mudanças no banco nem na Edge Function.
- Sem persistência: o insight é gerado sob demanda (pode ser regenerado quantas vezes o usuário quiser).
- Tratamento de erro idêntico ao padrão do `MentoraClaude` (toast `sonner` + retry).

### Arquivos

- **Novo:** `src/components/InsightPremium.tsx`
- **Editado:** `src/pages/InteligenciaVega.tsx` (queries de KPI + render do componente)