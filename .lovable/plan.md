

## Plano: Anamnese com Assinatura Digital do Paciente

### 1. Migracao de banco de dados

**Nova tabela `anamneses`:**

```sql
CREATE TABLE public.anamneses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  diseases text[] DEFAULT '{}',
  surgeries boolean DEFAULT false,
  allergies text,
  medications text,
  smoker boolean DEFAULT false,
  alcohol boolean DEFAULT false,
  bruxism boolean DEFAULT false,
  current_pain boolean DEFAULT false,
  gum_bleeding boolean DEFAULT false,
  sensitivity boolean DEFAULT false,
  response_date timestamptz,
  signature text,              -- nome completo como assinatura digital
  signed_at timestamptz,       -- data/hora da assinatura
  public_token text UNIQUE DEFAULT gen_random_uuid()::text,
  status text NOT NULL DEFAULT 'nao_enviada',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**RLS:**
- Membros: SELECT, INSERT, UPDATE via `get_user_clinic_ids`
- Donos: DELETE via `has_clinic_role`
- Anon: SELECT e UPDATE por `public_token` (formulario publico)

### 2. Pagina publica — `src/pages/AnamnesePublica.tsx`

- Rota: `/anamnese/:token` (sem ProtectedRoute)
- Layout mobile-friendly, visual limpo
- Formulario completo:
  - Multi-checkbox para doencas (diabetes, hipertensao, cardiopatia, outros)
  - Toggles sim/nao: cirurgias, fumante, alcool, bruxismo, dor atual, sangramento, sensibilidade
  - Campos texto: alergias, medicamentos
- **Secao de assinatura digital** ao final:
  - Campo "Nome completo" obrigatorio
  - Texto legal: "Ao assinar, confirmo que as informacoes acima sao verdadeiras"
- Botao "Assinar e Enviar"
- Ao enviar: salva respostas + `signature` + `signed_at` + status `respondida`
- Tela de confirmacao apos envio

### 3. Integracao na ficha do paciente — `src/pages/PacienteDetalhe.tsx`

- Nova secao "Anamnese" com:
  - Se nao existe: botao "Enviar Anamnese" (cria registro + gera token)
  - Se existe:
    - Badge de status (nao enviada / enviada / respondida)
    - Botoes "Copiar Link" e "Enviar WhatsApp"
    - Se respondida: resumo das respostas + assinatura + data
    - Permitir visualizar e editar

### 4. Rotas — `src/App.tsx`

- Adicionar rota publica `/anamnese/:token`

### Arquivos

| Acao | Arquivo |
|------|---------|
| Migracao | 1 SQL (anamneses + RLS) |
| Criar | `src/pages/AnamnesePublica.tsx` |
| Editar | `src/pages/PacienteDetalhe.tsx` |
| Editar | `src/App.tsx` |

### Fluxo

```text
Dentista abre ficha do paciente
  → Clica "Enviar Anamnese"
  → Copia link ou envia via WhatsApp

Paciente abre link publico
  → Preenche formulario de saude
  → Digita nome completo como assinatura
  → Clica "Assinar e Enviar"
  → Anamnese salva com assinatura e data

Dentista ve na ficha:
  → Status "Respondida"
  → Resumo + assinatura do paciente
```

