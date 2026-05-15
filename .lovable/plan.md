## Histórico de Atendimentos (Evolução Clínica)

Nova aba **"Evolução"** no prontuário do paciente, com timeline vertical de atendimentos clínicos e editor rich text para registro rápido durante a consulta.

### 1. Banco de dados

Nova tabela `public.patient_history`:

- `id uuid pk default gen_random_uuid()`
- `clinic_id uuid not null` (multi-tenant)
- `patient_id uuid not null`
- `dentist_user_id uuid` (auth.uid no insert — quem realizou)
- `content text not null` (HTML do rich text)
- `summary text` (primeiros ~120 chars sem HTML, gerado no client para a listagem)
- `created_at timestamptz default now()` (data/hora automática)
- `updated_at timestamptz default now()`

RLS no padrão das outras tabelas:
- SELECT/INSERT/UPDATE: membros via `get_user_clinic_ids(auth.uid())`
- DELETE: apenas `dono` via `has_clinic_role`

Trigger `update_updated_at_column` em UPDATE. Índice `(clinic_id, patient_id, created_at desc)`.

### 2. Rich text editor

Adicionar `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-placeholder`. Componente `src/components/history/RichTextEditor.tsx` com toolbar mínima (Bold, Italic, Bullet list, Numbered list, Undo) — visualmente Quiet Luxury (borda `border-gold/30`, `rounded-xl`, foco em `ring-primary/30`). Output: HTML.

### 3. UI no prontuário

Em `src/pages/PacienteDetalhe.tsx`, adicionar nova aba **"Evolução"** ao lado de "Prescrições", renderizando `<HistoryPanel patientId clinicId />`.

Novo `src/components/history/HistoryPanel.tsx`:
- Header com título "Evolução Clínica" (font-display, `text-primary`) + botão primário **"+ Novo Atendimento"**.
- Ao clicar, abre form inline (collapsible, no topo da timeline) com:
  - Editor rich text (placeholder: "Descreva o que foi realizado nesta sessão...").
  - Botões "Cancelar" e "Salvar Atendimento" (variant `gold`).
  - Data/hora atual exibida em texto sutil — apenas display, gravada automaticamente no insert.
- Após salvar: invalida React Query, fecha o form, toast de sucesso.

Novo `src/components/history/HistoryTimeline.tsx`:
- Lista vertical ordenada por `created_at desc`.
- Linha vertical fina (`border-l border-gold/20`) à esquerda, com bullet circular dourado por item.
- Cada `HistoryEntryCard`:
  - Topo: data formatada (`dd 'de' MMMM 'de' yyyy · HH:mm`, ptBR) em `text-xs text-muted-foreground tracking-wide uppercase`.
  - Nome do dentista responsável (lookup via `profiles.full_name` do `dentist_user_id`) em `text-sm text-primary font-medium`.
  - Conteúdo HTML renderizado dentro de `prose prose-sm max-w-none` (tipografia generosa, line-height alto).
  - Card: `rounded-xl border border-border/60 bg-card p-6 ml-6` com hover sutil.
- Empty state: ícone `ClipboardList` + "Nenhum atendimento registrado ainda."
- Loading: 3 skeletons.

### 4. Queries

React Query keys:
- `["patient-history", patientId]` — SELECT join lógico via segunda query em `profiles` (id, full_name) para mapear `dentist_user_id → nome`. Alternativa simples: `useQuery` separado `["profiles", clinicId]` cacheado, e mapeia no client.
- `useMutation` para insert: `{ clinic_id, patient_id, dentist_user_id: auth.uid(), content, summary }`. `invalidateQueries` no sucesso.

### 5. Design Quiet Luxury

- Tokens existentes: `text-primary` (Azul Petróleo), `border-gold/20-30`, `rounded-xl`, `font-display` para títulos, `font-sans` para corpo.
- Espaçamento generoso: `space-y-6` entre cards, `p-6` interno, `leading-relaxed`.
- Sem cores hardcoded. Botão principal em `variant="gold"`.

### Arquivos

Novos:
- `src/components/history/RichTextEditor.tsx`
- `src/components/history/HistoryPanel.tsx`
- `src/components/history/HistoryTimeline.tsx`
- `src/components/history/HistoryEntryCard.tsx`

Editados:
- `src/pages/PacienteDetalhe.tsx` (nova aba "Evolução")

Migration:
- Tabela `patient_history` + RLS + trigger updated_at + índice.

Dependências:
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`.

### Não incluído nesta entrega

- Edição/exclusão de entradas (apenas leitura + criação). Pode ser adicionado depois com confirmação.
- Anexos de imagens/arquivos por atendimento.
- Vínculo automático com `appointments` (futuramente: criar entrada de evolução a partir de uma consulta concluída).