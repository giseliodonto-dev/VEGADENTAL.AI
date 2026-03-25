

## Plano: Refinamento UX do VEGA

### Problemas identificados

1. **Agenda ausente na sidebar** — so acessivel via /gestao/agenda, mas nao aparece no menu lateral
2. **Edicao de paciente limitada** — dialog na listagem so edita status e valor; nao edita nome, telefone, origem
3. **Ficha do paciente sem edicao inline** — nao e possivel editar dados basicos (nome, telefone, origem, status) diretamente na ficha
4. **Acoes duplicadas na tabela** — dois icones Eye (ver ficha + ver funil), confusos
5. **Cadastro exige login** — CadastroPaciente esta atras de ProtectedRoute

### Correcoes

#### 1. Adicionar "Agenda" na sidebar — `AppSidebar.tsx`

- Adicionar item "Agenda" no grupo "Minha Clinica", entre "Leads" e o divider
- Icone: `CalendarCheck`
- URL: `/gestao/agenda`
- Cor: `text-gestao`

#### 2. Edicao completa na listagem de pacientes — `Pacientes.tsx`

- Expandir o dialog de edicao para incluir: **nome**, **telefone**, **origem** (alem de status e valor ja existentes)
- Atualizar a mutation para salvar todos os campos
- Simplificar acoes na tabela: remover o botao "Ver no funil" (Eye duplicado), manter apenas: WhatsApp, Ver Ficha, Editar

#### 3. Edicao inline na ficha do paciente — `PacienteDetalhe.tsx`

- Adicionar estado `isEditingPatient` com campos editaveis (nome, telefone, origem, status)
- No header da ficha: botao "Editar" ao lado do nome
- Ao clicar: campos viram inputs editaveis inline (sem dialog)
- Botoes "Salvar" e "Cancelar" aparecem
- Mutation para atualizar `patients` + sync `sales_funnel`

#### 4. Remover acoes redundantes na tabela — `Pacientes.tsx`

- Remover botao "Ver no funil" (Eye → Link to funil) — raramente usado, gera confusao
- Remover botao "Agendar" que so mostra toast "em breve" — ou conectar ao `/gestao/agenda`
- Resultado: 3 acoes por linha (WhatsApp, Ver Ficha, Editar) em vez de 5

#### 5. Nenhuma mudanca no cadastro publico

- CadastroPaciente requer contexto de clinica (clinic_id, user_id) para funcionar
- Remover ProtectedRoute quebraria a logica de negocio
- Manter como esta — o fluxo atual e correto

### Arquivos

| Acao | Arquivo |
|------|---------|
| Editar | `src/components/AppSidebar.tsx` — adicionar Agenda |
| Editar | `src/pages/Pacientes.tsx` — expandir edicao + simplificar acoes |
| Editar | `src/pages/PacienteDetalhe.tsx` — edicao inline do header |

