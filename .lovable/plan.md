

## Plano: Modulo Marketing Completo

### Estrutura

A pagina hub `/marketing` vira um menu com 4 subpaginas funcionais, seguindo o mesmo padrao de `/gestao`.

### 1. Migracao de banco de dados

Duas novas tabelas:

**`content_calendar`** — Planejamento de conteudo
```sql
- id, clinic_id, title, content_type (reels/story/post/video),
  theme, status (planejado/em_producao/postado),
  scheduled_date, notes, created_at
```

**`campaigns`** — Campanhas de marketing
```sql
- id, clinic_id, name, channel (instagram/google/whatsapp/facebook/outros),
  start_date, end_date, investment, status (ativa/finalizada),
  leads_generated, sales_closed, notes, created_at
```

RLS: membros podem ver/inserir/atualizar, donos podem deletar (padrao do projeto).

### 2. Paginas

**`src/pages/Marketing.tsx`** — Hub com 4 cards linkando para subpaginas (remover `soon: true`)

**`src/pages/marketing/PlanejamentoConteudo.tsx`**
- Calendario mensal visual (grid 7 colunas)
- Cadastro de conteudo: tipo, tema, status, data, observacao
- Filtro por semana/mes
- Badges coloridos por status (cinza=planejado, amarelo=producao, verde=postado)

**`src/pages/marketing/LeadsOrigem.tsx`**
- Query `patients` + `leads` agrupando por `origin`
- Ranking de origens por quantidade de leads
- Grafico de barras (Recharts) origem vs quantidade
- Faturamento por origem (cruzando patients com financials/treatments)

**`src/pages/marketing/Campanhas.tsx`**
- CRUD de campanhas com dialog
- Lista com status, investimento, leads gerados, vendas fechadas
- Calculo de ROI: (vendas - investimento) / investimento

**`src/pages/marketing/SugestoesEstrategicas.tsx`**
- Analise automatica baseada nos dados existentes:
  - Conta leads por origem → identifica melhor e pior canal
  - Verifica frequencia de conteudo → sugere aumentar se baixa
  - Verifica campanhas ativas → sugere criar se nenhuma
  - Verifica taxa de conversao do funil → sugere acoes
- Cards com icones e links para acao (ex: "Ir para Funil", "Criar Campanha")

### 3. Rotas e navegacao

**`src/App.tsx`** — 4 novas rotas: `/marketing/conteudo`, `/marketing/leads-origem`, `/marketing/campanhas`, `/marketing/sugestoes`

**`src/pages/Marketing.tsx`** — Cards com urls apontando para subpaginas

### Arquivos

| Acao | Arquivo |
|------|---------|
| Migracao | 1 SQL (content_calendar + campaigns + RLS) |
| Editar | `src/pages/Marketing.tsx` (hub com links) |
| Criar | `src/pages/marketing/PlanejamentoConteudo.tsx` |
| Criar | `src/pages/marketing/LeadsOrigem.tsx` |
| Criar | `src/pages/marketing/Campanhas.tsx` |
| Criar | `src/pages/marketing/SugestoesEstrategicas.tsx` |
| Editar | `src/App.tsx` (4 rotas) |

### Dados utilizados

- **Leads por Origem**: query `patients.origin` + `leads.origin` (dados ja existem)
- **Sugestoes**: cruza `leads`, `patients`, `sales_funnel`, `content_calendar`, `campaigns`
- **Conteudo e Campanhas**: tabelas novas com CRUD completo

