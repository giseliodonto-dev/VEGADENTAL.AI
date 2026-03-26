

## Plano: Corrigir autenticacao + novos cargos + auto-associar dentista

### Diagnostico

O sistema ja usa autenticacao interna (email/senha via Supabase Auth integrado). Nao ha redirecionamento externo — o fluxo de login/signup esta em `/auth`. O problema real e:

1. **Cargos faltando**: O enum `app_role` so tem `dono | recepcao | dentista | crm | sdr`. Faltam `admin` e `protetico`.
2. **Agendamento nao auto-associa dentista**: Ao criar agendamento, o campo `dentist_user_id` e manual. Deveria pre-selecionar o usuario logado se ele for dentista.
3. **UX na pagina de Usuarios**: Os labels de cargo precisam incluir os novos tipos.

### 1. Migracao — adicionar novos valores ao enum

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'protetico';
```

### 2. Atualizar labels de cargo — `src/pages/Usuarios.tsx`

Adicionar ao `roleLabels`, `roleIcons` e `roleBadgeVariant`:
- `admin`: "Admin" (icone: `Shield`)
- `protetico`: "Protético" (icone: `Wrench` ou similar)

### 3. Auto-associar dentista na Agenda — `src/pages/gestao/AgendaVega.tsx`

- Ao abrir o dialog de novo agendamento, verificar se o usuario logado e dentista/dono
- Se sim, pre-preencher `newForm.dentist_user_id` com `user.id`
- Manter a opcao de trocar o dentista manualmente (para recepcionistas agendando para outro dentista)

### 4. Incluir `admin` e `protetico` na query de dentistas da agenda

- Na query de dentistas, incluir `admin` nos roles que podem aparecer (admin pode agendar)
- `protetico` nao precisa aparecer como dentista na agenda (nao atende pacientes diretamente)

### Arquivos

| Acao | Arquivo |
|------|---------|
| Migracao | Adicionar `admin` e `protetico` ao enum `app_role` |
| Editar | `src/pages/Usuarios.tsx` — labels e icones dos novos cargos |
| Editar | `src/pages/gestao/AgendaVega.tsx` — pre-selecionar dentista logado |

### Sem quebras

- Auth existente (login/signup) permanece intacto
- Fluxo de onboarding (ClinicOnboarding) permanece intacto
- RLS policies usam o enum por referencia, novos valores sao compatveis automaticamente

