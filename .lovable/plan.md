## Reescrita da aba Evolução Clínica

Substitui o formulário rich-text "Novo Atendimento" (que está incorreto) por um formulário enxuto que vincula a evolução a um procedimento aprovado e abate o saldo de créditos pagos do paciente.

### O que vai sair

- Remover do `HistoryPanel.tsx` o form livre com Tiptap.

- Remover dependência do `RichTextEditor` nessa tela (arquivo permanece no repo, sem uso, para não quebrar nada).

- Manter a tabela `patient_history` (já existe com `content`, `summary`, `dentist_user_id`).

### O que vai entrar

**1. Migration (uma única):**

- `ALTER TABLE patient_history ADD COLUMN treatment_id uuid` (nullable, sem FK rígida pra preservar histórico se o tratamento for excluído).

- `ALTER TABLE patient_history ADD COLUMN executed_value numeric NOT NULL DEFAULT 0` — snapshot do valor abatido no momento da execução.

- Index `(patient_id, created_at desc)`.

**2. Lógica de saldo (calculada no client, sem trigger):**

```

saldoCreditos = totalPagoEntradas(financials) − Σ(executed_value das evoluções)

```

- `totalPagoEntradas` = soma de `financials` `type='entrada'` `status='pago'` do paciente (já carregado em `patientFinancials`).

- A subtração acontece automaticamente porque ao salvar uma evolução criamos uma linha em `patient_history` com `executed_value = treatment.value`.

**3. Novo `HistoryPanel`:**

- Header: "Evolução Clínica" + botão `+ Nova Evolução`.

- Card de saldo no topo: "Saldo de Créditos Pagos: R$ X" (atualiza em tempo real via React Query).

- Form inline ao clicar:

  - **Select de procedimento** — lista apenas treatments do paciente com `status IN ('aprovado','planejado','em_andamento')` (não executados ainda). Mostra "Procedimento · dente · R$ valor".*Se o saldo de créditos for menor que o valor do procedimento, exiba um alerta em amarelo: 'Atenção: Saldo insuficiente para este procedimento', mas permita salvar (afinal, o paciente pode pagar depois)."* — Isso evita que o sistema trave se o saldo estiver negativo.

  - **Textarea simples** (sem Tiptap) — texto da evolução, placeholder "Descreva o que foi realizado...".

  - Botões Cancelar / Salvar Evolução.

- Ao salvar (transação client-side sequencial):

  1. `INSERT patient_history { clinic_id, patient_id, dentist_user_id, treatment_id, content, summary, executed_value: treatment.value }`.

  2. `UPDATE treatments SET status='executado' WHERE id = treatment_id`.

  3. Invalida queries `["patient-history", id]`, `["treatments", id]`, `["patient-financials", id]` → saldo recalcula sozinho.

  - Toast: "Evolução registrada · R$ X abatido do saldo".

**4. Timeline:**

- `HistoryEntryCard` ajustado para exibir uma linha por evolução:

  - **Data** `dd/MM/yyyy · HH:mm`) • **Procedimento** (nome + dente, lookup pelo `treatment_id` em `treatments`) • **Texto** da evolução • **Saldo abatido** `fmtBRL(executed_value)` em destaque dourado).

- Dentista responsável em linha secundária.

- Empty state mantido.

**5. Status `executado`:**

- Adicionar opção `executado` ao Select de status no Plano de Tratamento (linha ~756 de `PacienteDetalhe.tsx`) e ao `STATUS_LABELS`.

- Ajustar `totalAprovado` para considerar também `executado` (procedimento executado continua compondo o total contratado).

### Arquivos tocados (em um único passo)

- Migration: adiciona `treatment_id` e `executed_value` em `patient_history`.

- `src/components/history/HistoryPanel.tsx` — reescrito (sem Tiptap, com select + textarea + saldo).

- `src/components/history/HistoryEntryCard.tsx` — reescrito para o novo layout de linha do tempo.

- `src/components/history/HistoryTimeline.tsx` — pequeno ajuste de props.

- `src/pages/PacienteDetalhe.tsx` — adiciona `executado` aos status e inclui no `totalAprovado`.

### Não incluído

- Reverter execução (se precisar desfazer, por enquanto é manual: mudar status do tratamento e excluir entrada de histórico).

- FK formal `treatment_id → treatments(id)` (deixado solto pra preservar histórico).

- Edição da evolução depois de salva.

ESTA CERTO ISSO?