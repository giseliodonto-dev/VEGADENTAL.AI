
## Plano: Calculadora de Hora Clínica Real

### O que será criado

Uma nova subpágina dentro do módulo Finanças (`/vega/financas/hora-clinica`) com formulário elegante dividido em 3 blocos, título "Sua Rota de Lucro VEGA" e estética Quiet Luxury (dourado + fundo limpo).

### Implementação

**1. Novo arquivo `src/pages/vega/HoraClinica.tsx`**

Formulário com 3 blocos em Cards:

- **Bloco 1 — Custos Fixos e Variáveis**: Campos para Aluguel, Energia, Água, Internet, Materiais de consumo, Esterilização, Funcionários (salários), Contador, Marketing, Manutenção de equipamentos, Descartáveis, e botão "Adicionar outro custo" para itens personalizados.

- **Bloco 2 — Meta de Pró-labore**: Campo para lucro líquido desejado (R$), campo para impostos estimados (%).

- **Bloco 3 — Capacidade Operacional**: Dias trabalhados/mês, Horas/dia na cadeira.

- **Resultado**: Card dourado calculando automaticamente o valor da Hora Clínica Real = (Custos Totais + Pró-labore + Impostos) / (Dias × Horas). Exibição com selo "Rota de Lucro VEGA".

**2. Rota em `src/App.tsx`**
- Adicionar rota `/vega/financas/hora-clinica` apontando para o novo componente.

**3. Link na página Finanças (`src/pages/vega/Financas.tsx`)**
- Adicionar uma terceira aba ou card de navegação para "Hora Clínica Real" linkando à subpágina.

### Estética
- Fundo limpo, fontes finas (font-light), botões dourados (bg-accent/text-accent), cards com bordas sutis, ícones em dourado, selo "Rota de Lucro VEGA" no resultado.
