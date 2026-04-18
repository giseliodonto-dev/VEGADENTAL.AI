
## Auditoria VEGA GPS — Plano de correções

### 1. Cálculos Financeiros (Hora Clínica)

**Arquivo:** `src/pages/vega/HoraClinica.tsx`

Conferi a fórmula atual:
```
totalBruto = totalCustos + proLabore
totalComImpostos = totalBruto * (1 + impostos%)
horaClinica = totalComImpostos / (dias × horas)
horaClinicaIdeal = horaClinica × 1.3
```

**Problemas:**
- O markup oficial do método (memory `features/finance/profit-logic`) é **2.38 mínimo** e **3.30 ideal**, mas a página usa apenas `× 1.3`. Está inconsistente com a Calculadora de Sobrevivência.
- O label diz "Hora Ideal (×1.3)" — confuso, pois 1.3 é apenas margem de 30%, não o markup VEGA.

**Correção:** Renomear para "Hora Mínima (×2.38)" e "Hora Ideal (×3.30)" exibindo os dois valores, alinhado ao método.

### 2. Perguntas de Decisão (tom Artesanal)

**Arquivo:** `src/pages/vega/PerguntasDecisao.tsx`

Vou ler o arquivo na execução e:
- Remover qualquer resposta com tom genérico/robótico ("nosso procedimento é seguro e moderno", "tecnologia de ponta", etc.)
- Garantir que cada resposta carregue o selo **"Método VEGA: Excelência Artesanal"** e use vocabulário de escultura/lapidação/irrepetibilidade conforme memory `features/vendas-decision-logic`.

### 3. Permissões (Equipe não acessa Finanças/Configurações)

**Estado atual:** `ProtectedRoute` só checa sessão + clínica. Não há gate por role.

**Correção:** Criar `RoleProtectedRoute` que aceita `allowedRoles={['dono','admin']}` e envolver:
- `/financeiro`, `/gestao/financas`
- `/configuracoes`
- `/clinicas`, `/gestao/metas`

Usar `clinic_members.role` via hook `useClinic` (adicionar `role` ao retorno se ainda não existir).

### 4. Bugs de navegação (404)

**Sidebar atual** (`AppSidebar.tsx`) tem 8 links: `/`, `/pacientes`, `/gestao/agenda`, `/gestao/equipe`, `/financeiro`, `/vendas`, `/marketing`, `/gps` + footer `/configuracoes`. Todos existem em `App.tsx` ✅.

**Erro encontrado no console:**
```
404: /vendas/perguntas-decisao
```
A rota correta é `/vega/perguntas`. Algum botão dentro de `/vendas` está apontando para o caminho errado. Vou localizar e corrigir o link.

**Runtime error adicional:** `.headers is not a function` em uma query Supabase — quebra `AnamnesePublica`. Vou corrigir junto (uso correto: passar token via filtro `.eq('public_token', token)`, não via `.headers()`).

### 5. Bônus de segurança (detectado no scan)

A policy `Anon can view anamnese by token` tem `USING true` — expõe TODAS as anamneses. Vou ajustar para filtrar por token. Crítico para LGPD.

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/pages/vega/HoraClinica.tsx` | Markup 2.38 / 3.30 |
| `src/pages/vega/PerguntasDecisao.tsx` | Reescrita tom Artesanal |
| `src/components/RoleProtectedRoute.tsx` | Novo — gate por role |
| `src/hooks/useClinic.tsx` | Expor `role` |
| `src/App.tsx` | Aplicar RoleProtectedRoute em rotas restritas |
| `src/pages/Vendas.tsx` ou sub | Corrigir link `/vendas/perguntas-decisao` → `/vega/perguntas` |
| `src/pages/AnamnesePublica.tsx` | Remover `.headers()` quebrado |
| Migração SQL | Corrigir RLS de `anamneses` (anon SELECT por token) |

Sem mudanças visuais de design — apenas lógica, textos e segurança.
