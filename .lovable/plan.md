

## Plano — Biblioteca Padrão de Procedimentos VEGA

### 1. Migração (estrutura)

Adicionar 2 colunas em `procedures_catalog`:
- `time_minutes integer` (nullable)
- `observations text` (nullable)

### 2. Reescrever `seed_default_procedures(_clinic_id)`

Substituir a função existente para popular **todos os ~60 procedimentos** da tabela fornecida, divididos nas categorias:

| Categoria nova | Origem na sua tabela |
|---|---|
| `clinico_geral` | A) Clínica Geral / Diagnóstico (7 itens) |
| `dentistica` | B) Dentística / Estética (7 itens) — **nova categoria** |
| `endodontia` | C) Endodontia (7 itens) |
| `periodontia` | D) Periodontia (5 itens) |
| `cirurgia` | E) Cirurgia Oral (8 itens) |
| `implantodontia` | F) Implantodontia (9 itens) |
| `protese` | G) Prótese Dentária (10 itens) |
| `ortodontia` | H) Ortodontia (7 itens) |
| `odontopediatria` | I) Odontopediatria (8 itens) — **nova categoria** |

Cada INSERT inclui: `name`, `category`, `default_value`, `time_minutes`, `observations`.

A função mantém o guard `IF EXISTS ... RETURN` (só popula clínica vazia). Para clínicas que já têm o seed antigo (40 itens sem valor), **adicionar etapa**: se já populada mas sem `time_minutes`, fazer `UPDATE` por nome para enriquecer com tempo/valor/observação dos itens correspondentes (mantendo customizados intactos).

### 3. Atualizar categorias no front

`src/components/ProcedureSelector.tsx` — adicionar 2 entradas no `CATEGORY_LABELS`:
- `dentistica: "Dentística / Estética"`
- `odontopediatria: "Odontopediatria"`

E incluir ambas no `CATEGORY_ORDER`.

### 4. Mostrar metadados no seletor

`ProcedureSelector.tsx` — exibir tempo (ex: `60min`) e valor (ex: `R$ 200`) ao lado do nome em cada `CommandItem`. Tooltip/linha secundária com `observations` quando existir. `onSelect` continua devolvendo `{ name, default_value }` (sem quebrar Orçamentos).

### 5. Aba "Plano de Tratamento" (continuação do escopo anterior)

Adicionar 4ª aba em `src/pages/PacienteDetalhe.tsx`:
- Lista de `treatments` do paciente (procedimento, dente, valor, status)
- Botão "Adicionar procedimento" → usa `ProcedureSelector` → cria registro em `treatments` com `value` = `default_value` da biblioteca
- Rodapé: total planejado + total pago
- Botão "Salvar Alterações" fixo (já no padrão das outras abas)

### 6. Resumo de arquivos

| Arquivo | Mudança |
|---|---|
| Migration | `ALTER TABLE procedures_catalog` + `CREATE OR REPLACE FUNCTION seed_default_procedures` |
| Migration (data) | `UPDATE procedures_catalog SET ...` para enriquecer clínicas existentes |
| `src/components/ProcedureSelector.tsx` | +2 categorias, exibir tempo/valor/obs |
| `src/pages/PacienteDetalhe.tsx` | Nova aba "Plano de Tratamento" |

Sem quebrar Orçamentos, Funil ou Agenda.

