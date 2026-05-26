# Migração Meta → Twilio WhatsApp

## Objetivo
Substituir toda a integração Meta Cloud API por Twilio, mantendo o fluxo invisível: clicar no botão → gera PDF → sobe no bucket público → dispara mensagem WhatsApp com link do documento → toast de status.

## O que será REMOVIDO

1. **Edge Function** `supabase/functions/send-whatsapp-document/` (Meta) — deletada do projeto e do Supabase.
2. **Wrapper** `src/utils/metaWhatsapp.ts` — deletado.
3. **Secrets Meta** continuam no Supabase mas ficam órfãos (você pode remover manualmente quando quiser): `META_SYSTEM_USER_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_BUSINESS_ACCOUNT_ID`, `META_WHATSAPP_TEMPLATE_NAME`, `META_WHATSAPP_TEMPLATE_LANG`.

## O que será CRIADO

### 1. Edge Function `supabase/functions/send-whatsapp-twilio/index.ts`
- CORS + preflight OPTIONS
- Valida JWT do usuário logado (chamada autenticada)
- Lê 3 secrets via `Deno.env.get`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- Valida body: `phone`, `patientName`, `documentUrl`, `filename?`
- Normaliza telefone (digits-only, prefixa `55` se faltar, monta `whatsapp:+55...`)
- Monta `From: whatsapp:${TWILIO_WHATSAPP_NUMBER}` (sandbox ou número aprovado)
- POST `application/x-www-form-urlencoded` para `https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json` com Basic Auth (`SID:AUTH_TOKEN` em base64)
- Campos: `To`, `From`, `Body` (texto curto tipo "Olá {nome}, segue seu documento: {url}"), `MediaUrl` (URL pública do PDF)
- Retorna erro real do Twilio (code + message) em caso de falha

### 2. Wrapper `src/utils/twilioWhatsapp.ts`
Função `sendDocumentViaTwilio({ phone, patientName, documentUrl, filename })` que faz `supabase.functions.invoke("send-whatsapp-twilio", { body })` e lança erro com detalhe se falhar.

### 3. Refatorar `src/components/documents/DocumentActions.tsx`
Trocar import e chamada de `sendDocumentViaMetaAPI` para `sendDocumentViaTwilio`. O resto do fluxo (gera PDF → upload no bucket `whatsapp-documents` → getPublicUrl → insere em `patient_documents` → dispara → toast) permanece idêntico, incluindo loading state e toasts verde/vermelho via `sonner`.

## Secrets que VOCÊ precisa cadastrar depois
Quando der ok, eu abro o formulário seguro para você colar:
- `TWILIO_ACCOUNT_SID` (começa com `AC...`)
- `TWILIO_AUTH_TOKEN` (Auth Token principal da conta — em Console → Account → API keys & tokens)
- `TWILIO_WHATSAPP_NUMBER` (no formato E.164 **sem** o prefixo `whatsapp:`, ex.: `+14155238886` para o sandbox)

## Observações importantes (Twilio WhatsApp)
- **Sandbox de testes**: para usar em DEV, o paciente precisa enviar a mensagem `join <palavra>` para o número do sandbox antes de receber qualquer coisa. Em produção, você precisa de número WhatsApp Business aprovado pela Meta via Twilio.
- **MediaUrl exige URL pública HTTPS** acessível pela internet — o bucket `whatsapp-documents` já é público, então funciona.
- **Mensagens fora da janela de 24h** exigem template aprovado (HSM). Para envio reativo logo após interação, mensagem livre + MediaUrl funciona normalmente.

## Arquivos finais
- ❌ deletar `supabase/functions/send-whatsapp-document/index.ts`
- ❌ deletar `src/utils/metaWhatsapp.ts`
- ✅ criar `supabase/functions/send-whatsapp-twilio/index.ts`
- ✅ criar `src/utils/twilioWhatsapp.ts`
- ✏️ editar `src/components/documents/DocumentActions.tsx` (trocar 2 linhas: import + chamada)

Aprova para eu executar tudo de uma vez?
