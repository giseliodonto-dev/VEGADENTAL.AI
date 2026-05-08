## Refactoring da Sidebar — Painel de Controle Ativo

Transformar a `AppSidebar` num painel minimalista, hierárquico e com indicadores dinâmicos em tempo real.

### 1. Nova hierarquia (única seção, sem divisores intermediários)

1. Início → `/`
2. Agenda → `/gestao/agenda` · badge dinâmico (confirmados hoje)
3. GPS → `/gps` · indicador de alerta pulsante
4. Vendas → `/vendas` · badge dinâmico (leads novos não atendidos)
5. Pacientes → `/pacientes` · sub-item: Documentos → `/documentos`
6. Financeiro → `/financeiro`
7. Configurações → `/configuracoes` (movido do footer para o final do menu principal)

Footer mantém apenas o botão **Sair**. "Equipe", "Marketing", "Instalar App" saem da sidebar (continuam acessíveis via rotas/Home cards) para reduzir poluição.

### 2. Indicadores dinâmicos (badges) — novo hook `useSidebarCounters`

Hook único, com cache (React Query, `staleTime: 60s`), filtrando por `clinic_id` ativo:

- **Agenda**: `appointments` onde `date = hoje` e `status = 'confirmado'` → número.
- **Vendas**: `leads` onde `status` ∈ estágios iniciais ("novo"/"sem contato") e sem follow-up registrado → número.
- **GPS**: chama a mesma fonte usada em VegaGPS (alertas críticos: margem < 30%, metas em risco). Se `count > 0`, mostra ponto pulsante dourado; opcionalmente número.

Badges renderizados à direita do label, escondidos quando sidebar colapsada (apenas o ponto pulsante do GPS permanece como mini-dot sobre o ícone).

### 3. Estética & branding

Tokens novos em `src/index.css` (HSL, no `:root`) — sem cores hardcoded:

```css
--sidebar-background: 220 25% 6%;        /* quase preto, leve viés azul */
--sidebar-foreground: 220 12% 70%;        /* cinza claro */
--sidebar-accent: 200 65% 28%;            /* Azul Petróleo (hover) */
--sidebar-accent-foreground: 0 0% 100%;
--sidebar-active-indicator: var(--gold);  /* barra lateral dourada */
--sidebar-border: 220 20% 12%;
```

Item de menu (estado ativo):

```text
┌─────────────────────────────┐
│▌ [icon]  Agenda        [8] │   ▌ = barra vertical 2px dourada
└─────────────────────────────┘
```

- Ícones `lucide-react` com `strokeWidth={1.5}` (traço fino).
- Hover: `bg-sidebar-accent/15`, transição 200ms.
- Ativo: `bg-sidebar-accent/20`, texto branco, barra `::before` dourada de 2px à esquerda (negativa via `inset-y-1 left-0`).
- Padding generoso: `py-2.5 px-3`, gap `gap-3` entre itens (`space-y-1.5`), altura mínima `h-10`.

### 4. Componente `SidebarCountBadge`

Pequeno componente reutilizável:
- Variant `count`: pill `bg-gold/15 text-gold` com número.
- Variant `alert`: ponto 8px com `animate-pulse` em dourado + halo.
- Esconde-se quando `collapsed` (exceto `alert`, que vira mini-dot absoluto sobre o ícone).

### 5. Sub-item Pacientes → Documentos

Usar `Collapsible` do shadcn dentro do `SidebarMenuItem`. Auto-expande quando rota atual é `/pacientes*` ou `/documentos`. Quando colapsada (icon mode), Documentos aparece via tooltip flutuante padrão do shadcn.

### Arquivos afetados

- `src/components/AppSidebar.tsx` — reestruturação completa.
- `src/components/SidebarCountBadge.tsx` — novo.
- `src/hooks/useSidebarCounters.tsx` — novo (React Query + supabase).
- `src/index.css` — ajustar tokens `--sidebar-*` e adicionar `--sidebar-active-indicator`.

Sem mudanças em rotas (`App.tsx`), business logic ou backend.
