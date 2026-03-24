

## Plano: Anamnese editavel na ficha do paciente + link publico opcional

### Mudanca de abordagem

Atualmente: o dentista clica "Enviar Anamnese" → cria registro vazio → copia link → paciente preenche externamente.

**Novo fluxo**: Ao clicar "Criar Anamnese", o formulario completo aparece diretamente na ficha do paciente, permitindo que a secretaria preencha ali mesmo. Alem disso, ha a opcao de gerar o link publico para envio ao paciente.

### Alteracoes em `src/pages/PacienteDetalhe.tsx`

**Secao de Anamnese reformulada:**

1. **Sem anamnese**: Botao "Criar Anamnese" (em vez de "Enviar Anamnese")
2. **Anamnese criada**: Formulario inline editavel com todos os campos:
   - Checkboxes de doencas (diabetes, hipertensao, cardiopatia, outros)
   - Toggles: cirurgias, fumante, alcool, bruxismo, dor atual, sangramento, sensibilidade
   - Campos texto: alergias, medicamentos
   - Secao de assinatura (nome + data) — visivel mas preenchida pelo paciente via link
   - Botao "Salvar" para a secretaria salvar alteracoes
3. **Acoes extras** (sempre visiveis quando anamnese existe):
   - Badge de status
   - Botao "Copiar Link" para enviar ao paciente
   - Botao "WhatsApp" se paciente tem telefone
4. **Se respondida pelo paciente**: mostrar assinatura e data de resposta

### Mutacao `createAnamnese`

Manter como esta (cria registro no banco), mas apos criar, o formulario inline aparece imediatamente para edicao.

### Nova mutacao `updateAnamnese`

Adicionar mutacao para salvar as edicoes feitas pela secretaria diretamente na ficha, atualizando todos os campos da anamnese sem alterar `status` para "respondida" (isso so acontece quando o paciente assina via link publico).

### Nenhuma alteracao no banco

A tabela `anamneses` ja tem todos os campos necessarios. As foreign keys ainda estao ausentes mas nao bloqueiam este fluxo (queries usam `patient_id` direto sem join).

### Migracao SQL — Adicionar foreign keys

Adicionar as FKs que estao faltando para garantir integridade:

```sql
ALTER TABLE public.anamneses
  ADD CONSTRAINT anamneses_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  ADD CONSTRAINT anamneses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
```

### Pagina publica (`AnamnesePublica.tsx`)

Corrigir a query para nao usar join com `patients!inner` (que falha sem FK). Usar duas queries separadas: buscar anamnese por token, depois buscar nome do paciente pelo `patient_id`.

### Arquivos

| Acao | Arquivo |
|------|---------|
| Migracao | 1 SQL (foreign keys) |
| Editar | `src/pages/PacienteDetalhe.tsx` — formulario inline editavel |
| Editar | `src/pages/AnamnesePublica.tsx` — corrigir query |

### Fluxo final

```text
Dentista/Secretaria abre ficha do paciente
  → Clica "Criar Anamnese"
  → Formulario aparece inline na ficha
  → Secretaria preenche os campos e salva
  → Opcionalmente: copia link ou envia WhatsApp

Se enviado ao paciente:
  → Paciente abre link publico
  → Preenche/corrige dados + assina
  → Status muda para "Respondida"

Dentista ve na ficha:
  → Dados preenchidos + assinatura do paciente
```

