
## Diagnóstico real (com dados do banco)

Consultei o banco. Confirmado:
- Clínica **GC ODONTOLOGIA** tem **1 único membro** (você, dona). Nenhum colaborador foi adicionado.
- Existem **8 convites pendentes** desde março de 2026 — **zero aceitos**. Os colaboradores recebem o link mas não conseguem entrar.

## Por que não funciona hoje (3 problemas reais)

### Problema 1: Confirmação de email obrigatória
A página `Convite.tsx` faz `supabase.auth.signUp()`. O Supabase Auth do projeto está com **"Confirmar email" ATIVADO** (default). Resultado:
- O colaborador preenche nome+senha → vê mensagem "Verifique seu e-mail para confirmar".
- Ele precisa abrir o email, clicar no link, depois voltar e fazer login manual.
- **Pior:** quando ele finalmente loga, o `accept_pending_invites` **não roda** (só é chamado dentro de `Convite.tsx`, não no login normal). Resultado → ele entra, mas fica sem clínica vinculada → cai no `ClinicOnboarding` e cria uma clínica nova vazia. **Convite perdido.**

### Problema 2: `accept_pending_invites` só roda no caminho feliz
No `Convite.tsx` linha 96-103, a função `accept_pending_invites` só é chamada se `signUpData.session` existir (ou seja, sem confirmação de email). Com email confirmation ligado, **nunca executa**.

### Problema 3: Se o email já existe no Auth
Se o colaborador já tem conta (ex: tentou antes, ou usa o mesmo email em outro projeto Lovable), `signUp` retorna erro "User already registered". O fluxo atual não trata isso → ele não consegue aceitar o convite com a conta que já tem.

## Solução proposta (3 frentes)

### Frente A — Desativar confirmação de email para convites
Configurar o Supabase Auth para **auto-confirmar** signups. Justificativa: o colaborador está chegando por um **link único e secreto** (`/convite/<uuid>`), que já é a prova de identidade. Email confirmation aqui só atrapalha.
- Mudança em `supabase/config.toml`: adicionar bloco `[auth.email]` com `enable_confirmations = false`.

### Frente B — Reescrever `Convite.tsx` para suportar 2 caminhos
1. **Colaborador novo** (email não existe): `signUp` → como auto-confirma, já vem com sessão → chama `accept_pending_invites` → entra direto na clínica.
2. **Colaborador já existe** (email já tem conta): mostrar formulário de **login** ao invés de cadastro → após login bem-sucedido → chama `accept_pending_invites` → entra na clínica.
3. Detectar qual caminho mostrar tentando `signInWithPassword` primeiro com o email do convite (silencioso) ou simplesmente oferecer aba "Já tenho conta".

### Frente C — Garantir aceitação automática no login global
Adicionar no `useAuth.tsx` (ou `App.tsx` no `onAuthStateChange`): toda vez que o usuário logar, verificar se há convites pendentes para o email dele e chamar `accept_pending_invites`. Isso resolve o caso de quem já confirmou email no passado mas ficou sem clínica.

## Mudanças por arquivo

| Arquivo | Mudança |
|---|---|
| `supabase/config.toml` | Adicionar `[auth.email] enable_confirmations = false` |
| `src/pages/Convite.tsx` | Suportar 2 modos (cadastro novo / login existente); chamar `accept_pending_invites` em ambos; mensagens de erro claras |
| `src/hooks/useAuth.tsx` | No `onAuthStateChange` (evento `SIGNED_IN`), chamar `accept_pending_invites` com email do usuário — garantia adicional |
| `src/components/ClinicOnboarding.tsx` | Antes de mostrar tela de "criar clínica", verificar se há convite pendente para o email do usuário. Se sim, aceitar automaticamente ao invés de pedir para criar clínica nova |

## O que NÃO muda

- Schema do banco (RPC `accept_pending_invites` já existe e funciona).
- RLS de `invites` (já permite leitura pública por token e insert/update por membros).
- Tela de listagem de convites pendentes em `EquipeVega.tsx` (continua igual, mostrando os 8 convites antigos).
- Os 8 convites pendentes existentes — **vão funcionar automaticamente** após a correção, basta o colaborador abrir o link de novo.

## Resultado prático

- Você convida `joao@email.com` → gera link → manda no WhatsApp.
- João abre o link → vê **"Crie sua conta"** ou **"Faça login"** (se já tem conta) → preenche → entra **direto** na clínica, sem confirmar email, sem cair em onboarding de clínica nova.
- Você vê João aparecer em "Colaboradores Ativos" imediatamente.
- Os 8 convites antigos continuam válidos — quem clicar no link agora também entra direto.

## Risco / trade-off honesto

Desativar confirmação de email diminui um pouquinho a segurança contra cadastros falsos via formulário público de signup (`/auth`). Mitigação: o cadastro normal em `/auth` continua possível, mas o usuário sem clínica cai em `ClinicOnboarding` e não consegue acessar dados de ninguém (RLS protege tudo por `clinic_id`). Risco real → baixo.
