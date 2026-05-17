## Substituir `printPrescriptionPdf` por janela temporária

**Arquivo:** `src/utils/prescriptionPdf.ts`

Substituir a implementação atual (iframe invisível, bloqueada pelo navegador) pela abordagem de janela temporária controlada via `window.open`, com fallback para download direto caso o pop-up seja bloqueado.

### Nova função

```ts
export function printPrescriptionPdf(doc: jsPDF) {
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);

  const printWindow = window.open(blobUrl, "_blank", "width=800,height=600");

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    };
  } else {
    doc.save("receita-emergencial.pdf");
  }
}
```

### Fluxo do botão "Imprimir"

Nenhuma mudança estrutural necessária — o fluxo atual em `PrescriptionForm.tsx` já segue a ordem correta:

1. `saveMutation.mutate({ action: "print" })` insere a prescrição no Supabase.
2. Após o insert bem-sucedido, `runPdfAction("print", doc)` é executado dentro do `mutationFn`, chamando `printPrescriptionPdf(doc)`.

O mesmo vale para `PrescriptionPanel.tsx` (reimpressão), que já chama `printPrescriptionPdf(doc)` diretamente após gerar o PDF.

### Escopo

- Apenas a função `printPrescriptionPdf` será reescrita.
- Nenhuma alteração em componentes, banco de dados ou demais helpers (`downloadPrescriptionPdf`, `sendPrescriptionViaWhatsApp`).
