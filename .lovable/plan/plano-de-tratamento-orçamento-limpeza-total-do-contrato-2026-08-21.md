# Plano de Tratamento / Orçamento — limpeza total do contrato

Hoje o documento que o paciente recebe (PDF e página online) é um "Contrato de Prestação de Serviços Odontológicos" com objeto, partes contratantes, cláusulas 3.1 a 3.5 (taxa de falta, foro, validade) e assinatura eletrônica de aceite. Isso será substituído por um Plano de Tratamento / Orçamento limpo, no padrão Quiet Luxury.

## O que o documento passa a conter

1. Cabeçalho: logo, nome da clínica, responsável técnica (Dra. Giseli da Costa Lage | CROSP 165429) e endereço/contato das unidades, com filete dourado.
2. Título: PLANO DE TRATAMENTO E ORÇAMENTO.
3. Dados do paciente: nome, CPF, telefone, data de emissão e validade da proposta.
4. Tabela de procedimentos: descrição, dente, região, valor — com subtotal, desconto e VALOR FINAL em destaque.
5. Formas de pagamento: bloco com todas as condições disponíveis (à vista/PIX com desconto, cartão de crédito parcelado, boleto), destacando visualmente a condição escolhida no orçamento.
6. Rodapé: duas linhas de assinatura manuscrita — Paciente e Profissional (nome + CRO) — e uma linha discreta com a data de emissão.

Removido por completo: seção OBJETO, quadro "Contratada / Contratante", todas as cláusulas contratuais, taxa de cancelamento, foro, e a assinatura digital de aceite.

## Página online do orçamento

A página que o paciente abre pelo link passa a espelhar exatamente o PDF: cabeçalho, dados, tabela, formas de pagamento e rodapé de assinatura. Saem o título de contrato, o objeto, as cláusulas e o campo de aceite por digitação do nome. Continuam disponíveis os botões Baixar PDF, WhatsApp e Imprimir.

Consequência: o paciente não "aceita" mais o plano pelo link. O status do orçamento continua sendo controlado internamente pela clínica.

## Detalhes técnicos

- `src/utils/contractPdf.ts` → renomeado para `src/utils/treatmentPlanPdf.ts`, exportando `generateTreatmentPlanPdf`. Interface perde `acceptedSignature`, `acceptedAt` e `clinic.cancellation_fee`; ganha `paymentOptions` (lista de condições) e mantém `paymentMethod` como condição selecionada.
- `src/utils/budgetPdf.ts` está órfão (sem imports) — será removido para evitar duplicidade.
- `src/pages/OrcamentoPublico.tsx`: remove a mutation de aceite, o input de assinatura e todo o markup de contrato/cláusulas; passa a chamar `generateTreatmentPlanPdf`; nome do arquivo baixado vira `plano-tratamento-<paciente>.pdf`.
- Condições de pagamento renderizadas a partir de uma constante em `src/utils/paymentOptions.ts` (à vista/PIX com desconto, cartão em até 12x, boleto), combinada com `budget.notes` para marcar a opção escolhida. Sem mudança de schema no banco.
- Layout ajustado para caber em uma única página quando houver até ~15 procedimentos; paginação apenas se a lista exceder isso.
- Paleta mantida: Azul Petróleo `#103444` e Dourado, sem alterar tokens do design system.
