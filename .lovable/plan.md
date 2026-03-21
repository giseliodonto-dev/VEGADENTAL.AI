

## Plano: Módulo de Pacientes (CRM Principal)

### Situação Atual

A tabela `patients` já existe no banco com todos os campos necessários (name, phone, origin, status, clinic_id, responsible_user_id, treatment_value). O cadastro rápido (`CadastroPaciente.tsx`) já insere pacientes e cria entrada no funil. Falta apenas a **página de listagem e gestão** dos pacientes.

### O que será criado

Uma página `/pacientes` com listagem completa, busca, edição rápida e ações integradas com Vendas e Agenda.

### Estrutura

```text
/pacientes
├── Barra de busca (nome ou telefone)
├── Filtros rápidos por status (lead, avaliação, tratamento, finalizado, perdido)
├── Tabela de pacientes
│   ├── Nome, Telefone, Origem, Status, Responsável, Valor
│   └── Ações: WhatsApp, Agendar, Ver no Funil, Editar
├── Dialog de edição rápida (atualizar status, valor, observações)
└── Botão "Novo Paciente" → link para /cadastro-paciente
```

### Arquivos

1. **Criar `src/pages/Pacientes.tsx`**
   - Listagem com busca por nome/telefone via `.ilike()`
   - Filtro por status com badges clicáveis
   - Tabela responsiva com colunas: Nome, Telefone, Origem, Status, Responsável, Valor
   - Dialog de edição inline para atualizar status e valor do tratamento
   - Ações rápidas: WhatsApp, agendar (toast "em breve"), ver funil

2. **Editar `src/App.tsx`**
   - Adicionar rota `/pacientes` protegida

3. **Editar `src/components/AppSidebar.tsx`**
   - Adicionar link "Pacientes" na sidebar (abaixo de Cadastro Rápido, com ícone Users)

4. **Editar `src/pages/Gestao.tsx`**
   - Atualizar card "Pacientes" para linkar para `/pacientes` (remover "Em breve")

### Detalhes Técnicos

- Query filtra por `clinic_id` do hook `useClinic`
- Busca usa `.or()` com `name.ilike.%term%,phone.ilike.%term%`
- Join com `profiles` para exibir nome do responsável
- Atualização de status também reflete no `sales_funnel` (atualiza stage correspondente)
- Status mapeados: lead, em_avaliacao, em_tratamento, finalizado, perdido
- Nenhuma alteração de schema necessária — tabela `patients` já está completa

