

## Plano: Mover "Cadastro Rápido" para fora do grupo "Minha Clínica"

### O que será feito

Reorganizar a sidebar para que o grupo "Minha Clínica" contenha apenas Clínicas, Usuários e Pacientes. O "Cadastro Rápido" ficará como item independente, logo após o grupo "Minha Clínica" e antes dos "Pilares Estratégicos".

### Estrutura final da sidebar

```text
├── Início
├── Cadastro Rápido          ← item solto, fora de grupos
├── ── Minha Clínica ─────
│   ├── Clínicas
│   ├── Usuários
│   └── Pacientes
├── ── Pilares Estratégicos ──
│   ├── Vendas
│   ├── Marketing
│   ├── Gestão
│   └── Autoridade
├── Configurações
└── Sair
```

### Arquivo

**Editar `src/components/AppSidebar.tsx`**
- Criar grupo sem label para Início + Cadastro Rápido
- Criar grupo "Minha Clínica" com Clínicas, Usuários, Pacientes
- Manter grupo "Pilares Estratégicos" inalterado

