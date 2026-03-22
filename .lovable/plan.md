

## Plano: Sistema de Orcamentos e Propostas com PDF e Aceite Digital

### Conceito

Criar orcamentos agrupando tratamentos planejados de um paciente em uma proposta formal. O paciente recebe um link publico para visualizar e aceitar digitalmente. O sistema gera PDF para download.

### 1. Migracao de banco de dados

**Nova tabela `budgets`:**

```sql
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  dentist_user_id uuid,
  total_value numeric NOT NULL DEFAULT 0,
  discount numeric DEFAULT 0,
  final_value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente', -- pendente, enviado, aceito, recusado, expirado
  notes text,
  valid_until date,
  accepted_at timestamptz,
  accepted_signature text, -- nome digitado como assinatura
  public_token text UNIQUE DEFAULT gen_random_uuid()::text, -- token para link publico
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  procedure_name text NOT NULL,
  tooth_number text,
  region text,
  value numeric NOT NULL DEFAULT 0,
  notes text
);
```

RLS em `budgets` e `budget_items`: membros podem CRUD. Politica especial SELECT em `budgets` para acesso publico via `public_token` (sem auth).

### 2. Pagina de orcamento no PacienteDetalhe

**Editar `src/pages/PacienteDetalhe.tsx`:**
- Botao "Criar Orcamento" no topo (ao lado de "+ Adicionar Tratamento")
- Dialog para criar orcamento:
  - Selecionar tratamentos planejados do paciente (checkbox)
  - Campo de desconto (R$ ou %)
  - Validade (data)
  - Observacoes
  - Valor total calculado automaticamente
- Lista de orcamentos do paciente com status e acoes

### 3. Geracao de PDF

**Criar `src/utils/budgetPdf.ts`:**
- Funcao que gera PDF usando a biblioteca `jspdf` (ja disponivel ou instalar)
- Conteudo: logo da clinica, dados do paciente, lista de procedimentos, valores, desconto, total, validade, espaco para assinatura
- Botao "Baixar PDF" em cada orcamento

### 4. Pagina publica de aceite digital

**Criar `src/pages/OrcamentoPublico.tsx`:**
- Rota: `/orcamento/:token` (sem ProtectedRoute)
- Busca orcamento pelo `public_token`
- Exibe: dados da clinica, lista de procedimentos, valores, total
- Campo "Nome completo" como assinatura digital
- Botao "Aceitar Orcamento"
- Ao aceitar: atualiza status para `aceito`, salva `accepted_signature` e `accepted_at`
- Atualiza tratamentos vinculados para status `aprovado`

### 5. Compartilhamento

- Botao "Copiar Link" que copia a URL publica do orcamento
- Botao "Enviar WhatsApp" que abre `wa.me` com link

### Arquivos

| Acao | Arquivo |
|------|---------|
| Migracao | 1 SQL (budgets + budget_items + RLS) |
| Criar | `src/utils/budgetPdf.ts` |
| Criar | `src/pages/OrcamentoPublico.tsx` |
| Editar | `src/pages/PacienteDetalhe.tsx` (criar orcamento, listar) |
| Editar | `src/App.tsx` (rota publica `/orcamento/:token`) |

### Detalhes tecnicos

- PDF gerado client-side com `jspdf` (adicionar ao package.json)
- Pagina publica usa `supabase` com anon key — RLS policy especial permite SELECT em budgets/budget_items quando `public_token` corresponde
- Ao aceitar, os treatments vinculados sao atualizados para `aprovado` automaticamente
- Token UUID garante seguranca do link (nao adivinhavel)

### Fluxo

```text
Dentista abre ficha do paciente
  → Clica "Criar Orcamento"
  → Seleciona tratamentos planejados
  → Define desconto e validade
  → Salva orcamento
  → Baixa PDF ou Copia Link
  → Envia ao paciente (WhatsApp)

Paciente abre link publico
  → Visualiza proposta completa
  → Digita nome como assinatura
  → Clica "Aceitar"
  → Tratamentos mudam para "Aprovado"
```

