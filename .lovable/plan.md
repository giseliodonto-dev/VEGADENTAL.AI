

## Plano: Agenda VEGA — Migração + Interface Semanal

### 1. Migração de banco de dados

Adicionar à tabela `appointments`:
- `procedure_type` (text, nullable)
- `estimated_value` (numeric, default 0)
- Alterar default de `status` de `'confirmado'` para `'agendado'`

```sql
ALTER TABLE public.appointments
  ADD COLUMN procedure_type text,
  ADD COLUMN estimated_value numeric DEFAULT 0;
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'agendado';
```

### 2. Criar página da Agenda (`src/pages/gestao/AgendaVega.tsx`)

Interface com visão semanal contendo:

- **Navegação semanal**: botões `<` `>` para navegar entre semanas, botão "Hoje"
- **Filtro por profissional**: dropdown com dentistas da clínica (query `clinic_members` + `profiles` WHERE role = 'dentista' ou 'dono')
- **KPIs da semana**: Ocupação (%), Produção estimada (R$), Taxa de faltas (%), Slots livres
- **Grade semanal**: colunas = dias da semana (Seg-Sáb), linhas = horários (08h-18h, intervalos de 1h). Slots ocupados mostram nome do paciente + procedimento + badge de status. Slots livres são clicáveis `[+]`
- **Alertas inteligentes**: cards com sugestões baseadas em ocupação baixa, faltas, slots livres
- **Dialog de novo agendamento**: ao clicar em slot livre, abre form pré-preenchido com data/hora, campos: paciente (select), procedimento, valor estimado, profissional, duração, observações
- **Dialog de detalhes**: ao clicar em slot ocupado, mostra detalhes com botões de ação (confirmar, atender, faltou, remarcar, cancelar)

Capacidade diária assumida: 8 slots/dia (configurável como constante).

### 3. Atualizar rotas (`src/App.tsx`)

- Importar `AgendaVega` e adicionar rota `/gestao/agenda`

### 4. Atualizar sidebar (`src/components/AppSidebar.tsx`)

- Não necessário — acesso via página Gestão

### 5. Atualizar página Gestão (`src/pages/Gestao.tsx`)

- Alterar card "Agenda": remover `soon: true`, definir `url: "/gestao/agenda"`

### Detalhes técnicos

- Query de appointments filtra por `clinic_id` + range de datas da semana visível
- Join com `patients` para nome e com `profiles` (via `dentist_user_id`) para nome do profissional
- Status com cores: `agendado` (azul), `confirmado` (verde), `atendido` (cinza/check), `faltou` (vermelho), `remarcado` (amarelo), `cancelado` (cinza)
- Atualização de status via mutation com `useQueryClient().invalidateQueries`
- Mobile: mostra 1 dia por vez com botões de navegação

