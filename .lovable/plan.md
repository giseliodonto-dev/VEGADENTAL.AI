

## Plano: Limpar páginas OdontoGest

Resetar 6 páginas para estrutura vazia (placeholder), mantendo VEGA GPS intacto.

### Páginas a limpar

| Página | Arquivo | Ação |
|--------|---------|------|
| Dashboard | `src/pages/Index.tsx` | Remover cards, métricas, gráficos. Deixar título e placeholder "Conteúdo em breve" |
| Pacientes | `src/pages/Pacientes.tsx` | Remover tabela e dados mock. Placeholder vazio |
| Agenda | `src/pages/Agenda.tsx` | Remover calendário/eventos. Placeholder vazio |
| Financeiro | `src/pages/Financeiro.tsx` | Remover transações e gráficos. Placeholder vazio |
| Equipe | `src/pages/Equipe.tsx` | Remover lista de membros. Placeholder vazio |
| Configurações | `src/pages/Configuracoes.tsx` | Remover formulários. Placeholder vazio |

### Resultado

Cada página ficará com o `AppLayout`, título correto e um card central com ícone + texto "Em construção — novas ideias em breve", pronto para receber conteúdo novo. Sidebar e rotas permanecem inalteradas.

### Não será alterado
- Todas as páginas VEGA GPS (Vendas, Marketing, Gestão, Finanças, Atendimento, Processos, Pessoas, Autoridade, Perguntas de Decisão, Hora Clínica)
- AppLayout, AppSidebar, NavLink
- Rotas em App.tsx

