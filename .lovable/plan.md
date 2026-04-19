

## Diagnóstico

O erro `api.whatsapp.com está bloqueado / ERR_BLOCKED_BY_RESPONSE` acontece porque o navegador (ou o iframe de preview do Lovable) bloqueia o domínio `api.whatsapp.com` por política de CSP/frame-ancestors. O `wa.me` é um encurtador que **redireciona** para `https://api.whatsapp.com/send?...`, e é justamente esse redirect que está sendo barrado dentro do iframe.

A solução definitiva: **abrir o link em nova aba/janela de forma explícita** (não no iframe) e/ou **usar diretamente o `https://api.whatsapp.com/send`** com `target="_blank"` + `rel="noopener noreferrer"` + `window.open()` programático como fallback.

Hoje todos os botões WhatsApp do sistema usam `<a href={whatsappUrl} target="_blank">`. Dentro do iframe do preview, o `target="_blank"` às vezes é interceptado e tenta abrir no próprio frame → CSP bloqueia.

## Solução

### 1. Atualizar `src/lib/whatsapp.ts`

Adicionar uma função `openWhatsApp(phone, message)` que:
- Monta a URL usando `https://api.whatsapp.com/send?phone=...&text=...` (formato canônico, mais confiável que `wa.me` em iframes)
- Usa `window.open(url, "_blank", "noopener,noreferrer")` que escapa do iframe
- Se `window.open` retornar `null` (pop-up bloqueado), faz fallback para `window.top.location.href = url`

Manter `buildWhatsAppUrl` para compatibilidade, mas trocar a base para `api.whatsapp.com/send?phone=X&text=Y` (sem encurtador).

### 2. Substituir os `<a href>` por `<Button onClick={() => openWhatsApp(...)}>`

Em 3 arquivos:
- `src/pages/gestao/EquipeVega.tsx` — botão "Enviar via WhatsApp" no modal + botão WhatsApp em cada convite pendente
- `src/pages/PacienteDetalhe.tsx` — botão "Enviar Orçamento via WhatsApp"
- `src/pages/gestao/AgendaVega.tsx` — ícones WhatsApp nos cards e botão de confirmação

Cada botão chama `openWhatsApp(phone, message)` no `onClick` em vez de depender do `href + target="_blank"`.

### 3. Por que isso resolve

- `window.open(url, "_blank")` força a abertura fora do iframe → o navegador trata como navegação top-level e a CSP do parent não se aplica
- Usar `api.whatsapp.com/send` direto evita o redirect do `wa.me` (que é o que dispara o `ERR_BLOCKED_BY_RESPONSE`)
- Fallback para `window.top.location` cobre o caso raro de pop-up bloqueado

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/lib/whatsapp.ts` | Trocar base para `api.whatsapp.com/send` + adicionar `openWhatsApp()` com `window.open` e fallback |
| `src/pages/gestao/EquipeVega.tsx` | Trocar `<a href>` por `<Button onClick={openWhatsApp}>` (2 lugares) |
| `src/pages/PacienteDetalhe.tsx` | Trocar `<a href>` por `<Button onClick={openWhatsApp}>` |
| `src/pages/gestao/AgendaVega.tsx` | Trocar `<a href>` por `<Button onClick={openWhatsApp}>` (cards + dialog) |

Sem migrações. Sem schema. Solução 100% client-side. Funciona dentro do preview e em produção.

