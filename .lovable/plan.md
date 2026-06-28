## Objetivo

Transformar a aba **Evolução Clínica** em um registro puramente clínico, desacoplado de qualquer lógica financeira. O dentista escreve a nota, marca um ou mais procedimentos do Plano de Tratamento e, ao salvar, esses procedimentos são automaticamente marcados como **Concluído** em uma operação atômica.

---

## 1. Banco de dados (migration)

### 1.1. Nova tabela de vínculo N:N
`patient_history` hoje aceita apenas um `treatment_id` e carrega `executed_value`. Vou criar uma tabela de junção e remover a dependência financeira da evolução:

```text
patient_history_treatments
├── id (uuid, pk)
├── history_id (uuid → patient_history.id, on delete cascade)
├── treatment_id (uuid → treatments.id, on delete cascade)
└── unique(history_id, treatment_id)
```

GRANTs + RLS espelhando `patient_history` (membros da mesma clínica).

### 1.2. Limpeza semântica em `patient_history`
- Manter `treatment_id` por compatibilidade com registros antigos (read-only), mas novos inserts não o usam.
- Zerar/ignorar `executed_value` na UI (continua na tabela para histórico, mas nunca mais é escrito nem exibido).

### 1.3. RPC atômica
Função `record_clinical_evolution(_patient_id, _content, _summary, _treatment_ids uuid[])`:
- Em uma única transação: insere em `patient_history`, insere N linhas em `patient_history_treatments`, faz `UPDATE treatments SET status='executado' WHERE id = ANY(_treatment_ids) AND patient_id = _patient_id`.
- Valida que todos os `treatment_ids` pertencem ao paciente e à clínica do `auth.uid()` via `is_clinic_member`.
- Retorna o `history_id` criado. `SECURITY DEFINER`, `search_path=public`.

Isso garante atomicidade (todo o conjunto sobe ou nada sobe) sem precisar de transação no cliente.

### 1.4. Índices para paginação
- `idx_patient_history_patient_created` em `(patient_id, created_at DESC)`.
- `idx_pht_history` em `patient_history_treatments(history_id)`.

---

## 2. Frontend

### 2.1. `src/components/history/HistoryPanel.tsx` — refatoração completa
Remover:
- Card de "Saldo de Créditos Pagos".
- Query de `financials`.
- Cálculo de saldo, alertas de "saldo insuficiente", exibição de valor abatido.
- Select de procedimento único.

Adicionar:
- Lista de **checkboxes** com os procedimentos elegíveis do plano (status `aprovado`, `planejado`, `em_andamento`) agrupados visualmente, com dente e categoria — sem exibir valor.
- Campo Textarea para a nota clínica (mantém o estilo atual).
- Botão "Salvar Evolução" chama `supabase.rpc('record_clinical_evolution', { ... })`.
- Após sucesso: invalidar `patient-history` e `treatments` (não tocar em `patient-financials`).

### 2.2. Paginação
- Query paginada com `range()` do Supabase, 10 entradas por página.
- Botões "Carregar mais" (estilo Quiet Luxury, infinito acumulado via `useInfiniteQuery` do React Query).
- Buscar `patient_history_treatments` + join com `treatments` apenas para as entradas carregadas (uma query auxiliar por página, ou embedded select `patient_history_treatments(treatment:treatments(*))`).

### 2.3. `HistoryEntryCard.tsx` e `HistoryTimeline.tsx`
- Remover badge "Saldo abatido" e prop `executedValue`.
- Substituir `procedureLabel` único por **lista de chips** (um por procedimento vinculado), cada chip com ícone `Stethoscope`, nome e dente.
- Manter: data, autor, conteúdo da nota, bullet dourado da timeline.

### 2.4. Compatibilidade com entradas legadas
Para entradas antigas (`treatment_id` direto, sem registro em `patient_history_treatments`), fallback: se a junção vier vazia mas existir `treatment_id`, exibir um único chip a partir desse campo. Sem exibir valor financeiro mesmo nas antigas.

---

## 3. Padrão visual (Quiet Luxury)

- Lista de procedimentos elegíveis: cards leves com `border-border/60`, hover sutil, check dourado quando selecionados.
- Chips na timeline: `border border-primary/20 bg-primary/5 text-primary` (sem dourado, reservado para destaques financeiros que aqui não existem).
- Bullet da timeline e botão primário continuam em `gold` para manter a assinatura visual da seção.
- Nenhum elemento financeiro (R$, "saldo", "abatido", "crédito") aparece nesta aba.

---

## 4. Detalhes técnicos

- **Atomicidade**: garantida pela RPC `record_clinical_evolution` — uma única chamada, uma única transação Postgres.
- **Performance**: índice composto `(patient_id, created_at DESC)` + paginação por range + `useInfiniteQuery` evita recarregar entradas já vistas.
- **Isolamento financeiro**: a aba não lê nem escreve `financials`; `executed_value` deixa de ser populado.
- **Multi-tenant**: RPC valida `clinic_id` via `is_clinic_member(auth.uid(), patient.clinic_id)` antes de qualquer escrita.

---

## 5. Arquivos afetados

```text
supabase/migrations/<novo>.sql          (nova)
src/components/history/HistoryPanel.tsx (reescrito)
src/components/history/HistoryTimeline.tsx (props ajustadas)
src/components/history/HistoryEntryCard.tsx (chips multi, sem $)
```

Sem mudanças em: prescrições, documentos, odontograma, financeiro.
