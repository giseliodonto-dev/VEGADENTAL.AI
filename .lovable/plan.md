

## Diagnóstico: cadastro de colaborador quebrado

**3 problemas encontrados:**

### 1. Edge function `send-invite` não existe
`EquipeVega.tsx` chama `supabase.functions.invoke('send-invite')` mas só existe `vega-intelligence` em `supabase/functions/`. Toda tentativa de convidar resulta em erro 404 da função → toast "Erro ao enviar".

### 2. Role inválido
O código envia `role: 'dentist'` (inglês). O enum `app_role` só aceita: `dono, recepcao, dentista, crm, sdr, admin, protetico`. Mesmo se a função existisse, falharia ao inserir.

### 3. Falta UX de fallback (link copiável)
Não temos servidor de e-mail configurado (sem RESEND_API_KEY nos secrets). A função precisa retornar o **link do convite** para o dono copiar e enviar manual via WhatsApp/e-mail. A página atual também não lista convites pendentes nem permite cancelar/recopiar.

---

## Plano de correção

### A. Criar edge function `send-invite` (pública, sem JWT)
Arquivo: `supabase/functions/send-invite/index.ts`

Lógica:
1. Recebe `{ email, clinicId, role }`
2. Valida `role` contra o enum válido
3. Verifica se já existe convite `pending` para esse email+clinic → se sim, retorna o link existente (em vez de erro 409)
4. Insere em `invites` com service_role
5. Retorna `{ inviteUrl: "{origin}/convite/{token}", reused: bool }`

Config em `supabase/config.toml`: `verify_jwt = false` (chamada do app autenticada via anon key).

### B. Reescrever `src/pages/gestao/EquipeVega.tsx`
- Form com **select de role** (Dentista / Recepção / CRM / SDR / Admin / Protético) — não fixar `dentist`
- Após gerar, mostrar **link copiável** com botão "Copiar" + botão WhatsApp (`wa.me/?text=...`)
- Listar **Convites Pendentes** (com ações: copiar link, cancelar)
- Listar **Membros Ativos** (já existe)
- Usar `getPublicAppOrigin()` de `src/lib/publicUrl.ts` para montar o link

### C. (Opcional, não bloqueante) RLS para anon ler convite por token
Já existe a policy `public_read_invite_by_token` — OK, sem mudança.

### Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/send-invite/index.ts` | Criar |
| `supabase/config.toml` | Adicionar bloco `[functions.send-invite] verify_jwt = false` |
| `src/pages/gestao/EquipeVega.tsx` | Reescrever (select role, link copiável, lista pendentes) |

Sem migrações de banco — schema já está correto. Sem necessidade de RESEND ou serviço de e-mail (entrega manual via link copiado).

