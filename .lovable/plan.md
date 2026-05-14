## Integração Claude AI (Anthropic) no Vega Dental

### Visão geral
Criar uma Edge Function `claude-ai-service` que conversa com a API da Anthropic usando o modelo `claude-3-5-sonnet-latest`, e uma página `/mentora-claude` (ou aba na MentoraVega existente) com interface de chat para testar a IA.

### Backend — Edge Function

**Arquivo:** `supabase/functions/claude-ai-service/index.ts`

- Importa o SDK oficial via `npm:@anthropic-ai/sdk@latest`.
- CORS habilitado (`npm:@supabase/supabase-js@2/cors`) com tratamento de OPTIONS.
- Validação de input com Zod:
  - `messages`: array `{ role: "user" | "assistant", content: string }` (mínimo 1).
- Lê `ANTHROPIC_API_KEY` de `Deno.env`.
- Chama `anthropic.messages.create`:
  - `model: "claude-3-5-sonnet-latest"`
  - `max_tokens: 1024`
  - `system: "Você é a inteligência central do Vega Dental, uma assistente de gestão odontológica de luxo, técnica, empática e eficiente."`
  - `messages` recebidos do cliente.
- Retorna `{ reply: string }` em JSON.
- Tratamento de erros:
  - `401/403` da Anthropic → 502 com mensagem "Falha de autenticação com Claude".
  - `429` → 429 "Limite de requisições atingido, tente novamente em instantes".
  - Genérico → 500 "Erro interno ao consultar a IA".
- Logs com `console.error` para diagnóstico via `edge_function_logs`.

**Config:** sem alterações em `supabase/config.toml` (deploy padrão com `verify_jwt = false` é suficiente para o teste; a função apenas repassa mensagens).

### Frontend — Página de chat

**Arquivo novo:** `src/pages/MentoraClaude.tsx`  
**Rota:** `/mentora-claude` adicionada em `src/App.tsx` (protegida por `ProtectedRoute`).

Componentes e UX:
- Layout dentro de `<AppLayout>` com header "Mentora Vega — Claude AI" e ícone `Sparkles`.
- Lista de mensagens com bolhas estilizadas (usuário em Azul Petróleo, IA em fundo claro com borda dourada sutil).
- Render de markdown com `react-markdown` (já no padrão do projeto se disponível; senão texto puro com `whitespace-pre-wrap`).
- Input multilinha (`Textarea`) + botão "Enviar" (variant `default` em Azul Petróleo).
- Estado local: `messages`, `input`, `isLoading`, `error`.
- Ao enviar:
  1. Acrescenta mensagem do usuário no estado.
  2. Chama `supabase.functions.invoke("claude-ai-service", { body: { messages } })` enviando histórico completo.
  3. Mostra spinner (`Loader2` animado) e desabilita o input enquanto `isLoading`.
  4. Em sucesso, adiciona resposta da IA.
  5. Em erro, mostra `toast.error()` e banner inline em vermelho com botão "Tentar novamente".
- Auto-scroll para o final a cada nova mensagem.

### Feedback visual
- Botão "Enviar" troca para `<Loader2 className="animate-spin" />` durante a chamada.
- Skeleton de bolha "Vega está pensando…" enquanto aguarda resposta.
- Toast (`sonner`) para sucesso/erro de conexão.

### Acesso
- Adicionar item opcional "Mentora Claude" no `AppSidebar` sob o grupo já existente da Mentora (decisão deixada para implementação; rota direta funciona de qualquer forma).

### Observações de segurança
- A `ANTHROPIC_API_KEY` permanece exclusivamente no servidor (Edge Function).
- Nenhum dado do paciente é enviado no teste — apenas o conteúdo digitado pelo usuário no chat.
- Mensagens não são persistidas no banco neste momento (escopo de teste).
