

## Diagnóstico

Erro: `appointments_status_check` rejeita o valor enviado. O default da coluna é `'agendado'`, mas o código provavelmente envia outro (ex: `'scheduled'`).

## Plano

Corrigir `src/pages/gestao/AgendaVega.tsx`:

1. Localizar o insert em `appointments` no `createMutation`
2. Garantir que o campo `status` seja `'agendado'` (ou simplesmente omitir para usar o default do banco)
3. Ajustar também os valores usados ao mudar status no calendário (drag/click) para usar apenas: `'agendado'`, `'confirmado'`, `'realizado'`, `'cancelado'` (em português, minúsculo)
4. Ignorar campo `estimated_value` conforme solicitado — não bloquear submit por causa dele

### Arquivo

| Arquivo | Mudança |
|---|---|
| `src/pages/gestao/AgendaVega.tsx` | Remover/normalizar `status` no insert; padronizar valores de status em PT-BR minúsculo |

Sem migração de banco.

