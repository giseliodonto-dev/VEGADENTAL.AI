Plan: Ajustar o cabeçalho e os dados do paciente no PDF do Plano de Tratamento / Orçamento

Objetivo
Restaurar e garantir que o PDF do Plano de Tratamento exiba, no topo, o cabeçalho institucional fixo da GC Odontologia (nome, profissional responsável, CRO e unidades) e os dados do paciente (nome, CPF/RG, emissão), mantendo a tabela de procedimentos, valores e formas de pagamento sem texto contratual. O layout deve caber em uma página A4 sem cortes ou sumiço de variáveis.

Problemas identificados no estado atual
- O gerador `src/utils/treatmentPlanPdf.ts` puxa os dados da clínica do banco, mas os valores cadastrados não correspondem ao solicitado:
  - nome: "GC ODONTOLOGIA" → precisa ser "GC Odontologia";
  - responsible_name: "Dra. Giseli Costa" → precisa ser "Dra. Giseli da Costa Lage";
  - responsible_cro: "CROSP 165.429" → precisa ser "CROSP 165429";
  - address: apenas o endereço de Cajamar → precisa indicar "Cajamar e Alphaville".
- A interface de dados do paciente no PDF e na página pública exibe CPF e telefone, mas não exibe o RG (a coluna `rg` já existe em `patients`).
- O telefone da clínica está armazenado sem formatação ("5511917031358"), o que prejudica a leitura no cabeçalho.
- O espaçamento vertical do PDF pode empurrar a seção de assinaturas para fora da página em orçamentos com muitos itens.

Ações

1. Corrigir o registro da clínica no banco de dados
Atualizar a clínica `015e4c57-1c43-4623-8b60-23ae2d1d9110` para os valores institucionais corretos:
- `name` = "GC Odontologia";
- `responsible_name` = "Dra. Giseli da Costa Lage";
- `responsible_cro` = "CROSP 165429";
- `address` = "Unidades: Cajamar e Alphaville";
- formatar `phone` para exibição (ex.: "(11) 91703-1358").

2. Atualizar `src/utils/treatmentPlanPdf.ts`
- Adicionar `rg?: string | null` na interface `TreatmentPlanPdfData`.
- Substituir a linha de dados do paciente para exibir CPF e RG em vez de CPF e telefone:
  - ex.: "CPF: 123.456.789-00 · RG: 12.345.678-9".
- Aplicar formatação amigável ao telefone da clínica no cabeçalho.
- Otimizar o espaçamento vertical para evitar cortes:
  - reduzir levemente as alturas entre cabeçalho, título e box do paciente;
  - garantir que a seção de assinaturas seja posicionada com margem mínima segura;
  - forçar recálculo de quebra de página antes das assinaturas quando o conteúdo exceder a área útil.

3. Atualizar `src/pages/OrcamentoPublico.tsx`
- Incluir `rg` na consulta de pacientes (`supabase.from("patients").select("name, cpf, rg, phone")`).
- Passar `rg` para `generateTreatmentPlanPdf` no `handleDownloadPdf`.
- Ajustar o box de dados do paciente na interface web para exibir CPF e RG (mantendo telefone opcional secundário se desejado).
- Manter o resto do layout limpo (procedimentos, valores, formas de pagamento, assinaturas) sem texto contratual.

4. Verificação visual obrigatória
- Gerar um PDF de exemplo usando os dados reais da clínica e de um paciente de teste.
- Converter para imagem com `pdftoppm` e inspecionar:
  - cabeçalho com nome, profissional, CRO e unidades visíveis;
  - dados do paciente com CPF/RG e data de emissão;
  - tabela, totais e formas de pagamento sem cortes;
  - seção de assinaturas dentro da página A4.
- Se houver corte ou overflow, iterar nos espaçamentos até resolvido.

Arquivos afetados
- `src/utils/treatmentPlanPdf.ts`
- `src/pages/OrcamentoPublico.tsx`

Alterações no banco
- UPDATE na tabela `clinics` (id `015e4c57-1c43-4623-8b60-23ae2d1d9110`).
- Nenhuma alteração de schema é necessária; a coluna `rg` já existe em `patients`.

Não incluído
- Nenhuma mudança nos valores dos procedimentos, descontos ou regras de pagamento.
- Nenhuma reintrodução de texto jurídico/contratual.
