

## Plano: Substituir icone do APP VEGA Dental AI

### O que sera feito

Usar a imagem enviada (estrela de Davi azul/dourada) como logo do app em dois lugares:

1. **Sidebar header** — Substituir o icone `Zap` pela imagem
2. **Favicon** — Atualizar o favicon do navegador

### Arquivos

1. **Copiar imagem** para `public/vega-logo.png` (para favicon) e `src/assets/vega-logo.png` (para import no React)

2. **Editar `src/components/AppSidebar.tsx`**
   - Importar a imagem de `@/assets/vega-logo.png`
   - Substituir o bloco do icone Zap por um `<img>` com a logo
   - Tamanho: `h-9 w-9` com `rounded-lg` e `object-contain`
   - Remover o fundo `bg-vendas` (a imagem ja tem identidade propria)

3. **Editar `index.html`**
   - Adicionar `<link rel="icon" href="/vega-logo.png" type="image/png">`

### Detalhes

- A imagem sera usada como esta, sem manipulacao de fundo
- No sidebar colapsado: apenas o icone aparece (ja funciona assim)
- No sidebar expandido: icone + texto "VEGA Dental AI"
- Responsivo: `object-contain` garante proporcao em qualquer tamanho

