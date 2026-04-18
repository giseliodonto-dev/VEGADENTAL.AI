

## Diagnóstico

Integração WhatsApp em 3 pontos do sistema usando `https://wa.me/<phone>?text=<msg>` (sem API, sem dependência externa). Preciso descobrir:

1. **Plano de Tratamento**: onde fica o botão "Gerar Aprovação" hoje (`PacienteDetalhe.tsx`) e se temos `phone` do paciente.
2. **Equipe**: já existe botão WhatsApp genérico (`wa.me/?text=...` sem número). Melhorar para incluir nome da clínica e deixar mais explícito.
3. **Agenda**: localizar `AgendaVega.tsx` e ver estrutura dos cards de paciente agendado.

## Exploração necessária
