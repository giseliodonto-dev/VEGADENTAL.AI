
## Diagnóstico

Não existe nenhum arquivo `useWhatsapp`, `WhatsappService`, integração Twilio, Z-API ou Meta API no projeto. A busca por esses termos retornou **zero resultados**. Não há `api_status` em nenhum botão.

O que existe é um único helper, `src/lib/whatsapp.ts`, que abre `https://api.whatsapp.com/send?...` e mostra toast `"Telefone inválido"` quando o número não passa na normalização. Esse toast é provavelmente o que o usuário está interpretando como "API BLOQUEADA". Vamos simplificar tudo conforme a ordem.

## Mudanças

### 1. `src/lib/whatsapp.ts` — reescrever do zero
Substituir todo o conteúdo por uma versão minimalista sem validações que bloqueiem clique:

```ts
export function handleWhatsapp(phone: string | null | undefined, message: string) {
  const cleanPhone = (phone ?? "").replace(/\D/g, "");
  const url = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

// Aliases mantidos só para não quebrar imports existentes:
export const openWhatsApp = handleWhatsapp;

// Helpers de exibição (não-bloqueantes), mantidos:
export function formatWhatsAppPhone(raw?: string | null): string | null { /* mantido */ }
export function displayWhatsAppPhone(raw?: string | null): string { /* mantido */ }
export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const cleanPhone = (phone ?? "").replace(/\D/g, "");
  return cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}
```

Resultado:
- Sem toast de erro, sem `return` antecipado, sem checagem de DDI/DDD.
- Sempre abre `wa.me` em nova aba — o WhatsApp do navegador/celular do usuário logado é quem envia.
- Prefixo `55` adicionado conforme ordem do usuário.

### 2. Remover botões desabilitados / verificações
- `src/pages/vendas/FollowUpInteligente.tsx` linha 138-140: remover o `if (!phone) return toast.error(...)`. Botão sempre clica e abre `wa.me` (sem destinatário se vazio).
- `src/components/AnamneseInlineForm.tsx` linha 116: idem — remover `if (!patientPhone) return toast.error(...)`.
- Não há atributos `disabled` nos botões de WhatsApp dependentes de status de API. Confirmado.

### 3. Botão de confirmação da Agenda — `src/pages/gestao/AgendaVega.tsx`
Os 3 pontos (linhas 352, 432, 561) já chamam `openWhatsApp(...)`. Como `openWhatsApp` agora será o handler puro reescrito acima, fica sem qualquer validação de servidor — clique direto → `window.open(wa.me/...)`.

### 4. `OrcamentoPublico.tsx`
Já usa `window.open('https://wa.me/55${phone}?text=...')` direto. Nada a mudar.

### 5. Configurações — botão "Testar WhatsApp da Clínica"
Garantir que ele também usa `handleWhatsapp(phone, "Teste...")` sem validação extra. Hoje ele bloqueia com toast quando phone vazio — substituir por chamada direta ao novo helper.

### 6. Número da clínica como remetente
Conforme a ordem: o `wa.me` **sempre abre o WhatsApp do usuário logado** (é assim que `wa.me` funciona — o remetente é o aparelho que abre o link). O número `5511917031358` permanece salvo na tabela `clinics` (já gravado anteriormente) apenas como dado da clínica, não é injetado no link.

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/whatsapp.ts` | Reescrito: handler puro `wa.me/55<digits>`, sem validação bloqueante |
| `src/pages/vendas/FollowUpInteligente.tsx` | Remover `if (!phone) toast.error` |
| `src/components/AnamneseInlineForm.tsx` | Remover `if (!patientPhone) toast.error` |
| `src/pages/Configuracoes.tsx` | Botão "Testar WhatsApp" chama handler direto, sem validação |

## O que NÃO existe (e portanto não há o que deletar)
- `useWhatsapp`, `WhatsappService`, integração Twilio / Z-API / Meta API: **nenhum desses existe no projeto**. A busca confirmou. Nenhum arquivo será deletado porque não há nada do tipo para deletar.

## O que NÃO muda
- Banco de dados, RLS, telefone da clínica já salvo (`5511917031358`).
- Layout dos botões de WhatsApp.
- Mensagens pré-preenchidas (templates de confirmação, anamnese, orçamento).
