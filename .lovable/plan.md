

## Plano: Catalogo de Procedimentos Odontologicos

### Contexto

Atualmente, procedimentos sao uma lista hardcoded de 5 opcoes em `PacienteDetalhe.tsx`. Precisamos criar uma tabela de catalogo no banco e substituir os selects hardcoded por um componente com busca, favoritos e categorias.

### 1. Migracao de banco de dados

Nova tabela `procedures_catalog`:

```sql
CREATE TABLE public.procedures_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  name text NOT NULL,
  category text NOT NULL, -- preventivo, clinico_geral, endodontia, periodontia, protese, estetica, implantodontia, cirurgia, ortodontia, outros
  default_value numeric DEFAULT 0,
  is_favorite boolean DEFAULT false,
  is_custom boolean DEFAULT false, -- true = adicionado pelo gestor
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.procedures_catalog ENABLE ROW LEVEL SECURITY;
-- RLS: membros podem ver, donos podem CRUD
```

**Seed com procedimentos padrao**: Inserir os ~40 procedimentos listados (profilaxia, aplicacao de fluor, selante, restauracao em resina, etc.) via edge function ou migration com INSERT. Usar `is_custom = false` para os padrao.

### 2. Criar componente `ProcedureSelector`

**`src/components/ProcedureSelector.tsx`**

Componente reutilizavel usando Popover + Command (cmdk, ja disponivel no projeto):
- Campo de busca com filtro por nome
- Agrupado por categoria (Preventivos, Clinico Geral, Endodontia, etc.)
- Icone de estrela para favoritar/desfavoritar (toggle no banco)
- Favoritos aparecem primeiro na lista
- Ao selecionar, retorna `{ id, name, category, default_value }`
- Botao "Adicionar procedimento personalizado" no final da lista

### 3. Atualizar `PacienteDetalhe.tsx`

- Remover `procedureOptions` hardcoded
- Substituir Select de procedimento pelo `ProcedureSelector`
- Ao selecionar procedimento, preencher automaticamente o campo Valor com `default_value` (se definido e campo vazio)
- Salvar `procedure_type` com o nome do procedimento selecionado

### 4. Atualizar `AgendaVega.tsx`

- Substituir campo livre de procedimento pelo `ProcedureSelector`
- Mesmo comportamento de auto-preenchimento de valor

### 5. Rota de gerenciamento (opcional, dentro de Configuracoes)

Nao criar pagina separada agora — gerenciamento de favoritos e procedimentos customizados sera feito inline no proprio seletor.

### Arquivos

| Acao | Arquivo |
|------|---------|
| Migracao | 1 SQL (tabela + seed ~40 procedimentos + RLS) |
| Criar | `src/components/ProcedureSelector.tsx` |
| Editar | `src/pages/PacienteDetalhe.tsx` (usar ProcedureSelector) |
| Editar | `src/pages/gestao/AgendaVega.tsx` (usar ProcedureSelector) |

### Detalhes tecnicos

- Seed: cada clinica precisa dos seus procedimentos. Opcao 1: seed na migration com trigger que copia ao criar clinica. Opcao 2: seeder no frontend ao primeiro acesso. **Opcao escolhida**: criar uma funcao DB `seed_default_procedures(clinic_id)` chamada no onboarding (ClinicOnboarding.tsx) apos criar a clinica.
- Busca: filtro local via Command/cmdk (sem roundtrip ao banco)
- Favoritos: toggle via mutation que faz UPDATE no `is_favorite`
- Procedimento customizado: dialog inline para inserir nome + categoria + valor padrao

