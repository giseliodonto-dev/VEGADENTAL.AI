# Continuar implementação Meta WhatsApp (estado atual)

## Já feito
✅ Migration aplicada — bucket `whatsapp-documents` (público) + policies por clínica.

## Passos restantes (assim que sair do modo Plan)

### 1. Cadastrar secrets da Meta no Supabase
Vou abrir o formulário seguro para você colar os valores destes 5 secrets:
- `META_SYSTEM_USER_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_BUSINESS_ACCOUNT_ID`
- `META_WHATSAPP_TEMPLATE_NAME` (ex.: `documento_clinico`)
- `META_WHATSAPP_TEMPLATE_LANG` (ex.: `pt_BR`)

Se ainda não tiver os tokens, pode deixar em branco e cadastrar depois — a Edge Function falhará com erro claro até estarem preenchidos.

### 2. Criar Edge Function `send-whatsapp-document`
- Deno + CORS preflight
- Lê secrets via `Deno.env.get(...)`
- Valida JWT do usuário (chamadas só de logado)
- Normaliza telefone (digits-only, prefixa `55` se faltar)
- POST `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages` com payload de **template + header document + body variable**
- Retorna erro real da Meta no catch (com código)

### 3. Criar `src/utils/metaWhatsapp.ts`
Wrapper fino chamando `supabase.functions.invoke("send-whatsapp-document", { body: {...} })`.

### 4. Refatorar `src/components/documents/DocumentActions.tsx`
Trocar `handleWhatsApp` por fluxo invisível:
1. Gera PDF
2. Upload no `whatsapp-documents` com `${clinicId}/${patientId}/${crypto.randomUUID()}.pdf` (LGPD-safe)
3. `getPublicUrl()` → URL pública
4. Insere registro em `patient_documents` (histórico)
5. Invoca Edge Function com telefone + URL + nome
6. Toast verde de sucesso ou vermelho com erro real
7. Botão com `<Loader2 />` + "Enviando…" enquanto trabalha
8. Desabilita se `!patient.phone`

## Arquivos finais
- `supabase/functions/send-whatsapp-document/index.ts` (novo)
- `src/utils/metaWhatsapp.ts` (novo)
- `src/components/documents/DocumentActions.tsx` (refatorar `handleWhatsApp`)

Aprove para eu executar tudo de uma vez.
