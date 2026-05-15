# Prescrição Inteligente — Plano de Implementação

Módulo de prescrição médica no prontuário do paciente, com formulário multi-medicamento, IA opcional (Claude) por tier de plano, e geração de PDF profissional.

## 1. Banco de Dados (migration)

Nova tabela `public.prescriptions`:

- `id uuid pk default gen_random_uuid()`
- `clinic_id uuid not null` (multi-tenant)
- `patient_id uuid not null`
- `dentist_user_id uuid` (auth.uid no insert)
- `medications jsonb not null default '[]'` — array de objetos `{ name, usage_type, posology, duration_days }`
- `notes text`
- `created_at timestamptz default now()`

RLS (mesmo padrão das demais tabelas):
- SELECT/INSERT/UPDATE: membros da clínica via `get_user_clinic_ids(auth.uid())`
- DELETE: apenas `dono` via `has_clinic_role`

Índice em `(clinic_id, patient_id, created_at desc)`.

## 2. Permissão por Plano (Tiering)

Hook leve `useAiAccess()` em `src/hooks/useAiAccess.tsx`:

- Versão 1 (entrega imediata): retorna `false` por padrão e lê de `localStorage.getItem("vega_plan") === "pro"` para teste manual; expõe `{ hasAiAccess, plan }`.
- Documenta TODO para evoluir para coluna `clinics.plan` (`basic`/`pro`) numa migration futura, sem bloquear esta entrega.

Quando `hasAiAccess === false`, o botão IA vira um `Button disabled` com ícone `Lock` e tooltip/label "Disponível no Plano Pro".

## 3. UI no prontuário

`src/pages/PacienteDetalhe.tsx` já usa `Tabs`. Adicionar nova aba **"Prescrições"** que renderiza o componente `PrescriptionPanel`.

Novo componente `src/components/prescriptions/PrescriptionPanel.tsx`:

- Lista as prescrições anteriores do paciente (data, nº de medicamentos, botão "Reimprimir PDF").
- Botão primário "Nova Prescrição" abre `PrescriptionForm` (Dialog ou seção inline).

Novo `src/components/prescriptions/PrescriptionForm.tsx`:

- Estado: `medications: Medication[]` (array dinâmico, mínimo 1).
- Por item: `name` (Input), `usage_type` (Select com opções: Interno, Externo, IM, EV, Pomada, Tópico, Solução Oral, Bochecho), `posology` (Textarea), `duration_days` (Input number).
- Botões: "+ Adicionar medicamento", "Remover" (Trash2) por linha.
- Botão "✨ Sugerir Posologia com IA" por linha:
  - Se `hasAiAccess`: chama edge function (item 4).
  - Senão: ícone `Lock` + texto "Plano Pro".
- Ações: "Salvar e Gerar PDF" (insert no Supabase + abre PDF), "Salvar Rascunho" (apenas insert).

Estilo Quiet Luxury: `border border-gold/30`, `rounded-xl`, headings em `text-primary` (Azul Petróleo), botões `variant="default"` e `variant="gold"` para a ação principal. Sem cores hardcoded — usar tokens do design system.

## 4. Integração Claude (IA)

Reusar a edge function existente `claude-ai-service` (já deployada).

Cliente envia `messages: [{ role: "user", content: <prompt> }]` com prompt:

> "Atue como um farmacologista clínico. Para o medicamento [NOME], forneça a posologia padrão odontológica, tipo de uso e duração recomendada seguindo as normas farmacológicas brasileiras. Retorne apenas JSON no formato: `{\"name\": string, \"usage_type\": one of [Interno, Externo, IM, EV, Pomada, Tópico, Solução Oral, Bochecho], \"posology\": string, \"duration_days\": number}`. Sem texto fora do JSON."

Helper `src/lib/prescriptionAi.ts`:
- `suggestPosology(name): Promise<Medication>` — invoca a function via `supabase.functions.invoke("claude-ai-service", { body: { messages } })`, faz `JSON.parse` defensivo do `reply` (extrai bloco JSON via regex se houver texto extra), valida com `zod` contra o enum de `usage_type`.
- Em erro: toast e mantém os campos editáveis.

O dentista sempre pode editar todos os campos preenchidos pela IA antes de salvar. Inclui disclaimer pequeno: "Sugestão de IA — revise antes de prescrever."

## 5. Geração de PDF

Novo `src/utils/prescriptionPdf.ts` usando `jsPDF` (já no projeto via budgetPdf):

Layout A4:
- **Topo**: logo da clínica (`clinics.logo_url`) à esquerda, nome/endereço/telefone à direita; linha dourada fina abaixo.
- **Bloco paciente** centralizado: "RECEITUÁRIO", nome do paciente, CPF, data.
- **Corpo**: lista numerada `1. Nome do medicamento` em negrito, abaixo `Uso: <tipo> · Duração: <X> dias`, depois `Posologia: <texto>` justificado. Espaçamento generoso entre itens.
- **Rodapé**: linha de assinatura, nome do dentista (`profiles.full_name` do `auth.uid()`) + CRO (`clinics.responsible_cro` como fallback), data automática (dd/mm/aaaa), retângulo "Carimbo".
- Tipografia: Helvetica (jsPDF default) com pesos contrastantes; títulos em cor Azul Petróleo `#103444`, detalhes em dourado sutil `#B8964A`.

Função: `generatePrescriptionPdf({ clinic, patient, dentist, prescription }): jsPDF` — abre em nova aba (`doc.output("bloburl")`).

## 6. Fluxo de fallback (Plano Básico)

Sem IA: o formulário continua 100% funcional (todos os campos editáveis, sem atrito), salva no Supabase e gera PDF da mesma forma. O botão IA aparece travado mas não bloqueia nenhuma ação manual.

## Arquivos

Novos:
- `src/hooks/useAiAccess.tsx`
- `src/components/prescriptions/PrescriptionPanel.tsx`
- `src/components/prescriptions/PrescriptionForm.tsx`
- `src/lib/prescriptionAi.ts`
- `src/utils/prescriptionPdf.ts`

Editados:
- `src/pages/PacienteDetalhe.tsx` (nova aba "Prescrições")

Migration:
- Tabela `prescriptions` + RLS + índice.

Sem mudanças em `claude-ai-service` (já operacional).

## Detalhes técnicos

```ts
type UsageType = "Interno" | "Externo" | "IM" | "EV" | "Pomada" | "Tópico" | "Solução Oral" | "Bochecho";
interface Medication {
  name: string;
  usage_type: UsageType;
  posology: string;
  duration_days: number;
}
```

- Validação cliente com `zod` antes do insert.
- React Query: `["prescriptions", patientId]` para listagem; `invalidateQueries` após salvar.
- Tiering por localStorage é provisório e marcado com TODO para futura migration `clinics.plan`.
