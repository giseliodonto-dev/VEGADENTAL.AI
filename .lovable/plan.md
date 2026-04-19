

## Diagnóstico

Olhando `src/lib/whatsapp.ts`:

```ts
if (digits.length === 10 || digits.length === 11) return `55${digits}`;
if (digits.length >= 12 && digits.length <= 15) return digits;
return null;
```

E em `Pacientes.tsx` o telefone é salvo como o usuário digitou (ex: `(11) 98888-7777` ou `11988887777`). O `formatWhatsAppPhone` remove não-dígitos e prefixa `55` se tiver 10/11 dígitos. Isso parece correto.

**Mas** preciso verificar onde "não reconhece":
1. Talvez o telefone esteja sendo salvo formatado e em alguns lugares a checagem é `if (patientPhone)` — ok, string truthy passa.
2. Em `PacienteDetalhe.tsx`, qual campo está sendo lido? `patient.phone`? Talvez o componente esteja lendo de outro lugar.
3. Talvez no botão "Enviar Orçamento via WhatsApp" o `patient.phone` esteja `null`/vazio e o botão fique desabilitado ou abre WhatsApp sem número (genérico).
4. Talvez o número salvo tenha menos de 10 dígitos (ex: usuário digitou só `988887777` sem DDD) → `formatWhatsAppPhone` retorna `null` → `buildWhatsAppUrl` cai no fallback genérico (sem `phone=`).

Preciso confirmar:
- O que `patient.phone` retorna no `PacienteDetalhe.tsx` para o paciente atual.
- Como o botão WhatsApp lá é renderizado (condicional em `patient.phone`?).
- Se há mensagem de erro no toast.

## Investigação rápida (necessária antes de propor fix)

1. Ler `src/pages/PacienteDetalhe.tsx` na seção do botão "Enviar Orçamento via WhatsApp" — confirmar de onde vem o phone.
2. Consultar via `supabase--read_query` o `phone` do paciente atual (`38d43056-19b9-4a07-8a78-b0c0b00ac90b`) para ver o formato real salvo.
3. Verificar se em `Pacientes.tsx` (cadastro) há máscara ou validação.

## Hipóteses & Solução

### Hipótese A — Telefone salvo sem DDI/com formato inconsistente
O usuário digita `(11) 98888-7777`, salva como `(11) 98888-7777` no banco. `formatWhatsAppPhone` remove para `11988887777` (11 dígitos) → prefixa `55` → `5511988887777`. **Isso funciona.**

### Hipótese B — Campo `phone` está vazio para alguns pacientes
Cadastros antigos (importados ou criados antes do campo) podem ter `phone = null`. Aí o botão WhatsApp ou some, ou abre genérico.

### Hipótese C — Telefone com menos de 10 dígitos
Se o paciente tem só `988887777` (9 dígitos, sem DDD), `formatWhatsAppPhone` retorna `null` → link genérico → toast "Paciente sem telefone" em alguns lugares, ou WhatsApp abre sem destinatário.

### Hipótese D — Validação muito estrita
A regra `digits.length === 10 || digits.length === 11` rejeita números com 9 dígitos (móvel sem DDD) ou 12 (DDI já incluso pelo usuário, ex: `5511988887777` → 13 dígitos cai no `>= 12 && <= 15` → ok). Mas se for `551198888777` (12) ok também. **Provavelmente só rejeita 8-9 dígitos.**

## Solução proposta

### 1. Tornar `formatWhatsAppPhone` mais tolerante e dar feedback claro

Em `src/lib/whatsapp.ts`:
- Aceitar 8-9 dígitos como número local (assumir DDD padrão? **não** — perigoso). Em vez disso, retornar `null` e o caller mostra erro claro.
- Aceitar 10-11 dígitos → prefixar `55` (BR).
- Aceitar 12-13 dígitos começando com `55` → usar como está.
- Aceitar 12-15 dígitos sem `55` → usar como está (DDI internacional).

### 2. `openWhatsApp` deve avisar quando o número for inválido

Hoje, se `phone` é inválido, ele abre WhatsApp **genérico** silenciosamente. Mudar para:
- Se `formatWhatsAppPhone(phone)` retornar `null` E `phone` foi passado (não-null), exibir toast vermelho: "Telefone inválido — verifique o cadastro do paciente" e **não** abrir WhatsApp.
- Se `phone` foi explicitamente `null`/`undefined` (chamada genérica), manter comportamento atual (abre WhatsApp sem destinatário).

### 3. Em `PacienteDetalhe.tsx`, mostrar o telefone usado

Adicionar pequeno texto cinza abaixo do botão "Enviar Orçamento via WhatsApp": "Será enviado para: +55 11 98888-7777" — assim o usuário vê na hora se o número está certo.

### 4. Validação no cadastro (`Pacientes.tsx`)

Bloquear submit se `phone` tiver menos de 10 dígitos, com mensagem clara: "Telefone precisa ter DDD + número (ex: 11988887777)".

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/lib/whatsapp.ts` | `openWhatsApp` valida e mostra toast de erro se phone inválido; export de `formatWhatsAppPhone` para preview |
| `src/pages/PacienteDetalhe.tsx` | Mostrar preview do telefone formatado abaixo do botão WhatsApp |
| `src/pages/Pacientes.tsx` | Validar phone (mín. 10 dígitos) antes de salvar |

Sem migrações. Sem schema. Resolve falsos negativos silenciosos e dá feedback ao usuário.

