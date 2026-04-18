

## Diagnóstico

A página `/gestao/equipe` (`EquipeVega.tsx`) hoje chama a Edge Function `send-invite`, que tenta validar permissão + criar o invite no banco. O erro está bloqueando a criação do colaborador. Precisamos remover essa dependência e fazer tudo client-side.

Já temos:
- Tabela `invites` com RLS `clinic_members_create_invites` permitindo INSERT direto pelo dono/membro autenticado
- `token uuid` com `default gen_random_uuid()` — gerado automaticamente
- `src/lib/publicUrl.ts` → `getPublicAppOrigin()` para montar URL estável
- Página `/convite/:token` (`Convite.tsx`) já funciona

## Plano

### 1. Refatorar `src/pages/gestao/EquipeVega.tsx`

Substituir a chamada `supabase.functions.invoke('send-invite', ...)` por:

```ts
// 1. Verifica se já existe convite pendente (mesmo email + clinic)
const { data: existing } = await supabase
  .from('invites')
  .select('id, token, status')
  .eq('clinic_id', clinicId)
  .eq('email', email)
  .maybeSingle();

let token: string;
if (existing) {
  // Reativa convite existente
  const { data: upd } = await supabase
    .from('invites')
    .update({ status: 'pending', role, invited_by: userId, accepted_at: null })
    .eq('id', existing.id)
    .select('token')
    .single();
  token = upd.token;
} else {
  const { data: ins } = await supabase
    .from('invites')
    .insert({ email, clinic_id: clinicId, role, invited_by: userId, status: 'pending' })
    .select('token')
    .single();
  token = ins.token;
}

const inviteUrl = `${getPublicAppOrigin()}/convite/${token}`;
setGeneratedLink(inviteUrl);
setLinkDialogOpen(true);
```

Remove qualquer try/catch que falhe se algo de e-mail acontecer — não há mais e-mail.

### 2. Modal de Sucesso com link gerado

Novo `Dialog` ao final do componente:
- Título: "Convite criado com sucesso"
- Texto explicativo: "Compartilhe o link abaixo com o colaborador"
- `Input readOnly` com a URL completa
- Botão **"Copiar Link"** (dourado): `navigator.clipboard.writeText(link)` + toast "Link copiado"
- Botão **"Enviar via WhatsApp"** (outline verde): abre `https://wa.me/?text=` com mensagem pré-formatada:
  > "Olá! Você foi convidado para acessar a {clinicName} no VEGA Dental. Crie sua conta neste link: {inviteUrl}"
- Botão "Fechar"

### 3. Remoção da Edge Function `send-invite`

Deletar `supabase/functions/send-invite/index.ts` e remover bloco `[functions.send-invite]` do `supabase/config.toml`. Chamar `supabase--delete_edge_functions(["send-invite"])` para tirar do deploy.

### 4. Arquivos

| Arquivo | Mudança |
|---|---|
| `src/pages/gestao/EquipeVega.tsx` | Insert direto em `invites` + Dialog de sucesso com Copiar/WhatsApp |
| `supabase/functions/send-invite/index.ts` | **Deletar** |
| `supabase/config.toml` | Remover bloco `[functions.send-invite]` |
| Edge function deployment | `delete_edge_functions(["send-invite"])` |

Sem migrações. Sem schema change. Sem dependência de e-mail.

