

## Plano: Adicionar colunas faltantes na tabela patients

### Analise

O SQL enviado descreve o schema desejado. Comparando com o banco atual:

- **Tabelas**: Todas ja existem (profiles, clinics, clinic_members, patients, appointments, anamneses, invites). Nao precisa recriar.
- **Enum app_role**: Ja inclui os 7 cargos (dono, recepcao, dentista, crm, sdr, admin, protetico).
- **RLS policies**: As existentes usam funcoes `SECURITY DEFINER` (get_user_clinic_ids, is_clinic_member, has_clinic_role) que evitam recursao infinita. As policies do SQL enviado usam subqueries diretas em clinic_members que **causariam recursao infinita** — nao devem ser aplicadas.
- **Trigger handle_new_user**: Ja existe como funcao. O trigger precisa ser verificado/recriado.
- **Colunas faltantes em patients**: `email`, `birthdate`, `cpf` nao existem no banco atual.

### O que fazer

**1. Migracao — adicionar colunas em patients**

```sql
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS cpf text;
```

**2. Migracao — garantir trigger existe**

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### O que NAO fazer

- **Nao recriar tabelas** — todas ja existem com dados
- **Nao substituir RLS policies** — as atuais usam funcoes SECURITY DEFINER que sao mais seguras e evitam recursao infinita
- **Nao remover colunas extras** que ja existem (status, origin, treatment_value, responsible_user_id em patients; duration_minutes, estimated_value em appointments, etc.)

### Arquivos

| Acao | Detalhe |
|------|---------|
| Migracao | ADD COLUMN email, birthdate, cpf em patients |
| Migracao | Recriar trigger on_auth_user_created (seguranca) |

