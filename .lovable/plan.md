

## Plano: Controle de Pagamentos VEGA

### Problema atual

O sistema atual registra um lançamento financeiro automático quando o tratamento é aprovado/finalizado, mas não controla pagamentos reais (parciais, parcelados). Não diferencia "faturamento" (venda) de "recebimento" (dinheiro entrando). Comissão é calculada sobre venda, não sobre recebimento.

### 1. Migração de banco de dados

Nova tabela `payments`:

```sql
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  treatment_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'pix', -- pix, cartao, dinheiro, boleto
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- RLS: membros podem ver/inserir, donos podem deletar
```

Adicionar colunas à tabela `treatments`:

```sql
ALTER TABLE public.treatments
  ADD COLUMN total_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN amount_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN payment_status text NOT NULL DEFAULT 'pendente', -- pendente, parcial, pago
  ADD COLUMN payment_type text DEFAULT 'avista'; -- avista, parcelado
  ADD COLUMN installments integer DEFAULT 1;
```

### 2. Lógica de pagamentos

**Ao registrar pagamento:**
1. Inserir na tabela `payments`
2. Atualizar `treatments.amount_paid` (soma de todos payments do tratamento)
3. Recalcular `treatments.payment_status`:
   - `amount_paid = 0` → pendente
   - `amount_paid < total_value` → parcial
   - `amount_paid >= total_value` → pago
4. Inserir entrada no `financials` com category `'recebimento'` (diferente de `'tratamentos'` que é faturamento)
5. Calcular comissão proporcional: `amount × commission_rate` do dentista

### 3. Alterações em `PacienteDetalhe.tsx`

- Adicionar KPIs: "Valor Pago" e "Valor Pendente"
- Em cada tratamento na lista: mostrar barra de progresso de pagamento com badge colorido (vermelho=pendente, amarelo=parcial, verde=pago)
- Botão "Registrar Pagamento" em cada tratamento
- Dialog de pagamento: valor, forma de pagamento, data, observação
- Histórico de pagamentos por tratamento (expansível)

### 4. Alteração na lógica financeira

- **Remover** o lançamento automático ao aprovar/finalizar tratamento (isso era faturamento fictício)
- Agora o financeiro só recebe entradas **reais** via pagamentos
- Diferenciar no `financials`: `category='faturamento'` (venda) vs `category='recebimento'` (pagamento real)

### 5. Comissão baseada em recebimento

- Ao registrar pagamento, calcular comissão do dentista: `payment.amount × clinic_member.commission_rate`
- Inserir no `financials` como saída com `category='comissao'`

### Arquivos

| Ação | Arquivo |
|------|---------|
| Migração | 1 SQL (tabela payments + colunas em treatments + RLS) |
| Editar | `src/pages/PacienteDetalhe.tsx` (dialog pagamento, KPIs, badges) |
| Editar | `src/pages/gestao/FinancasVega.tsx` (recebido vs faturado) |

### Impacto nos módulos existentes

- **Finanças VEGA**: mostrará "Total Recebido vs Faturado"
- **Equipe**: comissão baseada em dinheiro real recebido
- **Dashboard**: indicadores financeiros refletem caixa real

