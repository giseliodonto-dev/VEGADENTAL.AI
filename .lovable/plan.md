

## Plano Aprovado — Ficha de Pacientes em Abas

### 1. Migração de banco

**Adicionar colunas em `patients`** (todas nullable, sem quebrar nada):
- `rg text`, `gender text`, `postal_code text`, `street text`, `number text`, `neighborhood text`, `city text`, `state text`

**Criar tabela `odontograms`:**
- `id uuid pk`, `clinic_id uuid not null`, `patient_id uuid not null unique`, `teeth_data jsonb default '{}'`, `updated_at`, `created_at`
- RLS: members view/insert/update por `clinic_id`; donos delete

**Reusar `anamneses`** existente (já cobre alergias, medicações, doenças, etc).

### 2. Código

| Arquivo | Mudança |
|---|---|
| `src/pages/Pacientes.tsx` | Reescrever: listagem em **cards de luxo** (off-white, Azul Petróleo `#103444`, bordas douradas). Cada card abre `/pacientes/:id`. Mantém modal de cadastro rápido (nome+phone+profissão). |
| `src/pages/PacienteDetalhe.tsx` | Reescrever com **Tabs** (Cadastro / Anamnese / Odontograma). Botão "Salvar Alterações" fixo no rodapé de cada aba. |
| `src/App.tsx` | Confirmar rota `/pacientes/:id` (já existe). |

### 3. Detalhes das abas

**Aba 1 — Cadastro**
- Campos: nome, cpf, rg, birthdate, gender (select), phone, email, postal_code (com busca **ViaCEP** automática ao completar 8 dígitos → preenche street/neighborhood/city/state), number
- `upsert` em `patients` por `id`

**Aba 2 — Anamnese**
- Reusa tabela `anamneses` (1 registro por paciente)
- Campos: alergias (textarea destacada **vermelho** se preenchida), medicações, doenças (checkboxes: diabetes, hipertensão, etc — usa array `diseases`), gestante (não existe coluna; mapear via `diseases` array contendo "gestante"), bruxismo, fumante, álcool, sangramento, sensibilidade, dor atual, cirurgias, notas clínicas
- `upsert` por `patient_id`

**Aba 3 — Odontograma**
- Grade visual 32 dentes (16 superior + 16 inferior, numeração FDI)
- Click no dente abre menu: estado (hígido, cariado, restaurado, ausente, coroa, canal) → cor diferente
- `upsert` em `odontograms.teeth_data` (JSONB tipo `{ "11": "cariado", "12": "restaurado", ... }`)

### 4. Design Quiet Luxury
- Fundo `bg-slate-50` / branco
- Texto `text-[#103444]`
- Bordas douradas `border-amber-400/40` em cards e botão primário com `border-amber-500`
- Tabs com underline dourado no ativo

