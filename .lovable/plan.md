### 1. Refatoração do Status do Orçamento (Tratamento)
- **Local:** `src/pages/PacienteDetalhe.tsx` (na aba "Plano de Tratamento").
- **Mudança:** A tabela de procedimentos passará a ter um seletor (dropdown) para o `status` do tratamento, com as opções:
  - **Em Análise** (`em_analise`)
  - **Aprovado** (`aprovado`)
  - **Recusado** (`recusado`)
- Somente os procedimentos marcados como **Aprovados** serão contabilizados no débito total do paciente. (As opções antigas como `planejado`, `em_andamento` etc. continuarão sendo exibidas caso existam, mas a edição focará no novo fluxo de aprovação).

### 2. Nova Aba "Financeiro do Paciente"
- **Local:** `src/pages/PacienteDetalhe.tsx`.
- **Mudança:** Criação de uma nova aba chamada **Financeiro do Paciente**.

#### A. Painel de Resumo
- **Valor Total Aprovado:** Soma de todos os procedimentos (`treatments`) do paciente com status igual a `aprovado`.
- **Valor Já Pago:** Soma de todos os pagamentos confirmados registrados no módulo Financeiro (`financials`) vinculados a este paciente (tipo `entrada` e status `pago`).
- **Saldo Devedor:** A diferença entre o *Valor Total Aprovado* e o *Valor Já Pago*. Se o valor for maior que zero, será destacado em **vermelho**, para alertar o dentista antes do atendimento.

#### B. Botão "Registrar Recebimento"
- Um botão que abre um modal para registrar o pagamento diretamente na ficha do paciente.
- **Campos:** 
  - Valor (pré-preenchido com o saldo devedor, mas editável)
  - Data (padrão: hoje)
  - Forma de Pagamento (Pix, Cartão de Crédito, Cartão de Débito, Dinheiro, Boleto, etc.)
  - Descrição / Procedimento Pago
  - Número de Parcelas (caso seja cartão parcelado)
- **Integração Geral:** Ao salvar, o sistema insere o registro na tabela `financials` (categoria `recebimento`, tipo `entrada`), incluindo o ID do paciente e a descrição preenchida. Isso reflete de forma automática e imediata na página de **Financeiro Geral** da clínica.

#### C. Extrato de Pagamentos
- Tabela de extrato financeiro na mesma aba, buscando diretamente os registros da tabela `financials` para este paciente.
- **Colunas:** Data, Descrição, Forma de Pagamento, Status e Valor.
- Os pagamentos serão exibidos em ordem cronológica (mais recentes primeiro).

### 3. Design & UX
- Utilização da mesma padronização visual da plataforma: fontes Inter/Montserrat, cores da marca (Azul Petróleo e Dourado) e ícones da biblioteca `lucide-react`.
- O saldo devedor receberá um destaque específico (`text-red-600` ou similar) garantindo que a inadimplência seja visível logo que a aba for acessada.

Este plano engloba todas as alterações necessárias para o módulo Financeiro Individual do paciente, utilizando as tabelas já existentes no banco de dados (`treatments` e `financials`) sem a necessidade de migrações complexas.