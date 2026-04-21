
## Objetivo

Atualizar a comunicação WhatsApp da clínica para usar o número oficial **5511917031358**, normalizar o salvamento e adicionar um botão de teste em Configurações.

## Diagnóstico

- A tabela `clinics` já tem coluna `phone` (text) — basta gravar `5511917031358` (só dígitos).
- `src/lib/whatsapp.ts` já existe e provavelmente já gera links `wa.me`. Vou checar se ele aceita um número de origem/destino e se normaliza corretamente. Se não normalizar, ajusto.
- Convites de equipe (`EquipeVega.tsx`) hoje chamam `openWhatsApp(null, mensagem)` — abrem o WhatsApp **sem destinatário** (o usuário escolhe). A pedido, vamos compor o link **com o número oficial da clínica** como destino, para o dono mandar o link a si mesmo / encaminhar.
- Páginas de paciente que disparam WhatsApp usam o telefone do paciente (não mexer — o destinatário ali é o paciente).

## Mudanças

### 1. `src/lib/whatsapp.ts`
- Garantir função `normalizePhone(raw)` que remove tudo que não é dígito.
- `openWhatsApp(phone, message)` já existe — confirmar que monta `https://wa.me/<digits>?text=<encoded>` e que aceita `null` (abre wa.me sem destino).

### 2. Salvar número da clínica normalizado — `src/pages/Configuracoes.tsx`
- No `handleSave`, antes do `update`, normalizar `phone` com `phone.replace(/\D/g, "")` para gravar apenas dígitos (`5511917031358`).
- Manter o input com máscara visual livre, mas persistir limpo.

### 3. Gravar número oficial agora (one-shot)
- Rodar um `UPDATE` direto na clínica **GC Odontologia** setando `phone = '5511917031358'` (via insert tool, operação de dados).

### 4. Botão "Testar WhatsApp da Clínica" — `src/pages/Configuracoes.tsx`
- Adicionar botão dentro do card "Identidade da Clínica", abaixo do campo telefone.
- Ação: usa o `phone` normalizado do estado atual; abre `https://wa.me/<phone>?text=Teste de integração VEGA Dental AI ✅` em nova aba.
- Validações: se `phone` vazio → toast "Cadastre um número antes de testar"; se menos de 10 dígitos → toast "Número inválido".
- Mostrar feedback: toast "Abrindo WhatsApp..." ao clicar.

### 5. Convites de equipe — `src/pages/gestao/EquipeVega.tsx`
- Buscar `phone` da clínica (junto com `name`) no `useQuery` `clinic-name`.
- `sendWhatsApp(link)` passa a usar `openWhatsApp(clinicPhone, mensagem)` em vez de `null`, compondo o link já endereçado ao número oficial da clínica. Se a clínica ainda não tiver telefone, mantém o comportamento atual (sem destino) com toast informativo.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/lib/whatsapp.ts` | Confirmar/garantir normalização de dígitos no link `wa.me` |
| `src/pages/Configuracoes.tsx` | Normalizar `phone` no save + botão "Testar WhatsApp da Clínica" |
| `src/pages/gestao/EquipeVega.tsx` | Buscar `phone` da clínica e usar como destino nos convites |
| **DB (insert tool)** | `UPDATE clinics SET phone='5511917031358' WHERE name ILIKE 'GC Odontologia'` |

## O que NÃO muda
- Schema do banco (coluna `phone` já existe).
- RLS.
- WhatsApp para pacientes (continua usando o telefone do paciente como destino).
- Máscara de exibição do telefone no input (usuário pode digitar com formatação).
