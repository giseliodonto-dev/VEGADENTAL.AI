

## Objetivo

Liberar visualmente os horários da Agenda quando um agendamento for **cancelado** ou **remarcado**, mantendo os registros no banco para histórico/KPIs. Ajustar o fluxo de "Remarcar" para abrir um novo agendamento na nova data e marcar o antigo como `remarcado`.

## Diagnóstico

- Os status reais no código são: `confirmado`, `faltou`, `remarcado`, `cancelou` (a tabela `appointments` aceita texto livre — sem CHECK constraint).
- Hoje a query da agenda traz **todos** os status, então `cancelou` e `remarcado` ainda aparecem ocupando a célula da grade (com estilo riscado/amarelo).
- KPIs (`activeAppts`) já filtram `cancelou`, mas **não filtram `remarcado`**. Vou incluir.
- Não há fluxo dedicado de "Remarcar" — clicar em "Remarcado" hoje só muda o status. Vou transformar em ação composta.

## Mudanças (apenas em `src/pages/gestao/AgendaVega.tsx`)

### 1. Filtro de exibição na query
Na `useQuery` de `agenda` (linha 109), adicionar:
```ts
.not("status", "in", "(cancelou,remarcado)")
```
Resultado: cancelados e remarcados deixam de ser carregados na grade. A célula fica visualmente livre e clicável para novo agendamento.

### 2. KPIs e ocupação
- `activeAppts` (linha 221) passa a filtrar **ambos** `cancelou` e `remarcado` (já que a query agora exclui, o filtro vira redundante mas mantenho como defesa).
- "Slots Livres" passa a refletir corretamente os horários liberados.

### 3. Botão "Remarcado" no diálogo de detalhes — vira ação de remarcação
Substituir o botão simples atual (linha 570-575) por um fluxo:
1. Atualiza o agendamento atual para `status = 'remarcado'` (preserva histórico).
2. Fecha o diálogo de detalhes.
3. Pré-preenche `newForm` com os dados do agendamento original (paciente, dentista, procedimento, valor, duração, observações).
4. Abre o diálogo de **Novo Agendamento** com `selectedSlot` apontando para a mesma data/hora — o usuário troca para a nova data/hora desejada antes de salvar.

Para permitir trocar data/hora no diálogo de novo agendamento, adicionar dois inputs (`date` e `time`) no formulário quando o slot for de remarcação. Hoje o diálogo só mostra a data/hora como texto fixo — vou permitir edição via dois `<Input type="date">` e `<Input type="time">` dentro do dialog.

### 4. Disponibilidade ao clicar em célula
Como a query já exclui cancelados/remarcados, `apts.length === 0` voltará `true` nessas células — o clique abre o diálogo de novo agendamento normalmente. Nenhuma checagem extra de disponibilidade é necessária (não existe lock de slot no app hoje).

### 5. Histórico preservado
Nada é deletado. Os registros com `status = cancelou` e `status = remarcado` continuam no banco e podem ser usados em qualquer relatório/KPI futuro de cancelamento (ex: já dá para query separada por `status` em outras telas como Inteligência ou GPS).

## Arquivo alterado

| Arquivo | Mudança |
|---|---|
| `src/pages/gestao/AgendaVega.tsx` | Filtrar `cancelou` e `remarcado` da query da grade; transformar botão "Remarcado" em fluxo de remarcação (status antigo → `remarcado` + abre novo agendamento com dados pré-preenchidos e data/hora editáveis) |

## O que NÃO muda

- Schema do banco, RLS, outras telas.
- Status `confirmado` e `faltou` continuam visíveis na grade (faltas precisam ficar visíveis para gestão do dia).
- Helper `openWhatsApp` e demais botões.
- Registros no banco — tudo preservado para KPIs futuros.

