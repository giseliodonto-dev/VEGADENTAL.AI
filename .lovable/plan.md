## Melhorar visibilidade da barra de rolagem

**Problema:** As scrollbars atuais em `src/index.css` usam `hsl(var(--border))` (cinza muito claro, ~92% luminosidade) com apenas 5px de largura, ficando praticamente invisíveis sobre fundos brancos de modais, sheets e dialogs.

**Solução (apenas CSS, em `src/index.css`):**

1. Aumentar a largura de `5px` → `10px` (track) com thumb de `8px` visível.
2. Trocar a cor do thumb de `hsl(var(--border))` para um tom mais contrastante:
   - Thumb normal: `hsl(var(--muted-foreground) / 0.35)` (cinza médio translúcido)
   - Thumb hover: `hsl(var(--primary) / 0.6)` (azul petróleo da identidade Vega)
3. Adicionar `border: 2px solid transparent` + `background-clip: padding-box` no thumb para criar respiro elegante (padrão "quiet luxury").
4. Adicionar suporte Firefox via `scrollbar-width: thin` e `scrollbar-color`.
5. Garantir que a regra cobre containers internos de Dialog/Sheet/ScrollArea (a regra global `::-webkit-scrollbar` já se aplica, mas confirmar que não há override no `ScrollArea` do shadcn — o `ScrollAreaThumb` usa `bg-border`; trocar para `bg-muted-foreground/40` no `src/components/ui/scroll-area.tsx` para consistência).

**Arquivos alterados:**
- `src/index.css` — bloco `::-webkit-scrollbar*` no final do arquivo
- `src/components/ui/scroll-area.tsx` — classe do `ScrollAreaThumb`

**Fora de escopo:** mudar comportamento de overflow, adicionar scrollbars onde não existem, ou alterar cores globais do design system.
