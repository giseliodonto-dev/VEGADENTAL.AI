

## Plano: Agenda VEGA Multi-Dentista

### Problema atual

O `appointmentMap` usa chave `date_hour` → apenas 1 agendamento por horário. Quando há múltiplos dentistas, vários atendimentos podem ocorrer no mesmo horário. Além disso, os KPIs calculam ocupação considerando slots fixos sem levar em conta o número de dentistas.

### O que será alterado

**Não há migração necessária** — a tabela `appointments` já tem `dentist_user_id`. Apenas mudanças no frontend.

### Alterações em `src/pages/gestao/AgendaVega.tsx`

1. **AppointmentMap multi-dentista**
   - Chave passa de `date_hour → 1 appointment` para `date_hour → Appointment[]` (array)
   - Grid mostra múltiplos cards empilhados no mesmo slot, cada um com badge do dentista

2. **KPIs ajustados ao número de dentistas**
   - `totalSlots = DAYS_COUNT × SLOTS_PER_DAY × numDentists` (quando filtro = "todos")
   - Quando filtro por dentista específico: `totalSlots = DAYS_COUNT × SLOTS_PER_DAY`
   - Ocupação e slots livres recalculados proporcionalmente

3. **Alertas por dentista**
   - Agrupar appointments por `dentist_user_id`
   - Calcular ocupação individual de cada dentista
   - Gerar alertas: "Dr. X está com agenda ociosa (20%)" ou "Dra. Y com alta demanda (95%)"
   - Threshold: < 40% = ocioso, > 85% = sobrecarregado

4. **Visual do grid multi-dentista**
   - Quando filtro = "todos": cada célula pode ter múltiplos cards empilhados (mini-cards com nome do dentista + paciente)
   - Quando filtro = dentista específico: comportamento atual (1 card por slot)
   - Cards com cor de borda ou iniciais do dentista para diferenciar visualmente

5. **Mobile: mesma lógica**
   - Slots mostram lista de agendamentos do horário ao invés de apenas 1

### Estrutura final

```text
Filtro: [Todos] → grid com múltiplos cards por slot, KPIs da clínica
Filtro: [Dr. João] → grid com 1 card por slot, KPIs do Dr. João

Alertas:
├── "Dr. João está com 25% de ocupação — Agendar follow-ups"
├── "Dra. Maria com 90% — Redistribuir pacientes"
└── "3 horários sem nenhum dentista alocado"
```

### Arquivo

- **Editar `src/pages/gestao/AgendaVega.tsx`** — Todas as mudanças concentradas neste arquivo

