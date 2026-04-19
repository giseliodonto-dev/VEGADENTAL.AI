

## Plano final: WhatsApp escalável e sem fricção

### Filosofia
Não adivinhar país nem manipular o `9`. Salvar e enviar o número como o usuário cadastrou (apenas dígitos). Validar só o mínimo necessário. Dar feedback claro.

### Mudanças

**1. `src/lib/whatsapp.ts` — simplificar**
- `formatWhatsAppPhone(raw)`:
  - Remove não-dígitos
  - Aceita 8 a 15 dígitos → retorna os dígitos puros
  - Caso contrário → `null`
  - **Sem prefixo `55` automático**
- `displayWhatsAppPhone(raw)`:
  - Se 10-11 dígitos (BR sem DDI): formata `(11) 98888-7777`
  - Se 12-13 dígitos começando com `55`: formata `+55 (11) 98888-7777`
  - Outros: `+<digits>`
- `openWhatsApp`: mantém validação + toast de erro (já está bom)

**2. `src/pages/Pacientes.tsx` — cadastro**
- Validação: mínimo 10 dígitos (DDD + número)
- Mensagem de erro genérica: "Telefone precisa ter DDD + número"
- Texto de ajuda discreto abaixo do input:
  > "Digite com DDD. Para internacional, inclua o código do país (ex: 5511988887777)."

**3. `src/pages/PacienteDetalhe.tsx` — preview**
- Já usa `displayWhatsAppPhone` — atualiza sozinho com a nova lógica

### Por que é escalável
- Funciona para BR (com ou sem DDI cadastrado)
- Funciona para qualquer país (basta cadastrar com DDI completo)
- Não força nenhum prefixo → o WhatsApp resolve com base no número
- Lógica curta, sem ramificações frágeis
- Zero migração, zero schema, zero peso

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/lib/whatsapp.ts` | Remove prefixo `55` automático; `displayWhatsAppPhone` formata por tamanho |
| `src/pages/Pacientes.tsx` | Mensagem de erro genérica + texto de ajuda |

`PacienteDetalhe.tsx` não precisa de mudança — já consome `displayWhatsAppPhone`.

