

## Plano: Estrutura Interna dos 4 Pilares — VEGA Dental AI

### Visão Geral

Reorganizar cada pilar com módulos e funcionalidades claras, substituindo os cards genéricos atuais por ferramentas estratégicas específicas.

```text
VEGA Dental AI
├── Vendas (/vendas)
│   ├── Perguntas de Decisão ✅ (já existe)
│   ├── Funil de Vendas (novo)
│   ├── Controle de Leads (novo)
│   ├── Taxa de Conversão (novo)
│   └── Follow-up Inteligente (novo)
│
├── Marketing (/marketing)
│   ├── Planejamento de Conteúdo (novo)
│   ├── Leads por Origem (novo)
│   ├── Campanhas (novo)
│   └── Sugestões Estratégicas (novo)
│
├── Gestão (/gestao)
│   ├── Hora Clínica Real ✅ (já existe)
│   ├── Agenda (novo)
│   ├── Financeiro (novo)
│   ├── Pacientes (novo)
│   ├── Equipe (novo)
│   └── Indicadores de Desempenho (novo)
│
└── Autoridade (/autoridade)
    ├── Marca Pessoal (novo)
    ├── Roteiros de Conteúdo (novo)
    ├── Posicionamento Digital (novo)
    └── Presença Online (novo)
```

### Implementação

**1. Atualizar `src/pages/Vendas.tsx`**
- Substituir os 4 cards atuais pelos 5 módulos: Perguntas de Decisão (ativo, link existente), Funil de Vendas, Controle de Leads, Taxa de Conversão, Follow-up Inteligente (marcados "Em breve").

**2. Atualizar `src/pages/Marketing.tsx`**
- Substituir os 4 cards atuais (todos "Em breve") pelos 4 novos módulos: Planejamento de Conteúdo, Leads por Origem, Campanhas, Sugestões Estratégicas.

**3. Atualizar `src/pages/Gestao.tsx`**
- Substituir os 4 cards atuais pelos 6 módulos: Hora Clínica Real (ativo, link existente), Agenda, Financeiro, Pacientes, Equipe, Indicadores de Desempenho.

**4. Atualizar `src/pages/Autoridade.tsx`**
- Substituir os 4 cards atuais pelos 4 novos módulos: Marca Pessoal, Roteiros de Conteúdo, Posicionamento Digital, Presença Online.

### Detalhes Técnicos

- Todos os novos módulos ficam como cards com badge "Em breve" (sem rota ainda), prontos para serem desenvolvidos individualmente quando solicitado.
- Os módulos já existentes (Perguntas de Decisão, Hora Clínica Real) mantêm seus links ativos.
- Ícones e descrições refletem a função estratégica de cada módulo (visão CEO, não gestão tradicional).
- Grid responsivo: 2 colunas em desktop, 1 em mobile. Gestão usa 3 colunas (6 cards).
- Nenhuma rota nova em `App.tsx` neste momento — apenas a estrutura visual.

### Arquivos alterados
- `src/pages/Vendas.tsx`
- `src/pages/Marketing.tsx`
- `src/pages/Gestao.tsx`
- `src/pages/Autoridade.tsx`

