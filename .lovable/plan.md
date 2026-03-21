

## Plano: Módulo VEGA GPS — Painel Central de Direção

### O que será criado

Uma nova página `/gps` que funciona como cockpit estratégico da clínica, agregando dados de Leads, Pacientes, Funil de Vendas, Agenda, Financeiro e Metas em uma interface visual com alertas e direcionamentos.

### Estrutura da página

```text
/gps
├── Barra de status (faturamento vs meta — barra de progresso)
├── KPIs principais (4 cards)
│   ├── Faturamento do Mês
│   ├── Taxa de Conversão (%)
│   ├── Pacientes em Negociação
│   └── Ticket Médio
├── Alertas Inteligentes (cards de alerta com ações)
│   ├── "Abaixo da meta em X%"
│   ├── "X pacientes parados no funil"
│   ├── "X leads sem contato"
│   └── "Agenda com horários vagos"
├── Direcionamentos (ações sugeridas com botões)
│   ├── "Ligue para X pacientes"
│   ├── "Reative X leads"
│   └── "Preencha agenda com follow-up"
└── Mini-resumos por pilar (Vendas, Marketing, Gestão, Autoridade)
```

### Fonte dos dados (queries ao banco)

- **Faturamento**: `financials` WHERE `type = 'entrada'` no mês atual
- **Meta**: `goals` do mês atual
- **Conversão**: `sales_funnel` — ratio de `fechado` vs total
- **Pacientes em negociação**: `sales_funnel` WHERE stage NOT IN ('fechado', 'perdido')
- **Ticket médio**: média de `value` em `sales_funnel` WHERE stage = 'fechado'
- **Parados no funil**: `sales_funnel` WHERE `updated_at` < 7 dias
- **Leads sem contato**: `leads` WHERE status = 'novo'
- **Agenda vazia**: `appointments` do dia vs capacidade esperada
- **Taxa de faltas**: `appointments` WHERE status = 'faltou'

### Arquivos

1. **Criar `src/pages/VegaGPS.tsx`**
   - Dashboard com queries usando `useClinic()` para filtrar por clinic_id
   - KPIs calculados em tempo real
   - Alertas gerados por lógica condicional (thresholds)
   - Botões de ação que linkam para `/leads`, `/vendas/follow-up`, `/vendas/funil`
   - Acesso restrito a role `dono` (verificado via `useAuth`)

2. **Editar `src/App.tsx`**
   - Adicionar rota `/gps` protegida

3. **Editar `src/components/AppSidebar.tsx`**
   - Adicionar "VEGA GPS" com ícone `Compass` logo após "Início"

4. **Editar `src/pages/Home.tsx`**
   - Adicionar card de destaque "VEGA GPS" acima dos pilares

### Detalhes Técnicos

- Sem alteração de schema — todas as tabelas já existem
- Usa `useQuery` do React Query para cada agrupamento de dados
- Alertas são calculados no frontend com base nos dados carregados
- Thresholds configuráveis: meta < 80% = alerta, funil parado > 7 dias, leads novos > 3 dias sem ação
- Interface usa cards com cores semânticas: verde (bom), amarelo (atenção), vermelho (crítico)

