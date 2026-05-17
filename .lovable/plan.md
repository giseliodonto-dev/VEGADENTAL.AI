## Objetivo

Aja como Engenheiro Software Full Stack Sênior. Siga RIGOROSAMENTE o plano de reengenharia de emissão de PDFs abaixo. Substitua as funções de janela por download direto e iframe oculto para eliminar o erro `ERR_BLOCKED_BY_CLIENT`. Execute todas as alterações de arquivos em um único passo unificado.

Eliminar o erro `ERR_BLOCKED_BY_CLIENT` na geração e reimpressão de receituários, removendo todo uso de `doc.output("bloburl")` + `window.open` e oferecendo um trio de ações no padrão Quiet Luxury: **Salvar no Computador**, **Imprimir Receita**, **Enviar por WhatsApp**.

## Mudanças

### 1. `src/utils/prescriptionPdf.ts`

- Manter `generatePrescriptionPdf` como está (já retorna o `jsPDF doc`).
- Adicionar 3 helpers que recebem o `doc` pronto + `patientName`/`patientPhone`:
  - `downloadPrescriptionPdf(doc, patientName)` → `doc.save(\`receita-${slug(patientName)}.pdf)`.
  - `printPrescriptionPdf(doc)` → converte para `blob`, cria `URL.createObjectURL`, injeta `<iframe style="display:none">` no `document.body`, no `onload` chama `iframe.contentWindow.focus()` + `print()` e limpa o iframe + revoga a URL após alguns segundos. **Sem** `window.open` e **sem** `dataurlnewwindow`/`view()`.
  - `sendPrescriptionViaWhatsApp(patientName, patientPhone, clinicName)` → primeiro chama `downloadPrescriptionPdf` (para o dentista anexar manualmente), depois abre `https://api.whatsapp.com/send?phone=<digits>&text=<msg>` via `window.open(..., "_blank", "noopener")`. Mensagem: `Olá, {nome}. Segue o link para download da sua receita gerada na {clinica}. (O PDF foi baixado no seu dispositivo — anexe nesta conversa para enviar.)`. Reutilizar a normalização de telefone existente em `src/lib/whatsapp.ts` (`buildWhatsAppUrl`) para garantir prefixo 55 e fallback desktop/mobile.

### 2. `src/components/prescriptions/PrescriptionForm.tsx`

- Apagar `openPdf` (que usa `doc.output("bloburl")` + `window.open`).
- Substituir o botão único "Salvar e Gerar PDF" por um grupo de 4 botões à direita (Quiet Luxury — `variant="outline"` discreto + um `variant="gold"` principal):
  1. **Salvar** (sem PDF) — mantém.
  2. **💾 Salvar no Computador** — chama `saveMutation` e em `onSuccess` dispara `downloadPrescriptionPdf`.
  3. **🖨️ Imprimir** — salva no banco e dispara `printPrescriptionPdf`.
  4. **💬 WhatsApp** — salva no banco, dispara `downloadPrescriptionPdf` e abre WhatsApp via helper.
- Refatorar `saveMutation` para aceitar um callback pós-save (`afterSave?: (doc) => Promise<void> | void`) em vez do flag `withPdf`. O `doc` é gerado dentro do mutation após o insert e passado ao callback.

### 3. `src/components/prescriptions/PrescriptionPanel.tsx`

- Na função `reprint(p)`, remover `window.open(doc.output("bloburl"), "_blank")`.
- Substituir o único botão "Reimprimir PDF" por menu de 3 ações (dropdown `DropdownMenu` do shadcn, já presente no projeto) com os itens: **Salvar no Computador**, **Imprimir**, **Enviar por WhatsApp**. Cada um chama o helper correspondente passando o `doc` recém-gerado e os dados do paciente (`patient.name`, `patient.phone`/`patient.whatsapp`).

## Detalhes técnicos

- O método de impressão por iframe oculto evita popups bloqueados e mantém o foco na página atual:
  ```ts
  const blobUrl = URL.createObjectURL(doc.output("blob"));
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  iframe.src = blobUrl;
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };
  document.body.appendChild(iframe);
  setTimeout(() => { URL.revokeObjectURL(blobUrl); iframe.remove(); }, 60_000);
  ```
- `slug(patientName)`: lower + remover acentos + `[^a-z0-9]+` → `-`.
- Telefone do paciente: ler `patient.phone` ou `patient.whatsapp` (qualquer que exista no schema) e passar para `buildWhatsAppUrl` de `src/lib/whatsapp.ts`.
- Nenhuma alteração de schema, RLS ou backend.

## Arquivos tocados

- `src/utils/prescriptionPdf.ts` (adiciona helpers)
- `src/components/prescriptions/PrescriptionForm.tsx` (UI + remoção de `window.open`)
- `src/components/prescriptions/PrescriptionPanel.tsx` (UI reimpressão + remoção de `window.open`)