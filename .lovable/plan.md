

## Plano: Restaurar modulo Financeiro Operacional + Reorganizar navegacao

### Problema

Existe apenas "Financas VEGA" (`/gestao/financas`) que e um dashboard analitico. O modulo operacional de controle financeiro (registrar entradas, saidas, fluxo de caixa, comissoes por cargo) foi perdido. A tabela `financials` ja suporta tudo — falta a interface.

### 1. Nova pagina — `src/pages/Financeiro.tsx`

Pagina operacional com 4 abas (Tabs):

**Aba "Caixa do Dia":**
- Filtro de data (hoje por padrao)
- Lista de movimentacoes (entradas verdes, saidas vermelhas)
- Totalizadores: Total Entradas, Total Saidas, Saldo do Dia
- Botao "Nova Entrada" e "Nova Saida" (dialogs com campos: valor, categoria, descricao, forma de pagamento, status)

**Aba "Receitas":**
- Listagem filtrada por type="entrada" com filtros de periodo e categoria
- CRUD completo (adicionar, editar, excluir)

**Aba "Despesas":**
- Listagem filtrada por type="saida" com filtros de periodo e categoria
- CRUD completo

**Aba "Comissoes":**
- Lista todos os membros da clinica com seus cargos (dentista, sdr, crm, recepcao)
- Para cada membro: producao do periodo, taxa de comissao configurada, valor de comissao calculado
- Status de pagamento (pago/pendente) baseado nos registros de `financials` com category="comissao"
- Botao "Pagar Comissao" que cria registro de saida no financials
- Suporte a comissoes escalonadas: exibir taxa atual e permitir configurar faixas (ex: ate R$10k = 15%, acima = 20%) — armazenado no campo `commission_rate` do `clinic_members` inicialmente, com logica escalonada no frontend

### 2. Sidebar — `AppSidebar.tsx`

Adicionar "Financeiro" no grupo "Minha Clinica" (abaixo de Agenda):
- Icone: `Wallet`
- URL: `/financeiro`
- Cor: `text-gestao`

### 3. Renomear Financas VEGA — `FinancasVega.tsx` + `Gestao.tsx`

- Renomear titulo para "Inteligencia Financeira" (AppLayout title + card no hub Gestao)
- Manter URL `/gestao/financas` e todo o codigo atual intacto

### 4. Rota — `App.tsx`

- Adicionar `/financeiro` → `<Financeiro />`

### Arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `src/pages/Financeiro.tsx` |
| Editar | `src/components/AppSidebar.tsx` — item Financeiro |
| Editar | `src/App.tsx` — rota /financeiro |
| Editar | `src/pages/gestao/FinancasVega.tsx` — renomear titulo |
| Editar | `src/pages/Gestao.tsx` — atualizar card nome |

### Sem migracoes

A tabela `financials` e `clinic_members` ja possuem todos os campos necessarios. Nenhuma alteracao de banco.

### Separacao clara

- **Financeiro** (`/financeiro`): Operacional — registrar, editar, controlar entradas/saidas/comissoes
- **Inteligencia Financeira** (`/gestao/financas`): Analitico — KPIs, graficos, alertas, comparativos

