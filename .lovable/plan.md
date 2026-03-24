

## Plano: Substituir logo do APP VEGA

### Situacao atual

O logo aparece em 3 locais:
1. **Sidebar** (`AppSidebar.tsx`): importa `src/assets/vega-logo.png`
2. **Favicon** (`index.html`): referencia `public/vega-logo.png`
3. **Tela de login** (`Auth.tsx`): usa icone Zap do Lucide (nao usa o logo real)

### Acoes

| Acao | Detalhe |
|------|---------|
| Copiar SVG | `user-uploads://Design_sem_nome.svg` → `src/assets/vega-logo.svg` (para imports React) |
| Copiar SVG | `user-uploads://Design_sem_nome.svg` → `public/vega-logo.svg` (para favicon e meta tags) |
| Editar `AppSidebar.tsx` | Trocar import de PNG para SVG; manter `h-9 w-9 rounded-lg object-contain` |
| Editar `Auth.tsx` | Substituir o bloco do icone Zap por `<img>` com o novo logo SVG importado |
| Editar `index.html` | Atualizar favicon para `/vega-logo.svg` com `type="image/svg+xml"` |
| Editar `budgetPdf.ts` | Verificar se referencia o logo e atualizar se necessario |

### Detalhes tecnicos

- SVG mantem qualidade em qualquer resolucao (desktop, tablet, mobile)
- Fundo transparente nativo do SVG
- Proporcao preservada via `object-contain`
- Na Auth, o logo tera `h-16 w-16` centralizado, substituindo o quadrado azul com Zap

### Arquivos afetados

- `src/assets/vega-logo.svg` (novo)
- `public/vega-logo.svg` (novo)
- `src/components/AppSidebar.tsx`
- `src/pages/Auth.tsx`
- `index.html`

