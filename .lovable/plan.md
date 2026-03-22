

## Plano: Finanças VEGA — Análise Estratégica Financeira

### Contexto

O módulo **não é** para registrar dados (isso já existe na tabela `financials`). É uma página de **análise e inteligência financeira** que cruza dados de `financials`, `appointments`, `sales_funnel` e `goals` para gerar indicadores, comparativos e direcionamentos.

### Estrutura da página `/gestao/financas`

```text
/gestao/financas
├── Seletor de período (mês atual / mês anterior / comparativo)
├── KPIs principais (6 cards)
│   ├── Faturamento (entradas status=pago)
│   ├── Despesas (saídas status=pago)
│   ├── Lucro Bruto (faturamento - despesas diretas)
│   ├── Lucro Líquido (faturamento - todas despesas)
│   ├── Margem de Lucro (%)
│   └── Ticket Médio
├── Comparativo mês atual vs anterior
│   ├── Barras lado a lado (faturamento, despesas, lucro)
│   ├── Indicador de crescimento/queda (%)
├── Análise por categoria
│   ├── Top categorias de despesa (pizza ou barras)
│   ├── Top categorias de receita
├── Receita por dentista (barra horizontal)
├── Alertas estratégicos
│   ├── "Margem abaixo de 30%"
│   ├── "Lucro abaixo da meta"
│   ├── "Custos cresceram X% vs mês anterior"
│   ├── "Ocupação da agenda impactando receita"
├── Direcionamentos (ações sugeridas com links)
│   ├── "Aumente conversão" → /vendas/funil
│   ├── "Melhore ocupação" → /gestao/agenda
│   ├── "Reduza custos de X categoria"
│   └── "Ajuste preços" → /gestao/hora-clinica
└── Visão estratégica (frase-resumo)
    └── "Você está lucrando" / "Apenas pagando contas" / "Operando no prejuízo"
```

### Fonte dos dados (queries)

- **Faturamento**: `financials` WHERE `type='entrada'` AND `status='pago'` no mês
- **Despesas**: `financials` WHERE `type='saida'` AND `status='pago'` no mês
- **Mês anterior**: mesmas queries com range do mês anterior
- **Meta de lucro**: `goals` WHERE `month` = mês atual
- **Receita por dentista**: `appointments` WHERE `status='atendido'` JOIN `estimated_value`, agrupado por `dentist_user_id`
- **Ticket médio**: faturamento total / número de entradas distintas
- **Ocupação**: `appointments` do mês para correlação agenda vs receita

### Cálculos

| Indicador | Fórmula |
|---|---|
| Lucro Bruto | Faturamento - Despesas operacionais (materiais, laboratório) |
| Lucro Líquido | Faturamento - Todas as Despesas |
| Margem (%) | (Lucro Líquido / Faturamento) × 100 |
| Ticket Médio | Faturamento / Qtd entradas |
| Crescimento (%) | ((Atual - Anterior) / Anterior) × 100 |

### Thresholds para alertas

- Margem < 30% → alerta vermelho
- Margem 30-50% → alerta amarelo
- Lucro abaixo da meta → alerta vermelho
- Despesas cresceram > 10% vs mês anterior → alerta amarelo
- Ocupação agenda < 50% → alerta (correlação receita)

### Visão estratégica (frase-resumo)

- Margem > 50%: "Sua clínica está lucrando bem"
- Margem 30-50%: "Margem saudável, mas há espaço para crescer"
- Margem 15-30%: "Você está pagando contas, mas sobrando pouco"
- Margem < 15%: "Atenção: operando com margem crítica"
- Lucro negativo: "Prejuízo operacional — ação urgente necessária"

### Arquivos

1. **Criar `src/pages/gestao/FinancasVega.tsx`** — Página de análise com queries, KPIs, gráficos (Recharts), alertas e direcionamentos
2. **Editar `src/App.tsx`** — Rota `/gestao/financas`
3. **Editar `src/pages/Gestao.tsx`** — Atualizar card "Financeiro": `url: "/gestao/financas"`, remover `soon: true`

### Detalhes técnicos

- Sem migração — todos os dados já existem
- Gráficos com Recharts (já disponível no projeto via `chart.tsx`)
- Queries com `useQuery` filtrando por `clinicId` via `useClinic()`
- Acesso restrito a role `dono` (consistente com RLS de `financials` e `goals`)
- Categorias de despesa agrupadas com `GROUP BY category`
- Mobile: KPIs em 2 colunas, gráficos empilhados

### Conexão com outros módulos

- **VEGA GPS**: já mostra faturamento; Finanças aprofunda com margem, lucro e comparativo
- **Inteligência VEGA**: edge function já consulta `financials`; Finanças dá a visão detalhada
- **Hora Clínica**: direcionamento "ajuste preços" linka para `/gestao/hora-clinica`
- **Agenda**: correlação ocupação vs receita gerada

