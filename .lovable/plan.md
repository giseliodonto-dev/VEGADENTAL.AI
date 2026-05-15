## Plano: Redeploy do claude-ai-service

### 1. Verificar a secret
- Confirmar `ANTHROPIC_API_KEY` via `secrets--fetch_secrets` antes do redeploy.

### 2. Ajustar a Edge Function (`supabase/functions/claude-ai-service/index.ts`)
A função hoje usa o SDK `npm:@anthropic-ai/sdk`, que internamente já chama `https://api.anthropic.com/v1/messages`, mas você pediu garantia explícita do endpoint. Vou:
- Substituir o SDK por `fetch` direto para `https://api.anthropic.com/v1/messages` (endpoint visível e auditável no código).
- Manter `Deno.env.get("ANTHROPIC_API_KEY")` com checagem e log claro caso ausente.
- Manter headers obrigatórios: `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`.
- Manter `model: claude-3-5-sonnet-latest`, `max_tokens: 1024`, `system` prompt e `messages` validados.
- Preservar CORS, validação de input e mapeamento de erros (401/403 → 502, 429 → 429).
- Resposta continua `{ reply: string }` para não quebrar `MentoraClaude.tsx` nem `InsightPremium.tsx`.

### 3. Redeploy
- Rodar `supabase--deploy_edge_functions` com `["claude-ai-service"]`.
- Validar com `supabase--curl_edge_functions` (POST `/claude-ai-service` com `{ messages: [{role:"user", content:"ping"}] }`) esperando `200` + `reply`.
- Conferir `supabase--edge_function_logs` para garantir ausência de "ANTHROPIC_API_KEY ausente".

### 4. Limpar cache do frontend
- `MentoraClaude.tsx` e `InsightPremium.tsx` usam `supabase.functions.invoke`, que não tem cache de browser, mas a UI mantém estado em memória. Vou:
  - Em `InsightPremium.tsx`: ao clicar em "Gerar novamente", já reseta `insight`, `error`, `generatedAt` — adicionar `setInsight(null)` no início de `generate()` para forçar nova chamada e descartar resposta anterior.
  - Em `MentoraClaude.tsx`: nenhum cache real; sem mudança necessária.
- Não há service worker / React Query cache cobrindo essas chamadas, então não precisa `queryClient.invalidateQueries`.

### Detalhes técnicos
- Endpoint final: `POST https://api.anthropic.com/v1/messages`
- Body: `{ model, max_tokens, system, messages }`
- Resposta Anthropic: `content: [{type:"text", text:"..."}]` → concatenar `text` dos blocos `type==="text"`.
- Sem mudanças em `supabase/config.toml` (função já com `verify_jwt` padrão para Lovable).
- Sem mudanças em schema, RLS ou outras funções.

### Arquivos afetados
- `supabase/functions/claude-ai-service/index.ts` (reescrito para fetch direto)
- `src/components/InsightPremium.tsx` (reset de estado ao regenerar)
