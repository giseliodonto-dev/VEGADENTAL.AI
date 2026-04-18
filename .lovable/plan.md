

A query no `EquipeVega.tsx` está quebrando porque tenta um join `profiles:user_id(...)` que depende de uma foreign key explícita entre `clinic_members.user_id` e `profiles.id` — que não existe no schema (PostgREST retorna `PGRST200`). Por isso a lista de membros aparece vazia/erro, mas os convites antigos continuam lá no banco.

**Não, não foram removidos.** A função `send-invite` reaproveita convites `pending` antigos (mesmo email + clínica) em vez de criar novos. Quem foi convidado antes ainda tem link válido.

## Plano

### 1. Confirmar convites existentes
Vou rodar `SELECT email, role, status, created_at FROM invites WHERE clinic_id = '015e4c57-...'` para listar tudo que existe (pending, accepted, cancelled) e te mostrar.

### 2. Corrigir o erro 400 da lista de membros
O join PostgREST falha. Trocar por duas queries em sequência:
- `clinic_members` (id, role, user_id) por clinic_id
- `profiles` (id, full_name, email) com `.in('id', userIds)`
- Mesclar no client.

Arquivo: `src/pages/gestao/EquipeVega.tsx` — apenas a query `clinic-members`.

### 3. (Opcional) Adicionar botão "Limpar convites antigos"
Se quiser, adiciono ação para cancelar em massa convites `pending` com mais de X dias. Me confirma se quer isso.

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/pages/gestao/EquipeVega.tsx` | Trocar join quebrado por duas queries + merge client-side |

Sem migração — schema correto, só código cliente.

