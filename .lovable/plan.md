## Diagnóstico

- `DocumentActions.tsx` (botão "Enviar no WhatsApp" da aba **Documentos**) já está 100% via Twilio Edge Function. Não há `window.open` nem `wa.me` nele.
- O erro `ERR_BLOCKED_BY_RESPONSE` vem do **botão de Receita** (`PrescriptionPanel.tsx` e `PrescriptionForm.tsx`), que ainda usa `sendPrescriptionViaWhatsApp()` de `src/utils/prescriptionPdf.ts`. Essa função baixa o PDF localmente e chama `window.open("https://web.whatsapp.com/send?...")` — o iframe do preview bloqueia, e em produção abriria aba do WhatsApp Web (comportamento que você quer eliminar).
- Os demais `openWhatsApp` (lista de pacientes, leads, agenda, follow-up, orçamento, anamnese, templates) abrem WhatsApp apenas como atalho de **mensagem de texto** sem documento, e não foram citados no pedido — fora de escopo.

## Mudanças

### 1. `src/components/prescriptions/PrescriptionPanel.tsx`
- Remover import e uso de `sendPrescriptionViaWhatsApp`.
- No handler "Enviar por WhatsApp":
  - Setar `busy = "wa"` (loading "Enviando...").
  - Gerar o PDF da receita (`generatePrescriptionPdf` — já existe).
  - Fazer upload no bucket `whatsapp-documents` em `${clinicId}/${patientId}/receita-<uuid>.pdf` (mesmo padrão de `DocumentActions.handleWhatsApp`).
  - Obter `publicUrl` via `supabase.storage.getPublicUrl`.
  - Chamar `sendDocumentViaTwilio({ phone, patientName, documentUrl, filename: "Receita - <Paciente>.pdf" })`.
  - Toast verde de sucesso / toast vermelho em erro. Sem `window.open`, sem download local.
- Botão exibe `Loader2` e texto "Enviando..." enquanto `busy === "wa"`. Desabilitar se paciente sem telefone.

### 2. `src/components/prescriptions/PrescriptionForm.tsx`
- Mesma refatoração do handler de envio (substituir `sendPrescriptionViaWhatsApp` pelo fluxo Twilio acima). Estado de loading no botão "Enviar por WhatsApp".

### 3. `src/utils/prescriptionPdf.ts`
- Remover a função `sendPrescriptionViaWhatsApp` (e o import de `buildWhatsAppUrl`) para garantir que nenhum botão do app consiga reintroduzir o `window.open` para WhatsApp Web a partir de receita.
- Manter `downloadPrescriptionPdf` e `printPrescriptionPdf` (são fluxos legítimos de download/impressão e não foram pedidos para mudança).

### 4. Pré-requisito de infraestrutura (apenas verificar — sem mudança automática)
- `sendDocumentViaTwilio` depende do bucket público `whatsapp-documents` (já usado por `DocumentActions`). Se ele ainda não existe no Supabase, o upload da receita também falhará. Você confirma que o bucket já foi criado (mesmo usado nos testes de documento)? Se sim, nada a fazer.

## Fora de escopo (não vou tocar)

- `DocumentActions.tsx` — já está correto.
- `openWhatsApp` em telas de lista/leads/agenda — são atalhos de mensagem de texto sem anexo, comportamento esperado de "abrir WhatsApp do usuário".
- Edge Function `send-whatsapp-twilio` — sem alteração.
- Segredos Twilio — sem alteração.

## Validação após implementar

1. Abrir uma receita em `/pacientes/:id`, clicar "Enviar por WhatsApp".
2. Esperado: botão vira "Enviando...", **nenhuma aba abre**, toast verde "Documento enviado…".
3. Em erro: toast vermelho com a mensagem real do Twilio (ex.: `63007`, `21211`).
4. Repetir o mesmo teste no botão de documento (Atestado/Comparecimento) para confirmar que nada regrediu.
