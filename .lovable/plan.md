# Odontograma Inteligente — Substituição Atômica

## 1. Limpeza do odontograma antigo

Remover do `src/pages/PacienteDetalhe.tsx`:

- Constantes `TOOTH_STATES`, `UPPER_TEETH`, `LOWER_TEETH` e o componente interno `Tooth` (blocos coloridos).
- Query `["odontogram", id]` e mutação `saveOdontogram` (tabela legada `odontograms`).
- `<TabsContent value="odonto">` antigo e o botão "Salvar Odontograma".
- Import `Smile` (se não usado em outro lugar).

A tabela `odontograms` permanece no banco (apenas deixamos de ler/escrever) — sem migração destrutiva para não correr risco com dados existentes. Pode ser depreciada depois.

## 2. Nova arquitetura de arquivos

```text
src/components/odontogram/
  IntelligentOdontogram.tsx     ← componente raiz com Tabs "Diagnóstico Inicial" / "Evolução Clínica"
  ToothSVG.tsx                  ← SVG anatômico por tipo (incisivo, canino, pré-molar, molar) com 5 faces clicáveis + raiz
  ToothActionMenu.tsx           ← Popover glassmorphism com 2 colunas (Diagnóstico / Tratamento)
  odontogramConfig.ts           ← mapas: numeração FDI, tipo por dente, cores por condição, mapeamento condição→procedimento
  useOdontogram.ts              ← hooks React Query (fetch, upsert por marca, geração de treatment)
```

Rota nova na aba "Odontograma" do `PacienteDetalhe`: substitui o conteúdo antigo por `<IntelligentOdontogram patientId={id} clinicId={clinicId} />`.

## 3. UI

- Card com cabeçalho discreto: **"Odontograma Clínico"** (aba Antes) e **"Planejamento Estético"** (aba Depois). Sem "Dental note" / "Teeth collection".
- Tabs com fundo `bg-white` borda `amber-400/30` (padrão do projeto).
- Arcada superior 18→11 / 21→28 e inferior 48→41 / 31→38 em duas linhas centralizadas.
- Cada dente: SVG anatômico com silhuetas vetoriais por tipo:
  - Incisivos (11–13, 21–23, 31–33, 41–43 ajustados): silhueta retangular afilada.
  - Caninos: ponta única.
  - Pré-molares: duas cúspides.
  - Molares: quatro cúspides com sulco em "+".
- 5 zonas como `<path>` independentes: Vestibular, Palatina/Lingual, Oclusal/Incisal, Mesial, Distal + Raiz.
- Hover: `stroke #103444` + `filter: drop-shadow(0 0 4px rgba(16,52,68,.4))`.
- Cores Antes: cárie `rgba(239,68,68,.55)`, fratura tracejado vermelho, ausente `#94a3b8` opaco, canal necessário hachura.
- Cores Depois: restauração `#103444`, endo concluída anel azul, coroa `#c9a24c` com brilho, implante ícone parafuso dourado.

## 4. Menu flutuante (Glassmorphism)

`Popover` do shadcn estilizado:

```text
backdrop-blur-xl bg-white/40 border border-white/40 shadow-2xl rounded-2xl
```

Duas colunas:

- **Diagnósticos** (vermelho `#ef4444`): Cárie, Fratura, Canal Necessário, Ausente.
- **Tratamentos** (azul/dourado): Restauração, Endodontia Concluída, Implante, Coroa/Prótese.

Cada item: ícone Lucide + label, click → salva marca e fecha menu.

## 5. Integração com Plano de Tratamento

Mapa condição → procedimento (`odontogramConfig.ts`):


| Condição marcada      | Procedimento gerado             |
| --------------------- | ------------------------------- |
| Cárie (oclusal)       | Restauração 1 face — Dente N    |
| Cárie (2+ faces)      | Restauração 2 faces — Dente N   |
| Canal necessário      | Endodontia — Dente N            |
| Fratura               | Avaliação/Restauração — Dente N |
| Ausente               | Implante — Dente N              |
| Coroa/Prótese marcada | Coroa protética — Dente N       |


Ao marcar **Diagnóstico** na visão Antes, faz `insert` em `treatments` com `status='planejado'`, `procedure_type` derivado, `tooth_number` e `value` do `procedures_catalog` (match por nome). Se já existir treatment com mesmo `tooth_number` + `procedure_type` + `status='planejado'`, não duplica.

Ao marcar **Tratamento concluído** na visão Depois, faz `update` no treatment correspondente para `status='executado'` (ou cria já como executado, se não existir).

## 6. Banco de Dados

Nova tabela `patient_odontogram` (uma linha por marca, não um JSON único — permite histórico e queries):

```sql
CREATE TABLE public.patient_odontogram (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  tooth_number text NOT NULL,           -- ex: "16"
  face text NOT NULL,                    -- vestibular|palatina|oclusal|mesial|distal|raiz|dente
  status_type text NOT NULL,             -- 'inicial' | 'final'
  condition text NOT NULL,               -- carie|fratura|canal|ausente|restauracao|endo|implante|coroa
  treatment_id uuid,                     -- vínculo opcional
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, tooth_number, face, status_type)
);

ALTER TABLE public.patient_odontogram ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view odontogram"
  ON public.patient_odontogram FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members insert odontogram"
  ON public.patient_odontogram FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members update odontogram"
  ON public.patient_odontogram FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos delete odontogram"
  ON public.patient_odontogram FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'::app_role));

CREATE INDEX idx_patient_odontogram_patient ON public.patient_odontogram(patient_id, status_type);

CREATE TRIGGER trg_patient_odontogram_updated
  BEFORE UPDATE ON public.patient_odontogram
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

UPSERT via `onConflict: 'patient_id,tooth_number,face,status_type'` para que clicar novamente atualize a condição em vez de duplicar. Clique na mesma condição já marcada → DELETE (toggle off).

## 7. Performance / UX

- React Query: uma query por `(patient_id, status_type)`. Optimistic updates no `mutate` para cor instantânea.
- `Tabs` controlado mantém estado entre Antes/Depois sem refetch (mesma queryKey base).
- SVG renderizado uma vez; faces são `<path>` com `data-face` e handler único por dente.

## Execução

Tudo em **uma única rodada** após aprovação:

1. Migração SQL acima.
2. Criação dos 5 arquivos em `src/components/odontogram/`.
3. Edição cirúrgica do `PacienteDetalhe.tsx` removendo o antigo e plugando o novo componente.

Nenhum arquivo do PDF de receita / evolução clínica é tocado.

O plano está perfeito e aprovado! Pode executar a substituição atômica exatamente como descrito no escopo. Crie a tabela no banco de dados, os novos arquivos anatômicos em SVG e faça a limpeza do componente antigo no `PacienteDetalhe.tsx` agora mesmo."

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;