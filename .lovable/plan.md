

## Plano: VEGA Academy — Ferramenta de Performance

### Conceito

Pagina `/academy` com videos curtos organizados por categoria. Conteudo hardcoded inicialmente (sem tabela no banco), com sugestoes contextuais baseadas em dados reais da clinica.

### 1. Sidebar — `src/components/AppSidebar.tsx`

Adicionar item "Academy" no grupo principal (abaixo de "Inteligencia VEGA"):
- Icone: `GraduationCap`
- URL: `/academy`
- Cor: `text-gold`

### 2. Nova pagina — `src/pages/Academy.tsx`

**Layout:**
- AppLayout com title "VEGA Academy" e subtitle "Treinamentos rapidos para sua equipe"
- Hero compacto com gradiente sutil + headline motivacional
- Filtro por categorias (tabs ou chips): "Como usar o VEGA", "Vendas", "Marketing", "Gestao de Equipe", "Crescimento"
- Grid de video cards (responsivo: 1-3 colunas)

**Video Card:**
- Thumbnail placeholder com gradiente da cor da categoria + icone
- Badge de duracao (ex: "0:45")
- Titulo (bold)
- Descricao curta (1 linha)
- Botao Play (abre dialog com player embed ou placeholder)

**Dados (hardcoded):**
- ~12-15 videos distribuidos nas 5 categorias
- Cada video: `{ id, title, description, duration, category, videoUrl? }`
- URLs de video podem ser placeholders (YouTube embeds futuros)

**Secao "Sugerido para voce":**
- Cards destacados no topo baseados em contexto:
  - Query `sales_funnel` para pacientes parados → sugere video de vendas
  - Query `agenda` para dias vazios → sugere video de marketing
  - Sem leads recentes → sugere video de captacao
- Se nao houver dados suficientes, mostra "Comece por aqui" com videos da categoria "Como usar o VEGA"

### 3. Rota — `src/App.tsx`

Adicionar rota protegida `/academy` → `<Academy />`

### Arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `src/pages/Academy.tsx` |
| Editar | `src/components/AppSidebar.tsx` — item Academy |
| Editar | `src/App.tsx` — rota /academy |

### Detalhes tecnicos

- Videos hardcoded em array constante (sem tabela no banco por enquanto)
- Sugestoes contextuais: 2-3 queries leves ao banco (funnel stagnation, agenda gaps, leads count)
- Dialog com iframe para YouTube ou player nativo futuro
- Cards com hover premium (`.card-hover` existente)
- Categorias com cores mapeadas aos pilares: Vendas (text-vendas), Marketing (text-marketing), Gestao (text-gestao), etc.

