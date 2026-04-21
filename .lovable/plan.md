
## Objetivo

Corrigir definitivamente o erro `violates check constraint "patients_origin_check"` no cadastro rápido de pacientes, ajustando o payload enviado para o banco conforme as constraints reais da tabela `patients`.

## Causa confirmada

No arquivo `src/pages/Pacientes.tsx`, o cadastro rápido está enviando:

```ts
origin: occupation.trim() || null,
status: 'lead'
```

Isso quebra quando o campo “Profissão” recebe textos como `Advogada`, `Dentista`, etc., porque a coluna `origin` aceita apenas valores padronizados em minúsculo:

```text
instagram, indicacao, google, facebook, whatsapp, site, outros
```

## Mudanças que serão aplicadas

### 1. Ajustar o payload do cadastro rápido

Em `src/pages/Pacientes.tsx`, trocar o objeto enviado no insert para usar somente os campos essenciais e válidos:

```ts
const payload = {
  name: name.trim(),
  phone: phone.trim(),
  clinic_id: clinicId,
  origin: "indicacao",
  status: "em_avaliacao",
};
```

O fluxo continuará sendo:

```ts
const { data, error } = await supabase
  .from("patients")
  .insert(payload)
  .select()
  .single();

if (error) throw error;

navigate(`/pacientes/${data.id}`);
```

### 2. Ignorar “Profissão” no insert

O campo `Profissão` não existe na tabela `patients`.

Por isso, ele não será mais enviado como `origin`.

Para evitar confusão, o cadastro rápido deixará de tratar “Profissão” como origem do paciente. A criação rápida ficará focada em:

- Nome completo
- WhatsApp
- Clínica vinculada automaticamente
- Origem padrão: `indicacao`
- Status inicial: `em_avaliacao`

### 3. Garantir textos em minúsculo

Os valores fixos enviados serão exatamente:

```ts
origin: "indicacao"
status: "em_avaliacao"
```

Ambos em minúsculo e compatíveis com as constraints do banco.

### 4. Manter tratamento de erro correto

Se o banco rejeitar o cadastro por qualquer outro motivo:

- O modal continuará aberto.
- O toast exibirá a mensagem real do erro.
- O console continuará registrando o payload e o erro para diagnóstico.

### 5. Atualizar exibição na lista

Como `origin` representa a origem do paciente, e não profissão, a listagem deixará de sugerir “Profissão”.

A exibição será ajustada para algo como:

```text
Origem: indicação
```

em vez de:

```text
Sem profissão
```

## Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `src/pages/Pacientes.tsx` | Corrigir payload do insert, remover uso de profissão como `origin`, usar `origin: "indicacao"` e `status: "em_avaliacao"` |

## O que não será alterado

- Não será feita mudança no banco de dados.
- Não será alterada a RLS.
- Não será criado campo novo de profissão.
- Não será exigido CPF, endereço ou outros campos complexos no cadastro rápido.
