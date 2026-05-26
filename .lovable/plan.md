## Diagnóstico

A Edge Function `send-whatsapp-twilio` falha ao iniciar por causa desta linha:

```ts
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
```

Esse subpath `/cors` **não existe** no pacote `@supabase/supabase-js`. Resultado: o Deno não consegue resolver o módulo, a função nem chega a executar, e por isso:
- O `supabase.functions.invoke` retorna erro genérico (não-2xx).
- Não aparece nada nos logs da função (não houve execução).
- O toast mostra mensagem vazia ou "Edge Function returned a non-2xx status code".

Todas as outras Edge Functions do projeto (`mentor-ai`, `claude-ai-service`, `content-suggestions`, `vega-intelligence`) declaram `corsHeaders` **localmente** — esse é o padrão estável e é o que vamos aplicar aqui.

## Correção (1 arquivo)

**`supabase/functions/send-whatsapp-twilio/index.ts`**

1. Remover o import quebrado:
   ```ts
   import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
   ```
2. Declarar `corsHeaders` localmente no topo do arquivo (mesmo padrão de `mentor-ai`):
   ```ts
   const corsHeaders = {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
   };
   ```
3. Adicionar 2 `console.log` defensivos para deixar rastro nos logs:
   - Antes do POST ao Twilio: `console.log("twilio:request", { to: toE164, from: fromClean });`
   - No retorno OK: `console.log("twilio:ok", { sid: twilioJson?.sid, status: twilioJson?.status });`

Nada mais muda — JWT, leitura dos 3 secrets, normalização E.164, `MediaUrl`, tratamento de erro Twilio e shape da resposta continuam idênticos.

## Validação após o deploy

1. Refazer o teste de envio na tela do paciente.
2. Se ainda der erro, vou ler `edge_function_logs` de `send-whatsapp-twilio` — agora os logs vão existir e mostrar a resposta crua do Twilio (códigos `63007` número fora do sandbox, `21211` telefone inválido, `20003` credenciais erradas, etc.).

## O que NÃO está em escopo

- Não vou mexer no frontend (`DocumentActions.tsx`, `twilioWhatsapp.ts`) — eles estão corretos.
- Não vou alterar os secrets já cadastrados.
- Não vou alterar políticas do bucket `whatsapp-documents` (ele já é público, então `MediaUrl` é acessível pelo Twilio).
