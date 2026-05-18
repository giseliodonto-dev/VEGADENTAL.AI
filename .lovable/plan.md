# Integração Meta WhatsApp Cloud API — Envio de Documentos

Vou construir do zero a primeira integração oficial de envio de mensagens pelo WhatsApp Business (Meta Cloud API), totalmente client-side conforme solicitado.

## ⚠️ Aviso de segurança (antes de implementar)

Você pediu para usar `VITE_META_SYSTEM_USER_TOKEN` no front-end. Variáveis `VITE_*` são **embutidas no bundle JavaScript** e ficam visíveis para qualquer pessoa que abrir o DevTools. Um System User Token da Meta dá acesso total ao envio em nome da conta — se vazar, terceiros podem disparar mensagens cobradas no seu WABA e até ser banido pelo Meta.

**Recomendação profissional:** mover a chamada para uma Edge Function (`send-whatsapp-document`) e guardar o token como secret server-side. Mesma UX, zero exposição.

Posso seguir o pedido literal (token no client) ou aplicar a versão segura (Edge Function). Confirme antes de implementar — o restante do plano abaixo já contempla as duas opções, mudando apenas onde o token vive.

---

## 1. Bucket de Storage público temporário (migration)

O bucket atual `patient-documents` é **privado** — a Meta API precisa baixar o PDF por URL pública. Criar bucket dedicado:

- Novo bucket `whatsapp-documents` (público)
- Policy `SELECT` pública (qualquer um com a URL lê)
- Policy `INSERT` apenas para `authenticated` da clínica dona
- Path: `${clinicId}/${patientId}/${docType}-${timestamp}.pdf`

(Opcional futuro: cron de limpeza após 7 dias.)

## 2. Variáveis de ambiente

Adicionar referências no código (não preciso editar `.env` — você preenche manualmente):

```text
VITE_META_WHATSAPP_PHONE_NUMBER_ID
VITE_META_WHATSAPP_BUSINESS_ACCOUNT_ID
VITE_META_SYSTEM_USER_TOKEN
VITE_META_WHATSAPP_TEMPLATE_NAME   (ex.: "documento_clinico")
VITE_META_WHATSAPP_TEMPLATE_LANG   (ex.: "pt_BR")
```

O template precisa estar **aprovado no Meta Business Manager** com:

- Componente `header` tipo `document` (parâmetro = link do PDF)
- Componente `body` com 1 variável `{{1}}` (nome do paciente)

## 3. Novo serviço `src/utils/metaWhatsapp.ts`

Função `sendDocumentViaMetaAPI({ phone, patientName, documentUrl, filename })`:

- Normaliza telefone: remove tudo que não é dígito; se não começar com `55`, prefixa
- Valida que tem 12–13 dígitos após normalização
- `POST` para `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`
- Headers: `Authorization: Bearer ${TOKEN}`, `Content-Type: application/json`
- Body (template com header `document`):

```json
{
  "messaging_product": "whatsapp",
  "to": "<phone>",
  "type": "template",
  "template": {
    "name": "<TEMPLATE_NAME>",
    "language": { "code": "<TEMPLATE_LANG>" },
    "components": [
      { "type": "header", "parameters": [
          { "type": "document", "document": { "link": "<documentUrl>", "filename": "<filename>" } }
      ]},
      { "type": "body", "parameters": [
          { "type": "text", "text": "<patientName>" }
      ]}
    ]
  }
}
```

- Lança `Error` com `error.message` da resposta Meta em caso de falha (códigos 100, 131026, 132000 etc.)

## 4. Refatorar `DocumentActions.tsx`

Manter botão "Salvar Documento" como está. Trocar o "Enviar no WhatsApp" pelo novo fluxo invisível:

1. `setBusy("wa")` → botão mostra `<Loader2 />` + texto **"Enviando..."**
2. Gerar PDF via `generateDocumentPdf()`
3. Upload do blob no bucket `whatsapp-documents` → `getPublicUrl()`
4. Registrar no histórico `patient_documents` (igual ao Save)
5. Chamar `sendDocumentViaMetaAPI({ phone, patientName, documentUrl, filename })`
6. ✅ Toast verde: **"Documento enviado diretamente para o WhatsApp do paciente!"**
7. ❌ Catch → Toast vermelho com mensagem real da Meta (ex.: "Meta API: número não está no WhatsApp")

Desabilitar botão se `!patient.phone`.

## 5. Arquivos

- `supabase/migrations/<timestamp>_whatsapp_documents_bucket.sql` (novo)
- `src/utils/metaWhatsapp.ts` (novo)
- `src/components/documents/DocumentActions.tsx` (refatorar handler `handleWhatsApp`)

---

## Decisões necessárias antes de implementar

1. **Token no client (VITE_) ou Edge Function segura?** (recomendo Edge Function)
2. **Bucket público OK?** PDFs ficam acessíveis por URL para quem tiver o link (UUIDs imprevisíveis, mas públicos).
3. **Já tem template aprovado na Meta?** Sem template aprovado a API rejeita. Qual o `name` e `language`?    Análise técnica impecável. Você está coberto de razão quanto à segurança da arquitetura. Vamos seguir exatamente com a abordagem profissional que você desenhou.
  Respondendo às suas perguntas de decisão para você iniciar a implementação imediatamente:
  **1. Segurança Máxima (Edge Function):** APROVADO. Não exponha o `SYSTEM_USER_TOKEN` no client-side de forma alguma. Crie a Supabase Edge Function `send-whatsapp-document` em Deno para fazer a comunicação segura server-side com a Meta API. O frontend deve apenas chamar a Edge Function via `supabase.functions.invoke`. As variáveis da Meta devem ficar nos Secrets do Supabase. *Atenção:* Lembre-se de configurar e retornar corretamente os cabeçalhos de CORS (Cross-Origin Resource Sharing) dentro da Edge Function para chamadas de método `OPTIONS` e de sucesso, garantindo que o frontend consiga consumi-la sem bloqueios de navegador.
  **2. Bucket Público (whatsapp-documents):** APROVADO. Pode criar a migration para o bucket público temporário. Para garantir a privacidade (LGPD), garanta que o path do arquivo use um `crypto.randomUUID()` forte na nomenclatura do PDF, tornando a URL pública impossível de ser adivinhada ou indexada.
  **3. Template da Meta:** Utilize o nome genérico `documento_clinico` e o idioma `pt_BR` no código. O template exato com o parâmetro `{{1}}` (nome) no body e o link no `header` será criado e aprovado pela equipe de TI diretamente no Business Manager da Meta posteriormente.
  Pode gerar os arquivos, a migration do storage, a Edge Function e refatorar o `DocumentActions.tsx` executando todo o fluxo invisível e seguro que você mapeou!