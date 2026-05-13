## Aprovação Interna do Orçamento na Ficha do Paciente

### Visão Geral
Adicionar um botão "Aprovar Tratamento Agora" na aba **Plano de Tratamento** do PacienteDetalhe. O botão aprova o orçamento mais recente, registra auditoria, atualiza os procedimentos vinculados e lança uma **Receita Prevista** no Financeiro Geral.

### Técnico

#### 1. Migration no banco de dados

```sql
-- Adiciona coluna de auditoria no orçamento
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
```

#### 2. RPC `approve_budget_manually` (SECURITY DEFINER)

Criar função que recebe `budget_id` e executa com privilégios elevados (bypass RLS):
- Atualiza `budgets.status` para `'aprovado'` e `approved_at = now()`.
- Atualiza todos os `treatments` vinculados aos `budget_items` deste orçamento: `status = 'aprovado'`.
- Insere um registro na tabela `financials`:
  - `type = 'entrada'`
  - `category = 'receita_prevista'`
  - `status = 'pendente'`
  - `value = budget.final_value`
  - `patient_id = budget.patient_id`
  - `clinic_id = budget.clinic_id`
  - `description = 'Receita Prevista — Orçamento aprovado internamente'`
  - `date = CURRENT_DATE`

Isso resolve a restrição RLS do Financeiro sem expor dados a roles não-autorizadas.

#### 3. Frontend (`src/pages/PacienteDetalhe.tsx`)

**Nova query**: buscar orçamentos (`budgets`) do paciente, ordenados por `created_at DESC`.

**Botão "Aprovar Tratamento Agora"**:
- Condição de exibição: usuário tem role `dono`, `admin` ou `dentista` (via `useClinic`) **E** existe um orçamento recente com status `pendente` ou `enviado`.
- Estilo: fundo `#103444` (Azul Petróleo), texto dourado/branco, borda sutil dourada.
- Clique abre **AlertDialog** de confirmação: "Ao aprovar, o orçamento será formalizado, todos os procedimentos vinculados serão marcados como Aprovados e uma Receita Prevista será lançada no Financeiro Geral. Deseja continuar?"

**Mutation `approveBudget`**:
- Chama `supabase.rpc('approve_budget_manually', { _budget_id })`.
- `onSuccess`: invalida queries de `budgets`, `treatments`, `patient-financials`, `financeiro`, e exibe toast "Orçamento aprovado com sucesso! Receita Prevista lançada."

#### 4. Reflexos automáticos

- Como os `treatments` vinculados terão `status = 'aprovado'`, o **Painel Financeiro do Paciente** já recalculará automaticamente:
  - `Total Aprovado` (aumenta)
  - `Saldo Devedor` (aumenta em vermelho)
- Como o registro `financials` tem `category = 'receita_prevista'`, ele aparecerá na aba **Financeiro Geral** com status `pendente` e pode ser filtrado/identificado como receita futura.

### Design
- Botão com gradiente sutil Azul Petróleo + ícone `CheckCircle` do lucide-react.
- Badge dourado "Orçamento Pendente" quando houver budget aguardando aprovação.
- No extrato de pagamentos do paciente, mostrar também as "Receitas Previstas" com badge amarelo/dourado diferenciado.

### Nota de segurança
A RPC é `SECURITY DEFINER`, ou seja, executa com os privilégios do owner no banco. Isso permite que Dentistas aprovem orçamentos e lancem no caixa sem precisar ser Donos, mas a função é controlada e audita a data exata da aprovação.
