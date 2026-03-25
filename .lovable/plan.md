

## Plano: Modernizacao Visual Premium do VEGA

### Escopo

Elevar a percepcao de valor do app com mudancas cirurgicas em 3 camadas: cores/tokens, componentes-chave e microinteracoes. Sem imagens pesadas, sem impacto em performance.

### 1. Paleta de cores premium — `src/index.css`

Ajustar os tokens CSS para um visual mais sofisticado:
- **Primary**: trocar o azul escuro generico por um azul petroleo premium (`200 65% 28%`)
- **Accent dourado**: adicionar variavel `--gold` (`42 78% 55%`) para destaques estrategicos (botoes principais, badges importantes)
- **Background**: suavizar levemente para um off-white mais quente (`220 20% 97%`)
- **Cards**: adicionar sutil warmth (`220 14% 99%`)
- **Sidebar**: aprofundar para um dark navy mais rico (`210 40% 8%`)
- **Borders**: mais sutis (`220 15% 92%`)

### 2. Tela de Login premium — `src/pages/Auth.tsx`

- Layout split-screen: lado esquerdo com gradiente azul petroleo → dourado sutil + logo grande + tagline; lado direito com formulario
- No mobile: gradiente como header compacto, formulario abaixo
- Efeito de glow sutil no logo (CSS box-shadow animado)
- Sem imagens externas — apenas CSS gradients e o SVG existente

### 3. Dashboard (Home) com hero leve — `src/pages/Home.tsx`

- Hero section com gradiente sutil de fundo (azul petroleo → transparente) em vez de fundo plano
- Badge "Inteligencia Estrategica" com borda dourada e efeito shimmer CSS
- Cards dos pilares: adicionar hover com `scale(1.02)` + shadow elevation + borda colorida animada
- GPS card: destaque com borda gradiente dourada

### 4. Cards e layout global — `src/index.css` + `tailwind.config.ts`

- Novas classes utilitarias:
  - `.card-premium`: shadow mais definida (`0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)`), border mais sutil, `backdrop-blur`
  - `.card-hover`: transicao `transform 200ms + shadow + border-color`
- Atualizar `--radius` para `0.75rem` (mais arredondado)
- Spacing mais generoso nos cards existentes

### 5. Botoes premium — `src/components/ui/button.tsx`

- Variante `default`: gradiente sutil (azul petroleo → azul petroleo claro) em vez de cor flat
- Hover: elevar shadow + leve scale
- Active: press-down sutil (`scale(0.98)`)
- Nova variante `gold`: fundo dourado para CTAs principais

### 6. Sidebar refinada — `src/components/AppSidebar.tsx`

- Separador visual entre grupos com linha gradiente sutil
- Item ativo: barra lateral esquerda de 3px na cor do pilar + fundo mais contrastado
- Logo com glow sutil
- Transicao mais suave no collapse/expand

### 7. Header (AppLayout) — `src/components/AppLayout.tsx`

- Adicionar divider gradiente sutil no bottom border (em vez de borda solida)
- Breadcrumb-style no titulo (mais hierarquia)

### 8. Empty states — `src/pages/Pacientes.tsx` (e similares)

- Quando lista vazia: ilustracao minimalista SVG inline (icone grande + texto motivacional)
- Exemplo: icone de pessoa com "+" e texto "Comece cadastrando seu primeiro paciente"

### 9. Microinteracoes — `src/index.css` + `tailwind.config.ts`

Novas animacoes e keyframes:
- `shimmer`: efeito de brilho que passa pela badge dourada
- `glow-pulse`: pulsacao sutil no logo da sidebar
- `press`: scale down ao clicar botoes
- Hover em table rows: highlight sutil com transicao
- Focus rings dourados nos inputs

### 10. Tabelas premium — `src/components/ui/table.tsx`

- Header com fundo sutil (`bg-muted/40`)
- Hover row com transicao suave
- Zebra striping muito sutil
- Bordas mais leves

### Arquivos modificados

| Acao | Arquivo |
|------|---------|
| Editar | `src/index.css` — tokens, keyframes, utilitarios |
| Editar | `tailwind.config.ts` — cores gold, animacoes |
| Editar | `src/pages/Auth.tsx` — layout split premium |
| Editar | `src/pages/Home.tsx` — hero com gradiente |
| Editar | `src/components/ui/button.tsx` — variantes premium |
| Editar | `src/components/AppSidebar.tsx` — refinamentos |
| Editar | `src/components/AppLayout.tsx` — header gradiente |
| Editar | `src/components/ui/table.tsx` — hover + zebra |
| Editar | `src/pages/Pacientes.tsx` — empty state |
| Editar | `src/pages/Vendas.tsx` — cards hover premium |
| Editar | `src/pages/Gestao.tsx` — cards hover premium |

### Principios

- Zero imagens externas (somente CSS gradients + SVG existente)
- Todas as animacoes com `will-change` e duracao < 300ms
- Nenhuma dependencia nova
- Compativel mobile-first

