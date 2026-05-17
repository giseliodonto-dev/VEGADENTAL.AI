# Matriz Preditiva Absoluta — Odontograma Inteligente

Integração completa da matriz de procedimentos no `odontogramConfig.ts`, no menu `ToothActionMenu.tsx` e na lógica de geração de tratamentos em `useOdontogram.ts`. Sem simplificar nomenclaturas, com endodontia dinâmica por tipo de dente, combos automáticos e fallback seguro.

## 1. `src/components/odontogram/odontogramConfig.ts`

### 1.1 Expansão do tipo `Condition`

Substituir o enum atual por uma matriz categorizada (mantendo retrocompatibilidade com marcas já salvas no banco — strings):

```ts
export type Specialty =
  | "dentistica" | "endodontia" | "protese"
  | "implantodontia" | "ortodontia" | "periodontia" | "cirurgia";

export type Condition =
  // Diagnósticos (visão inicial)
  | "carie" | "fratura" | "pulpite_necrose" | "ausente"
  | "destruicao_coronaria" | "arcada_ausente_total"
  // Dentística
  | "restauracao_direta_1face"
  | "restauracao_complexa_2faces"
  | "remineralizacao_selante"
  | "restauracao_cervical"
  | "reconstrucao_estetica"
  | "restauracao_indireta"
  // Endodontia
  | "canal_unirradicular"
  | "canal_birradicular"
  | "canal_multirradicular"
  | "retratamento_endodontico"
  // Prótese
  | "retentor_intrarradicular"
  | "coroa_provisoria"
  | "coroa_ceramica"
  | "ponte_fixa"
  | "ppr"
  | "protese_total"
  // Implantodontia
  | "implante_unitario_cirurgia"
  | "coroa_sobre_implante"
  | "implantes_multiplos_cirurgia"
  | "ponte_sobre_implantes"
  | "protocolo_cirurgia"
  | "protocolo_protese"
  // Ortodontia
  | "aparelho_fixo"
  | "aparelho_removivel"
  | "alinhadores"
  | "planejamento_ortodontico_digital"
  // Periodontia
  | "raspagem_supra_profilaxia"
  | "raspagem_sub_polimento"
  | "splintagem_gengival"
  // Cirurgia
  | "exodontia_permanente"
  | "exodontia_siso"
  | "placa_miorrelaxante";
```

### 1.2 Tabela de procedimentos (nomes exatos)

Mapa `PROCEDURE_NAME: Record<Condition, string>` com a nomenclatura exata da matriz (ex.: `"Restauração Indireta Estética (Inlay / Onlay / Overlay)"`, `"Implante Dentário Unitário (Fase Cirúrgica)"`, `"Exodontia de Dente Incluso / Semi-Incluso (Siso)"` etc.).

Mapa `CONDITION_LABELS` curto para UI do menu (label visível) — separado do nome do procedimento.

Mapa `CONDITION_SPECIALTY: Record<Condition, Specialty>` para agrupar no menu.

Manter `CONDITION_FILL` e `CONDITION_STROKE` por condição (cores Quiet Luxury: vermelho diagnóstico, azul petróleo para finalizados, dourado para coroa/implante).

### 1.3 Endodontia dinâmica

```ts
export function endodonticProcedureFor(toothNumber: number): Condition {
  const unit = toothNumber % 10;
  if (unit <= 3) return "canal_unirradicular";          // incisivos/caninos/pré-molares 14, 24,34,35,44,45
  if (unit === 15 || unit === 25) return "canal_birradicular"; // pré-molares 15, 25
  return "canal_multirradicular";                        // molares (6,7,8)
}
```

### 1.4 Trigger automático de Siso

```ts
export function isSiso(toothNumber: number): boolean {
  return [18, 28, 38, 48].includes(toothNumber);
}
```

Quando o usuário escolher `exodontia_permanente` em 18/28/38/48 → forçar `exodontia_siso`.

### 1.5 Combos inteligentes

```ts
export type Combo =
  | "reabilitacao_unitaria"   // canal + destruição
  | "implante_unitario"       // ausente + implante
  | "protocolo_arcada";       // arcada ausente total

export function expandCombo(
  combo: Combo,
  toothNumber: number,
): Condition[] {
  switch (combo) {
    case "reabilitacao_unitaria":
      return [
        endodonticProcedureFor(toothNumber),
        "retentor_intrarradicular",
        "coroa_provisoria",
        "coroa_ceramica",
      ];
    case "implante_unitario":
      return ["implante_unitario_cirurgia", "coroa_sobre_implante"];
    case "protocolo_arcada":
      return ["protocolo_cirurgia", "protocolo_protese"];
  }
}
```

Helper `procedureForCondition(c, tooth)` substituído por `resolveProcedures(condition, toothNumber)` que retorna `string[]` (nomes exatos), aplicando:

- endodontia dinâmica quando `condition === "pulpite_necrose"`,
- siso automático quando `exodontia_permanente` em 18/28/38/48,
- expansão de combos.

## 2. `src/components/odontogram/ToothActionMenu.tsx`

Refazer popover glassmorphism com **scroll interno** e seções por especialidade (em vez de 2 colunas fixas):

```text
┌──────────────────────────────────────────┐
│ Dente 36 · oclusal — Diagnóstico Inicial │
├──────────────────────────────────────────┤
│ 🩺 Diagnósticos                           │
│   • Cárie  • Fratura  • Pulpite/Necrose  │
│   • Destruição Coronária  • Ausente      │
│   • Arcada Ausente Total                 │
├──────────────────────────────────────────┤
│ ✨ Dentística & Estética (6 itens)        │
│ 🦷 Endodontia (1 dinâmico + retratamento)│
│ 👑 Prótese & Reabilitação (6)            │
│ 🔩 Implantodontia (6)                    │
│ 📐 Ortodontia (4)                        │
│ 🌿 Periodontia (3)                       │
│ ⚔️  Cirurgia & Disfunção (3)             │
├──────────────────────────────────────────┤
│ ⚡ Combos Inteligentes                    │
│   • Reabilitação Unitária                │
│   • Implante Unitário                    │
│   • Protocolo de Arcada                  │
└──────────────────────────────────────────┘
```

- `Accordion` shadcn (já no projeto) com uma seção por especialidade, padrão recolhido exceto Diagnósticos.
- Largura `w-[420px]`, altura máx `max-h-[70vh] overflow-y-auto`.
- Ícones Lucide por especialidade (Sparkles, Activity, Crown, Anchor, Ruler, Leaf, Scissors).
- Cores: vermelho para Diagnósticos, azul petróleo `#103444` para tratamentos, dourado `#c9a24c` para combos.
- Endodontia mostra **um único item dinâmico** com label "Canal — [tipo detectado para dente N]" + "Retratamento Endodôntico".
- Botão de combo dispara `onSelectCombo(combo)` separado do `onSelect(condition)`.

Props novas:

```ts
onSelectCombo: (combo: Combo) => void;
```

## 3. `src/components/odontogram/useOdontogram.ts`

### 3.1 Mutation `useToggleMark`

Trocar a lógica de "1 procedimento por condição" por loop sobre `resolveProcedures()`:

```ts
const procedureNames = resolveProcedures(input.condition, Number(input.tooth_number));
for (const procName of procedureNames) {
  await ensureTreatment(procName, input);
}
```

### 3.2 Nova mutation `useApplyCombo`

```ts
mutate({ combo, tooth_number, status_type })
  → conditions = expandCombo(combo, tooth)
  → para cada condition: insere marca em patient_odontogram
    + chama ensureTreatment para cada procedureName resolvido
```

### 3.3 Helper `ensureTreatment(procName, ctx)`

```ts
// 1. Busca catálogo (match exato por nome, ilike como fallback)
const { data: catalog } = await supabase
  .from("procedures_catalog")
  .select("default_value")
  .eq("clinic_id", clinicId)
  .eq("name", procName)
  .maybeSingle();

const value = Number(catalog?.default_value ?? 0); // FALLBACK 0.00

// 2. Verifica duplicidade (mesmo paciente + procedimento + dente + planejado)
const { data: existing } = await supabase
  .from("treatments")
  .select("id, status")
  .eq("patient_id", patientId)
  .eq("clinic_id", clinicId)
  .eq("tooth_number", tooth)
  .eq("procedure_type", procName)
  .maybeSingle();

// 3. Insert (planejado) ou Update (executado) conforme status_type
```

Nunca falhar por catálogo ausente — sempre insere com `value=0` para edição manual posterior.

## 4. `src/components/odontogram/IntelligentOdontogram.tsx`

- Passar `onSelectCombo` para `ToothActionMenu`.
- Quando o usuário marcar `arcada_ausente_total`, abrir um confirm rápido perguntando "Aplicar Protocolo Fixo Superior/Inferior em todos os elementos?" e disparar combo `protocolo_arcada` por arcada (cria marcas em todos os dentes da arcada com `condition="ausente"` + gera os 2 procedimentos no orçamento uma única vez).

## 5. Banco de dados

Nenhuma migração nova — `patient_odontogram.condition` e `treatments.procedure_type` são `text` livres. As novas strings entram naturalmente. O catálogo `procedures_catalog` **não** precisa ser populado para destravar — o fallback `0.00` garante isso. Opcional num momento futuro: seed adicional dos novos nomes para preço sugerido.

## 6. Resumo dos arquivos a tocar

```text
src/components/odontogram/odontogramConfig.ts   (reescrita ampla, sem quebrar imports)
src/components/odontogram/ToothActionMenu.tsx   (refatoração visual + accordion + combos)
src/components/odontogram/useOdontogram.ts      (resolveProcedures loop + ensureTreatment + useApplyCombo)
src/components/odontogram/IntelligentOdontogram.tsx (wire-up de onSelectCombo + confirm de arcada)
```

Nenhum outro arquivo é tocado. Tipos do Supabase não mudam.