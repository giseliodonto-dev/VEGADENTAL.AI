

O fluxo atual já faz exatamente isso: `send-invite` apenas gera o token e devolve a URL; a tela `EquipeVega.tsx` mostra o link copiável + botão WhatsApp. Nenhum e-mail é disparado.

## Plano

Nenhuma mudança de código necessária. Apenas ajustes de UX para deixar claro ao usuário que **não há envio automático de e-mail** — o link deve ser entregue manualmente.

### Alterações em `src/pages/gestao/EquipeVega.tsx`

1. No diálogo de convite gerado, trocar o texto atual por algo mais explícito:
   > "O sistema **não envia e-mail automático**. Copie o link abaixo e envie ao colaborador via WhatsApp, e-mail manual ou outro canal de sua preferência."

2. No card de cada convite pendente, adicionar uma legenda discreta:
   > "Envio manual — sem e-mail automático"

3. (Opcional) Renomear o título do diálogo de "Enviar Convite de Acesso" para "Gerar Link de Convite" para alinhar expectativa.

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/pages/gestao/EquipeVega.tsx` | Ajustar textos do diálogo e legenda dos convites pendentes |

Sem mudanças de banco, edge function ou rotas.

