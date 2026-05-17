## Objetivo

Unificar Odontograma ↔ Plano de Tratamento ↔ Catálogo de Procedimentos com amarração robusta por FK, match inteligente por similaridade de texto e fallback editável quando o catálogo não tiver o item.

## Diagnóstico do bug atual

1. `treatments` **não tem coluna `procedure_id`** — hoje só guarda `procedure_type` (texto). Por isso a "amarração" só existe por nome, e qualquer divergência gera item zerado.
2. Em `useOdontogram.ts → ensureTreatment`, o match com `procedures_catalog` é `eq("name", procName)` + fallback `ilike(procName)` simples. Como nomes do enum (ex.: *"Restauração Estética Direta (1 face)"*) raramente batem com o seed (*"Restauração em resina 1 face"*), cai sempre no fallback `value = 0`.
3. Não há normalização (acentos/parênteses/case) nem tokenização — então mesmo o `ILIKE` falha em quase tudo.
4. `invalidateQueries` usa `["treatments", patientId]`, mas é preciso garantir que o Plano de Tratamento e o Odontograma realmente usem essas chaves (verificar e padronizar).

## Mudanças

### 1. Migração SQL (`supabase--migration`)

- `ALTER TABLE treatments ADD COLUMN procedure_id uuid NULL` (nullable de propósito para fallback).
- Index `idx_treatments_procedure_id` para joins rápidos.
- Função SQL `public.match_procedure(_clinic uuid, _name text)` que retorna `(id uuid, name text, default_value numeric)`:
  - Normaliza com `unaccent(lower(regexp_replace(_name, '[^a-zA-Z0-9]+', ' ', 'g')))`.
  - Tenta nesta ordem: (a) match exato normalizado, (b) `ILIKE %normalizado%`, (c) score por tokens em comum (`ts_rank` ou contagem de palavras compartilhadas ≥ 2), retornando o de maior score com `is_active=true`.
  - `SECURITY DEFINER`, `search_path=public`, requer extensão `unaccent` (criar se ausente).

### 2. `src/components/odontogram/useOdontogram.ts`

Refatorar `ensureTreatment`:

- Chamar `supabase.rpc('match_procedure', { _clinic, _name: procName })`.
- Se encontrou:
  - `value = catalog.default_value`
  - `procedure_id = catalog.id`
  - `procedure_type = catalog.name` (texto canônico do catálogo, não o do enum)
- Se **não** encontrou (fallback amigável):
  - `procedure_id = null`
  - `value = 0`
  - `procedure_type = procName` (literal do odontograma)
  - `notes = '⚠️ Procedimento não encontrado no catálogo — ajuste o valor manualmente.'`
  - Disparar `toast.warning(...)` orientando o dentista.

Persistir também `tooth_number` e — novo — `face` (verificar se coluna existe; se não, criar via migração e armazenar como `tooth_face` text).

### 3. Invalidação de queries

Padronizar as chaves usadas pelo Plano de Tratamento e Odontograma, e em `onSuccess` de `useToggleMark` e `useApplyCombo` invalidar **todas** simultaneamente:

```ts
qc.invalidateQueries({ queryKey: ["treatments", patientId] });
qc.invalidateQueries({ queryKey: ["odontogram-marks", patientId] }); // sem statusType → ambas as views
qc.invalidateQueries({ queryKey: ["odontogram", patientId] });        // legado, se existir
```

Verificar `src/pages/PacienteDetalhe.tsx` e componentes do Plano de Tratamento para confirmar as chaves reais; alinhar se divergirem.

### 4. UI — campo de valor editável no Plano

Se `procedure_id IS NULL`, renderizar o input de valor com borda dourada e ícone de alerta no card do tratamento, permitindo edição inline (já há mutation de update; só ajustar visual). Sem expandir escopo: apenas estado visual + tooltip.

## Detalhes técnicos

```text
clique no odontograma
      │
      ▼
upsert patient_odontogram (tooth, face, condition, status)
      │
      ▼
resolveProcedures(condition, tooth) → ["Nome do Enum"]
      │
      ▼
rpc match_procedure(clinic, nome) ──┬── achou → INSERT treatments (procedure_id, value=catalog, procedure_type=catalog.name)
                                    └── não   → INSERT treatments (procedure_id=null, value=0, notes=⚠, procedure_type=nome literal)
      │
      ▼
update patient_odontogram.treatment_id
      │
      ▼
invalidateQueries(["treatments", id], ["odontogram-marks", id])
```

## Arquivos afetados

- **Migração nova**: cria `procedure_id`, `match_procedure`, habilita `unaccent`.
- `src/components/odontogram/useOdontogram.ts` — refator de `ensureTreatment` + invalidações.
- (Opcional, se identificarmos) componente do Plano de Tratamento — destaque visual do item órfão.

## Confirmações antes de implementar

1. Posso criar a coluna `treatments.procedure_id` (nullable) e habilitar a extensão `unaccent`?
2. Quando o match cair no fallback, prefere `procedure_type` com o **nome literal do enum** (ex.: *"Canal Birradicular"*) ou com um prefixo `[NÃO CATALOGADO] ...`?
3. Confirma que devo padronizar a chave `["treatments", patientId]` em todos os hooks que listam o plano (vou ajustar onde estiver diferente)?