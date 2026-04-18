

O usuário está confuso porque existem **duas páginas** parecidas: "Equipe" e "Usuários" (ou similar). Preciso confirmar antes de planejar.

Vou verificar no AppSidebar quais rotas existem.

Pelas rotas conhecidas: `/gestao/equipe` (EquipeVega.tsx) e `/configuracoes` (Configuracoes.tsx) — provavelmente Configurações tem aba de usuários/membros também. Ou pode ser `/clinicas`.

## Plano de investigação + consolidação

### 1. Mapear duplicação
Vou abrir:
- `src/components/AppSidebar.tsx` — ver itens de menu
- `src/pages/Configuracoes.tsx` — ver se tem gestão de membros
- `src/pages/Clinicas.tsx` — ver se gerencia usuários

### 2. Decidir fonte única
Manter **apenas `/gestao/equipe`** como tela única de gestão de colaboradores (convites + membros ativos + roles). Remover qualquer duplicação em Configurações ou Clínicas.

### 3. Ações concretas
- Remover seção/aba duplicada da página redundante
- Adicionar link/atalho da página antiga apontando para `/gestao/equipe`
- Garantir que o sidebar tenha **apenas um item** "Equipe" (ou "Colaboradores")

### 4. Cancelar convites pendentes (pendência anterior)
Executar `UPDATE invites SET status='cancelled' WHERE status='pending'` via ferramenta de insert/migração para limpar a lista atual.

### Arquivos prováveis

| Arquivo | Mudança |
|---|---|
| `src/components/AppSidebar.tsx` | Remover item duplicado de menu |
| `src/pages/Configuracoes.tsx` ou `Clinicas.tsx` | Remover aba/seção de membros, deixar só link para /gestao/equipe |
| Banco | UPDATE invites cancelando pendentes |

Antes de implementar, preciso confirmar **qual** é a outra página que você está chamando de "Usuários" — pode ser Configurações, Clínicas, ou outra. Vou abrir os arquivos do sidebar para identificar com certeza assim que aprovar.

