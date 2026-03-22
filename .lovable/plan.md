

## Plano: Corrigir cadastro de pacientes — constraint de origem

### Problema

A tabela `patients` tem um CHECK constraint que aceita apenas: `instagram`, `indicacao`, `google`, `facebook`, `site`, `outros`. O formulario envia valores capitalizados (`Instagram`, `Indicação`) e inclui `WhatsApp` que nao existe no constraint.

### Solucao

1. **Migracao SQL**: Remover o constraint antigo e recriar com valores atualizados incluindo `whatsapp`:

```sql
ALTER TABLE public.patients DROP CONSTRAINT patients_origin_check;
ALTER TABLE public.patients ADD CONSTRAINT patients_origin_check
  CHECK (origin = ANY (ARRAY['instagram','indicacao','google','facebook','whatsapp','site','outros']));
```

2. **Editar `src/pages/CadastroPaciente.tsx`**: Alterar o array `origins` para usar valores em minusculo no `value` mas manter labels legiveis:

```
{ value: "instagram", label: "Instagram" },
{ value: "google", label: "Google" },
{ value: "indicacao", label: "Indicação" },
{ value: "facebook", label: "Facebook" },
{ value: "whatsapp", label: "WhatsApp" },
{ value: "outros", label: "Outros" },
```

Atualizar o Select para usar `value/label` ao inves de string direta.

### Arquivos

| Acao | Arquivo |
|------|---------|
| Migracao | 1 SQL (drop + recreate constraint) |
| Editar | `src/pages/CadastroPaciente.tsx` |

