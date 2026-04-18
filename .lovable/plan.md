

## Diagnóstico

O fluxo atual já está correto em teoria, mas para garantir que funcione "de uma vez por todas" preciso blindar contra os 3 pontos de falha reais:

1. **Constraint única ausente**: Se já existir convite (qualquer status) para o mesmo email+clinic, o INSERT pode quebrar. Hoje uso `.maybeSingle()` mas sem UNIQUE constraint, pode ter duplicatas e quebrar.
2. **RLS de UPDATE em invite reativado**: a policy `clinic_members_update_invites` exige que `clinic_id IN get_user_clinic_ids` — ok, passa.
3. **Token é UUID, não texto**: confirmar que `Convite.tsx` aceita UUID na rota (já aceita, é string).

## Solução Definitiva

### 1. Migration — garantir integridade

```sql
-- Remove duplicatas existentes (mantém o mais recente)
DELETE FROM invites a USING invites b
WHERE a.id < b.id AND a.clinic_id = b.clinic_id AND a.email = b.email;

-- Constraint única para evitar duplicatas futuras
ALTER TABLE invites 
  ADD CONSTRAINT invites_clinic_email_unique UNIQUE (clinic_id, email);
```

### 2. Refatorar `EquipeVega.tsx` — UPSERT atômico

Trocar a lógica "select → if/else → insert/update" por **UPSERT** único:

```ts
const { data, error } = await supabase
  .from('invites')
  .upsert({
    clinic_id: clinicId,
    email: cleanEmail,
    role,
    invited_by: userId,
    status: 'pending',
    accepted_at: null,
  }, { onConflict: 'clinic_id,email' })
  .select('token')
  .single();
```

Uma única chamada ao banco. Sem race condition. Sem if/else. Se o registro existe → atualiza. Se não → cria. Token sempre retornado.

### 3. Modal de sucesso

Já existe e funciona — mantém Copy + WhatsApp + Fechar.

### 4. Validação visual final

Após salvar:
- Toast verde "Convite criado"
- Modal abre com link
- Lista de convites pendentes recarrega via `qc.invalidateQueries`

## Arquivos

| Arquivo | Mudança |
|---|---|
| Migration | DELETE duplicatas + UNIQUE constraint em `(clinic_id, email)` |
| `src/pages/gestao/EquipeVega.tsx` | Substituir lógica select/if/else por `.upsert()` único |

Sem novas tabelas. Sem Edge Function. Sem e-mail. Atômico. Idempotente. Funciona sempre.

