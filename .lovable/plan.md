

## Plano — Contrato/Orçamento Formal GC Odontologia

### Estado atual
- `/orcamento/:token` (`OrcamentoPublico.tsx`) já renderiza contrato com header da clínica, dados das partes (Contratada/Contratante), itens, totais e área de assinatura digital.
- Botão "Gerar Aprovação do Plano" na ficha já cria `budgets` + `budget_items` e abre essa rota.
- Faltam: cabeçalho oficial (Responsável Técnica, CROSP, logo), cláusulas contratuais, validade 15 dias, ações de PDF e WhatsApp, refino Quiet Luxury (Azul Petróleo / Dourado).

### 1. Identidade da Responsável Técnica (configurável por clínica)

Migration:
```sql
ALTER TABLE clinics
  ADD COLUMN responsible_name text,
  ADD COLUMN responsible_cro text,
  ADD COLUMN logo_url text,
  ADD COLUMN cancellation_fee numeric DEFAULT 100;
```

Pré-popular GC Odontologia (UPDATE pelo nome): `responsible_name='Dra. Giseli da Costa Lage'`, `responsible_cro='CROSP 165.429'`.

Em `Configuracoes.tsx` (aba Clínica), adicionar inputs para os 4 novos campos + upload de logo (storage bucket `clinic-logos` público, criar via migration).

### 2. Validade automática 15 dias

No `PacienteDetalhe.tsx`, mutation "Gerar Aprovação" passa a setar `valid_until = hoje + 15 dias` (hoje está hardcoded sem validade). Sem schema change.

### 3. Reescrever `OrcamentoPublico.tsx` — layout Quiet Luxury

**Cabeçalho oficial centralizado:**
- Logo da clínica (`clinic.logo_url`) ou placeholder dourado redondo com iniciais
- Nome da clínica em Plus Jakarta Sans, Azul Petróleo `text-[#103444]`
- Linha dourada fina abaixo (`border-amber-400`)
- Responsável Técnica + CROSP em fonte serifada/itálico discreto
- Endereço, telefone, email em linha única menor

**Corpo:**
- Título "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS"
- Card duplo Contratada/Contratante (já existe — mantém)
- **Objeto** (novo): parágrafo introdutório + tabela de procedimentos (já existe — mantém estrutura, refina tipografia)
- **Valores e Condições** (novo bloco): subtotal, desconto, valor final em destaque + linha "Forma de pagamento: X" lida do `notes` do budget (que já guarda isso)
- **Cláusulas Contratuais** (novo): bloco numerado 1-5 com cláusulas padrão:
  1. Ciência do plano e responsabilidade biológica individual
  2. Cumprimento das orientações pós-operatórias
  3. Faltas sem aviso de 24h → taxa R$ {clinic.cancellation_fee}
  4. Validade do orçamento: 15 dias a partir da emissão
  5. Foro e legislação aplicável
- **Assinaturas**: 2 colunas — Paciente (input + botão "Aceitar") e Responsável Técnica (carimbo: nome + CROSP em caixa com borda dourada)

**Paleta:**
- Fundo `bg-slate-50`
- Card branco com `border-amber-400/30`
- Títulos `text-[#103444]`
- Detalhes / divisores `border-amber-400` ou `text-amber-600`
- Fonte do contrato: serifada para corpo (`font-serif`), Plus Jakarta para títulos

### 4. Ações pós-renderização

Header sticky discreto com 3 botões:
- **Baixar Contrato em PDF** (dourado, primário): nova função `generateContractPdf` em `src/utils/contractPdf.ts` usando jsPDF, replicando exatamente o layout (cabeçalho, partes, tabela, cláusulas, assinatura). Reutiliza padrão de `budgetPdf.ts`.
- **Enviar via WhatsApp** (outline): abre `https://wa.me/{patient.phone}?text=` com mensagem pré-formatada contendo link público do contrato (`window.location.href`).
- **Imprimir** (ghost): `window.print()` com CSS `@media print` escondendo o header sticky.

### 5. Arquivos

| Arquivo | Mudança |
|---|---|
| Migration | +4 colunas em `clinics` + UPDATE GC + bucket `clinic-logos` |
| `src/pages/Configuracoes.tsx` | Inputs de Responsável Técnica, CRO, logo, taxa cancelamento |
| `src/pages/PacienteDetalhe.tsx` | `valid_until = +15 dias` na mutation de aprovação |
| `src/pages/OrcamentoPublico.tsx` | Refatorar layout Quiet Luxury + cláusulas + carimbo + botões de ação |
| `src/utils/contractPdf.ts` | **Novo** — gera PDF do contrato com jsPDF |

Sem novas tabelas. Reusa `budgets` + `budget_items` + `clinics` + `patients`.

