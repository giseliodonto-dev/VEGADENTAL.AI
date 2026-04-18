

## Diagnóstico do estado atual

Já existe a infra para isso — não precisa criar `patient_treatment_plans` nem `financial_installments`. Reuso:

- **`treatments`** — já tem `procedure_type, value, payment_type, installments, payment_status, amount_paid, tooth_number, region, status`. É o "item do plano".
- **`budgets` + `budget_items`** — já agrupam tratamentos como proposta formal, com `public_token`, `accepted_signature`, `accepted_at`, `status` (pendente/enviado/aceito), `discount`, `total_value`, `final_value`. **Esse É o "Plano de Tratamento aprovado / Contrato"**.
- **`procedures_catalog`** — biblioteca já populada com 70 itens (categoria, valor, tempo, observações).
- **`payments`** — registra cada parcela paga, vinculada a `treatment_id`.
- **`financials`** — caixa real (Recebimento). Não é onde "Receita Prevista" entra; previsão = soma de `treatments.value` com `payment_status != 'pago'`. O módulo Gestão já lê assim.

Página `/orcamento/:token` (`OrcamentoPublico.tsx`) já gera a visualização pública do contrato com assinatura digital. Não precisamos duplicar.

## Plano — Aba "Plano de Tratamento" em `PacienteDetalhe.tsx`

### 1. Nova aba (4ª) na ficha do paciente

Em `src/pages/PacienteDetalhe.tsx`, adicionar `TabsTrigger` "Plano" + `TabsContent value="plano"`.

### 2. Listagem dos tratamentos do paciente

Query em `treatments` filtrando por `patient_id`. Tabela limpa estilo Quiet Luxury com colunas:

| Procedimento | Dente/Região | Valor | Status | Ações |

Cada linha mostra `procedure_type`, `tooth_number`, `value` formatado, `status` (planejado/em_andamento/concluido) e `payment_status` como badge.

### 3. Adicionar item via biblioteca

Botão dourado "Adicionar Procedimento" → abre `Dialog` com:
- `ProcedureSelector` (já existe, lê `procedures_catalog`) → preenche `procedure_type` e sugere `value` automaticamente
- Input `tooth_number` (livre, ou dropdown integrado ao odontograma do mesmo paciente — autocomplete dos dentes já marcados)
- Input `region` (opcional)
- Input `value` editável (vem preenchido)
- Insert em `treatments` com `status='planejado'`, `payment_status='pendente'`, `clinic_id`, `patient_id`

### 4. Negociação e geração do orçamento/contrato

Painel "Resumo do Plano" no rodapé da aba:
- Subtotal (soma `value` dos planejados)
- Input Desconto (%) ou Acréscimo (R$)
- **Valor Final** em destaque grande (texto Azul Petróleo, borda dourada)
- Select Forma de Pagamento: `pix | cartao | parcelado | boleto`
- Se `parcelado`: input `installments` (nº) + preview da grade de parcelas (data + valor) calculada client-side a partir de hoje (mensal)
- Botão dourado **"Gerar Aprovação do Plano"**:
  1. `INSERT` em `budgets` (clinic_id, patient_id, total_value=subtotal, discount, final_value, status='pendente', valid_until=+30d)
  2. `INSERT` em `budget_items` (uma linha por treatment do plano: procedure_name, tooth_number, region, value, treatment_id)
  3. Redireciona para `/orcamento/:token` (já renderiza o contrato pronto pra assinatura/impressão)

### 5. Integração com Financeiro (Receita Prevista)

Sem mudança de schema. O módulo Financeiro já calcula receita prevista somando `treatments.value` onde `payment_status != 'pago'`. A aprovação do plano gera `treatments` que entram automaticamente nesse cálculo. Quando paciente paga uma parcela, registra-se em `payments` (já existe fluxo).

Quando `budgets.status = 'aceito'` (via `/orcamento/:token`), opcionalmente atualizar `treatments.status` dos itens vinculados para `'em_andamento'`.

### 6. Arquivos

| Arquivo | Mudança |
|---|---|
| `src/pages/PacienteDetalhe.tsx` | +Tab "Plano" com listagem, dialog de adicionar via `ProcedureSelector`, painel de negociação, botão "Gerar Aprovação" |

Sem migração. Sem novas tabelas.

### 7. Por que não criar `patient_treatment_plans` / `financial_installments`

- `treatments` + `budgets` + `budget_items` cobrem 100% do fluxo descrito
- `payments` já é o "financial_installments" funcional (1 linha por parcela paga)
- Duplicar quebraria Funil de Vendas, Inteligência Financeira e Comissões que já leem dessas tabelas

