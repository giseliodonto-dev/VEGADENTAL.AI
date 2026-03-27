

## Plano: Renomear "Usuarios" para "Colaboradores" + Corrigir bug do convite

### Problema

Quando um colaborador convidado cria conta (via link ou login), o sistema tenta inseri-lo em `clinic_members`, mas a politica RLS so permite insercao por usuarios com cargo `dono`. O insert falha silenciosamente e o colaborador cai na tela "Crie sua Clinica" — que nao deveria aparecer para ele.

### Solucao

**1. Migracao — funcao `accept_pending_invites` (SECURITY DEFINER)**

Criar funcao no banco que:
- Recebe o `user_id` e `email` do usuario logado
- Busca convites pendentes para aquele email
- Para cada convite: insere em `clinic_members` e marca convite como `accepted`
- Executa com privilegios elevados (bypassa RLS)

```sql
CREATE OR REPLACE FUNCTION public.accept_pending_invites(_user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN
    SELECT * FROM invites WHERE email = _email AND status = 'pending'
  LOOP
    INSERT INTO clinic_members (clinic_id, user_id, role)
    VALUES (inv.clinic_id, _user_id, inv.role)
    ON CONFLICT DO NOTHING;

    UPDATE invites SET status = 'accepted', accepted_at = now()
    WHERE id = inv.id;
  END LOOP;
END;
$$;
```

**2. Editar `src/pages/Auth.tsx`**

No login, substituir as queries manuais de insert/update por chamada a `supabase.rpc('accept_pending_invites', { _user_id, _email })`.

**3. Editar `src/pages/Convite.tsx`**

No signup com auto-confirm, tambem usar o RPC em vez de insert direto (para consistencia e para funcionar com RLS).

**4. Renomear "Usuarios" para "Colaboradores"**

| Arquivo | Mudanca |
|---------|---------|
| `src/components/AppSidebar.tsx` | Label "Usuarios" → "Colaboradores" |
| `src/pages/Usuarios.tsx` | Titulo `AppLayout title` → "Colaboradores" |
| Titulo do card "Equipe da Clinica" permanece (ja esta correto) |

### Arquivos

| Acao | Arquivo |
|------|---------|
| Migracao | Funcao `accept_pending_invites` |
| Editar | `src/pages/Auth.tsx` — usar RPC |
| Editar | `src/pages/Convite.tsx` — usar RPC |
| Editar | `src/components/AppSidebar.tsx` — renomear label |
| Editar | `src/pages/Usuarios.tsx` — renomear titulo |

