

## Diagnóstico

Você (Giseli) é dona da clínica e está em `/gestao/agenda`, mas o select de profissional aparece vazio — então não consegue criar agendamento.

Causa raiz: `AgendaVega.tsx` busca dentistas com embed PostgREST (`profiles(full_name)` dentro de `clinic_members`), mas **não existe foreign key** entre `clinic_members.user_id` e `profiles.id`. A query retorna 400 e a lista fica vazia. Por isso o sistema "não vê" você como profissional disponível, mesmo sendo dona.

Resposta direta à sua pergunta: **sim, dono pode (e deve) aparecer como profissional na agenda**. O bug é de query, não de permissão.

## Solução

Refatorar `AgendaVega.tsx` para buscar em **duas etapas** (mesmo padrão que `EquipeVega.tsx` já usa e funciona):

1. Buscar `clinic_members` da clínica com `role IN ('dono','dentista','admin')` e `is_active = true`
2. Buscar `profiles` correspondentes via `.in('id', userIds)`
3. Mesclar no client → lista de profissionais populada
4. Incluir o próprio dono logado como opção (Giseli aparece no select)

Adicional: se a lista vier vazia, mostrar mensagem clara com botão para `/gestao/equipe`.

### Arquivo

| Arquivo | Mudança |
|---|---|
| `src/pages/gestao/AgendaVega.tsx` | Substituir query embed por 2 queries + merge; ajustar `<Select>` de dentista |

Sem migração de banco. Sem mexer em RLS. Sem mexer em outras telas.

