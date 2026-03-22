

## Plano: Tela do Paciente com Registro de Tratamentos

### 1. Migração de banco de dados

Nova tabela `treatments`:

```sql
CREATE TABLE public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_user_id uuid,
  procedure_type text NOT NULL, -- limpeza, restauracao, faceta, implante, outros
  region text, -- superior, inferior, dente especifico
  status text NOT NULL DEFAULT 'planejado', -- planejado, aprovado, em_andamento, finalizado
  value numeric NOT NULL DEFAULT 0,
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- RLS: membros da clinica podem CRUD
CREATE POLICY "Members can view treatments" ON treatments FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can insert treatments" ON treatments FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can update treatments" ON treatments FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Donos can delete treatments" ON treatments FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));
```

### 2. Criar página `src/pages/PacienteDetalhe.tsx`

Rota: `/pacientes/:id`

**Layout:**

```text
┌─────────────────────────────────────────────┐
│ ← Voltar    Nome do Paciente    📱 Telefone │
│             Badge: Em tratamento            │
│                                             │
│ [+ Adicionar Tratamento]  (botão destaque)  │
│                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ R$ Total │ │ Em anda- │ │ Finali-  │     │
│ │ Faturado │ │ mento    │ │ zados    │     │
│ └──────────┘ └──────────┘ └──────────┘     │
│                                             │
│ Histórico de Tratamentos                    │
│ ┌─────────────────────────────────────────┐ │
│ │ ● Restauração | Superior | R$ 800      │ │
│ │   Aprovado (azul) | 15/03/2026         │ │
│ ├─────────────────────────────────────────┤ │
│ │ ● Limpeza | — | R$ 200                 │ │
│ │   Finalizado (verde) | 10/03/2026      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- Query paciente por ID + todos os treatments do paciente
- KPIs: soma de valores (status aprovado/finalizado), contagem por status
- Lista de tratamentos com badges coloridos (cinza=planejado, azul=aprovado, amarelo=em_andamento, verde=finalizado)
- Botão editar status de cada tratamento

**Dialog "Adicionar Tratamento":**
- Tipo de procedimento (select: Limpeza, Restauração, Faceta, Implante, Outros)
- Região (opcional: Superior, Inferior, campo livre para dente)
- Status (Planejado, Aprovado, Em andamento, Finalizado)
- Valor (R$)
- Observação (textarea opcional)

**Regras de negócio ao salvar:**
- Insere na tabela `treatments`
- Se status = "aprovado" ou "finalizado": insere automaticamente uma entrada na tabela `financials` (type='entrada', category='tratamentos', value, patient_id, responsible_user_id = dentista logado)
- Verificação de duplicidade: checa se já existe financeiro com mesmo patient_id + mesma data + mesmo valor antes de inserir
- Ao mudar status para aprovado/finalizado (edit): mesma lógica de lançamento financeiro

### 3. Atualizar rotas

**`src/App.tsx`**: Adicionar rota `/pacientes/:id` → `PacienteDetalhe`

### 4. Atualizar lista de Pacientes

**`src/Pacientes.tsx`**: Adicionar botão "Ver ficha" no TableRow que navega para `/pacientes/{id}`

### Arquivos

| Ação | Arquivo |
|------|---------|
| Migração | 1 SQL (tabela treatments + RLS) |
| Criar | `src/pages/PacienteDetalhe.tsx` |
| Editar | `src/App.tsx` (rota) |
| Editar | `src/pages/Pacientes.tsx` (link para ficha) |

### Integrações automáticas

- **Financeiro**: lançamento automático ao aprovar/finalizar tratamento
- **Equipe**: produção do dentista atualizada via financials (já usado pelo EquipeVega)
- **Dashboard/GPS**: indicadores atualizados automaticamente via financials existente

