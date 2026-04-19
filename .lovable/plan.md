

## Diagnóstico

O usuário pediu prefixar `55` automaticamente para 11 dígitos — isso reverte parcialmente a decisão anterior. Vou ler `PacienteDetalhe.tsx` rapidamente para ver onde o botão WhatsApp está sendo renderizado e confirmar de onde vem o `phone`.
<lov-tool-use id="toolu_vrtx_01C3rU5dJa6HcTSPRNfop4LY" name="code--search_files" integration-id="code" data="{\"query\": \"openWhatsApp|wa\\\\.me|patient\\\\.phone|patient\\\\.telefone\", \"include_patterns\": \"src/pages/PacienteDetalhe.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01XSp2BZaJYbu1ytboRs3cYo" name="code--search_files" integration-id="code" data="{\"query\": \"openWhatsApp|wa\\\\.me|patient\\\\.phone|patient\\\\.telefone|displayWhatsAppPhone\", \"include_patterns\": \"src/pages/PacienteDetalhe.tsx,src/pages/Pacientes.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01NnteXUdPM3FDYNsjoC19pL" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/PacienteDetalhe.tsx\", \"lines\": \"630-700\"}">
</lov-tool-use>
Já vi o suficiente. Vou checar o telefone real do paciente atual e a linha em Pacientes.tsx.
<lov-tool-use id="toolu_vrtx_019CDzGnKWZyJNm6cSASu3qY" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT id, name, phone FROM patients WHERE id = '012cdc1e-38e7-4929-9068-89b957472835';\"}">
</lov-tool-use>
Telefone existe e tem 11 dígitos (`11917031359`), válido. Então `formatWhatsAppPhone` retorna `11917031359` (puro, sem 55). O WhatsApp pode não reconhecer porque falta DDI no link (`api.whatsapp.com/send?phone=11917031359` fica ambíguo — WhatsApp espera E.164).

Aqui está o ponto: na rodada anterior removemos o `55` automático "para escalabilidade", mas isso quebrou justamente os números BR sem DDI. Agora o usuário quer voltar ao comportamento clássico `wa.me/55<numero>`.

<lov-plan>

## Diagnóstico

- Paciente atual tem `phone = "11917031359"` (11 dígitos, BR sem DDI).
- Na última iteração removemos o prefixo `55` automático em `formatWhatsAppPhone`. Resultado: o link vira `api.whatsapp.com/send?phone=11917031359`, que o WhatsApp interpreta como inválido → botão "não funciona".
- Em `Pacientes.tsx` (linha 160) ainda usa `wa.me/55${phone}` cru, sem validação.

O usuário pediu explicitamente: **se 11 dígitos → prefixar `55`**. Vamos restaurar esse comportamento (era o que funcionava antes).

## Solução (mínima e ágil)

### 1. `src/lib/whatsapp.ts` — restaurar prefixo `55` para BR

`formatWhatsAppPhone`:
- Remove não-dígitos
- Se 10 ou 11 dígitos → prefixa `55` (BR sem DDI)
- Se 12-15 dígitos → usa como está (já tem DDI)
- Caso contrário → `null`

`openWhatsApp` continua com toast de erro quando inválido (já está bom).

### 2. `src/pages/Pacientes.tsx` — usar `openWhatsApp` no card

Trocar o `window.open('https://wa.me/55...')` cru pelo helper `openWhatsApp(p.phone, "Olá ...")`. Isso valida, prefixa `55`, e mostra toast se inválido. Consistente com o resto do app.

### 3. `src/pages/PacienteDetalhe.tsx` — sem mudança

Já usa `openWhatsApp(patient?.phone, ...)` e `displayWhatsAppPhone`. Vai funcionar automaticamente assim que o helper voltar a prefixar `55`.

### Por que é a melhor forma
- Restaura o comportamento que o usuário pediu literalmente ("Se o número tiver 11 dígitos, adicione o prefixo 55").
- Mantém suporte internacional (12-15 dígitos passam intactos).
- Zero migração, zero schema. Duas funções editadas.
- Toda a app (Leads, Funil, Follow-up, Agenda, Equipe, Anamnese) se beneficia automaticamente porque já usa `openWhatsApp`.

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/lib/whatsapp.ts` | `formatWhatsAppPhone` volta a prefixar `55` para 10-11 dígitos |
| `src/pages/Pacientes.tsx` | Card do paciente usa `openWhatsApp` em vez de `window.open` cru |

