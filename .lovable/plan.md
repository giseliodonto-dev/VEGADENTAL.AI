
## Diagnóstico

O erro ao cadastrar paciente em `/pacientes` tem causa clara olhando o código atual + RLS:

1. **`useQuery` sem filtro por clínica**: o `select("*")` em `patients` não filtra por `clinic_id` e roda sempre, mesmo sem clínica carregada. Não causa o erro de salvar, mas pode poluir cache.
2. **Race condition no clinicId**: `useClinic` tem estado `loading`, mas `Pacientes.tsx` não usa. Se o usuário abre o modal antes de `clinicId` estar pronto, o insert dispara com `clinicId = null` → cai na guarda "Clínica não identificada" OU vai pro Supabase e bate na RLS `Members can insert patients` (`clinic_id IN get_user_clinic_ids(auth.uid())`) → erro 403 genérico.
3. **Mensagem de erro pobre**: `e.message` às vezes vem vazio em erros de RLS, escondendo a causa real.

## Correções

### `src/pages/Pacientes.tsx`
- Importar `loading` do `useClinic` junto com `clinicId`.
- Filtrar a query de pacientes por `clinic_id` e habilitá-la só quando `clinicId` existir (`enabled: !!clinicId`, queryKey inclui `clinicId`).
- Desabilitar o botão "Novo Paciente" enquanto `loading` ou `!clinicId`, com tooltip/label adequado ("Carregando clínica..." / "Sem clínica vinculada").
- No `addMut`:
  - Guarda dupla: se `loading` → "Aguarde, carregando dados da clínica"; se `!clinicId` → "Sua conta não está vinculada a nenhuma clínica. Recarregue a página ou contate o suporte".
  - Manter insert mínimo: `{ clinic_id, name, phone, origin, status: 'lead' }` + `.select().single()` + `navigate(/pacientes/${data.id})`.
  - `onError` mostra `e.message || e.details || e.hint || 'Erro desconhecido'` e loga `console.error('[Pacientes] insert error', e, { clinicId, payload })` para diagnóstico futuro.
  - Modal permanece aberto em erro (já é o comportamento — confirmar).
- Desabilitar botão "Cadastrar e abrir ficha" também quando `!clinicId || loading`.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/pages/Pacientes.tsx` | Usa `loading` do `useClinic`, query filtrada por `clinicId`, botões bloqueados até clínica carregar, mensagens de erro detalhadas, log do payload no console |

## O que NÃO muda
- Banco de dados, RLS, função `create_clinic_with_owner`, `useClinic`, schema da tabela `patients`.
