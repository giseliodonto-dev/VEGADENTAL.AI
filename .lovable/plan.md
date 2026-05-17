## Diagnóstico

Verifiquei o código. Os "formulários antigos" são na verdade o componente **`src/components/documents/DocumentGenerator.tsx`** (renderizado em `/documentos`), que hoje tem 5 botões inline (RECEITA, ATESTADO, DECLARACAO, RADIOGRAFIA, RELATORIO) compartilhando um único `<textarea>` editável e um botão genérico de imprimir. É exatamente este o layout "desorganizado e poluído" a ser eliminado. Não existem subcomponentes em `src/components/patients/`, nem aba "Documentos" dentro de `PacienteDetalhe.tsx` — então o trabalho é refatorar a página global `/documentos` e (opcionalmente) plugar o mesmo módulo na ficha do paciente.

## Arquitetura nova

```text
/documentos
└── Sidebar de pastas (Quiet Luxury, vertical)
    ├── 📄 Declaração de Comparecimento
    ├── 🩺 Atestado Odontológico
    ├── 📋 Relatório Ortodôntico
    └── 📨 Encaminhamentos                  ← nova pasta (placeholder)

src/components/documents/
  DocumentsWorkspace.tsx        ← layout sidebar + área principal + patient picker
  PatientPicker.tsx             ← combobox que carrega patients da clínica (puxa name/rg/cpf)
  DocumentLetterhead.tsx        ← preview "folha de papel timbrada" + rodapé fixo
  DocumentActions.tsx           ← botões Salvar + WhatsApp
  forms/
    ComparecimentoForm.tsx
    AtestadoForm.tsx
    RelatorioOrtodonticoForm.tsx
    EncaminhamentosFolder.tsx   ← placeholder com card "em breve / lista de encaminhamentos"
  templates/
    documentTemplates.ts        ← textos institucionais literais + interpolação {{var}}
    signatureFooter.ts          ← "Cajamar, {{data}}." + Dra. Giseli + CROSP + rodapé
  pdf/
    generateDocumentPdf.ts      ← jsPDF (mesmo padrão de prescriptionPdf.ts)

src/pages/Documentos.tsx        ← passa a renderizar <DocumentsWorkspace />
src/components/documents/DocumentGenerator.tsx  ← REMOVIDO
```

## Sub-abas — campos e textos (literal)

**Declaração de Comparecimento** — Inputs: `data_consulta` (date), `hora_inicio` (time), `hora_fim` (time). Nome/CPF/RG vêm do paciente selecionado. Texto base exato conforme o prompt, com `{{patient.name}}`, `{{patient.cpf}}`, `{{data_consulta}}`, `{{hora_inicio}}`, `{{hora_fim}}`.

**Atestado Odontológico** — Inputs: `numero_de_dias` (number), `data_inicio_afastamento` (date), `Switch` "Privacidade do CID". Switch ligado → frase de omissão. Switch desligado → input `campo_cid` + frase com CID. Texto base da Lei 5.081/66 exatamente como no prompt.

**Relatório Ortodôntico** — Inputs: `diagnostico`, `aparelho`, `data_inicio`, `fase_atual`, `nivel_cooperacao` (Select: Boa/Regular/Ruim), `meses_estimados`. Texto institucional exato.

**Encaminhamentos** — pasta criada agora como placeholder (lista vazia + card "Nenhum encaminhamento ainda. Em breve."). Pronta para receber o formulário no próximo ciclo.

## Rodapé fixo (todos os documentos)

```
Cajamar, {{data_atual_por_extenso}}.

_________________________________
Dra. Giseli da Costa Lage
Cirurgiã-Dentista | CROSP 165429 | GC Odontologia

Atendimento Clínico: Unidades Cajamar e Alphaville
```

Data via `Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })`.

## Preview "papel timbrada"

- Container A4 simulado, `bg-white`, `shadow-md`, `border-amber-400/20`, `rounded-xl`, padding 48px, fonte serifada para corpo.
- Topo: nome da clínica (puxado de `clinics`) + logo opcional + filete dourado.
- Corpo: texto justificado interpolado em tempo real conforme o usuário digita.

## Botões inteligentes

- **💾 Salvar Documento** (`variant="outline"`): gera PDF via jsPDF → faz upload para Supabase Storage no bucket `patient-documents` no caminho `clinic_id/patient_id/{doc_type}-{timestamp}.pdf` → insere em `patient_documents`.
- **💬 Enviar no WhatsApp** (`variant="gold"`): executa o Salvar acima → dispara `downloadPdf()` no navegador → abre WhatsApp via `openWhatsApp(patient.phone, mensagem)` com texto cortês: *"Olá {nome}, segue em anexo seu {tipo} emitido em {data}. Qualquer dúvida estamos à disposição. — GC Odontologia"*.

## Banco de dados — migration única

Tabela `patient_documents`:
- `id`, `clinic_id`, `patient_id`, `doc_type text check in ('comparecimento','atestado','relatorio_ortodontico','encaminhamento')`, `payload jsonb` (campos preenchidos), `rendered_text text`, `pdf_path text`, `created_by uuid`, `created_at`.
- RLS por `clinic_id IN (SELECT get_user_clinic_ids(auth.uid()))`; delete só por dono via `has_clinic_role(...,'dono')`.
- Index `(patient_id, created_at desc)`.

Bucket `patient-documents` (privado) com RLS em `storage.objects`:
- SELECT/INSERT permitidos quando `(storage.foldername(name))[1] = clinic_id::text` e o user é membro da clínica.
- DELETE apenas para dono da clínica.

## Identidade visual (Quiet Luxury)

- Sidebar: `bg-white` + borda `border-amber-400/30`, itens com ícone lucide à esquerda, item ativo `bg-[#103444] text-white` com filete dourado à direita.
- Inputs: borda `amber-400/30`, focus ring `#103444`.
- Cards: `rounded-xl`, sombras suaves.
- Tipografia: Plus Jakarta Sans nos títulos, Inter no corpo do app, serif clássica apenas no preview do documento.

## Integração na ficha do paciente (bônus)

Como o `DocumentsWorkspace` recebe `patient` como prop, basta adicionar uma `<TabsTrigger value="documentos">` em `PacienteDetalhe.tsx` que renderiza `<DocumentsWorkspace patient={patient} hideSidebar={false} />`. O patient picker é escondido (paciente já vem do contexto) e a sidebar permanece. **Esta integração é opcional neste ciclo** — confirme se quer agora ou em ciclo seguinte.

## Entregáveis

1. Migration: tabela `patient_documents` + bucket privado `patient-documents` + RLS storage.
2. 9 arquivos novos em `src/components/documents/` (estrutura acima).
3. `src/utils/` reutilizado para padrões jsPDF.
4. `src/pages/Documentos.tsx` simplificado para apenas montar `<DocumentsWorkspace />`.
5. Remoção do `DocumentGenerator.tsx` atual.
6. (Opcional) edição cirúrgica em `PacienteDetalhe.tsx` para nova aba "Documentos".

Nenhuma alteração em prescrições, orçamentos, odontograma ou outras áreas do app.