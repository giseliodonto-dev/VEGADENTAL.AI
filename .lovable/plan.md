
## Objetivo

Criar a página **Mentor de IA** (`/mentora`) como uma biblioteca curada de scripts de alta conversão, organizada em 4 categorias (Vendas, Gestão, Posicionamento, Melhoria), com personalização via IA e disparo direto pelo WhatsApp.

## Estrutura da página

```text
┌─────────────────────────────────────────────────────────┐
│ Header: "Mentor de IA"  +  subtítulo Quiet Luxury       │
├─────────────────────────────────────────────────────────┤
│ 🔍 Barra: "Qual situação você precisa resolver agora?"  │
│           [busca semântica via IA + filtro local]       │
├─────────────────────────────────────────────────────────┤
│ Tabs: Vendas | Gestão | Posicionamento | Melhoria       │
├─────────────────────────────────────────────────────────┤
│ Grid de cards (borda dourada fina):                     │
│  ┌──────────────────────────┐                           │
│  │ Título                   │                           │
│  │ Por que funciona (Neuro) │                           │
│  │ ───────                  │                           │
│  │ Texto do script          │                           │
│  │ [Personalizar com IA]    │                           │
│  │ [Copiar] [WhatsApp]      │                           │
│  └──────────────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

## Arquivos a criar/alterar

### 1. `src/pages/MentoraVega.tsx` (novo)
- 4 tabs (`Tabs` shadcn) — Vendas, Gestão, Posicionamento, Melhoria.
- Catálogo de scripts hardcoded em `src/data/mentorScripts.ts` (estrutura abaixo).
- Barra de busca (`Input`) com 2 modos:
  - **Filtro local** instantâneo por título/texto/tags.
  - Botão **"Buscar com IA"** → chama edge function que retorna IDs de scripts mais relevantes para a situação descrita ("paciente achou caro" → scripts de objeção de preço).
- Cada `ScriptCard`:
  - Título (Plus Jakarta Sans, dourado).
  - "Por que funciona" em itálico, texto pequeno.
  - Bloco de script em `<pre>` legível, fundo `bg-muted/30`.
  - Diálogo **Personalizar com IA**: pede `nome do paciente`, `procedimento`, `valor` (opcional) → chama edge function → substitui placeholders e retorna versão final.
  - **Copiar** → clipboard + toast.
  - **WhatsApp** → usa `openWhatsApp(clinicPhone, script)` do `@/lib/whatsapp`.
- Estilo: card com `border border-gold/30`, hover `border-gold/60` + leve `shadow-md`. Fundo `bg-card`. Radius `rounded-xl`.

### 2. `src/data/mentorScripts.ts` (novo)
Tipo:
```ts
type MentorScript = {
  id: string;
  category: "vendas" | "gestao" | "posicionamento" | "melhoria";
  subcategory: string; // ex: "Quebra de Objeção: Preço"
  title: string;
  why: string;        // Neurovendas — por que funciona
  body: string;       // texto com placeholders {{nome}}, {{procedimento}}, {{valor}}
  tags: string[];     // para busca local
};
```
Catálogo inicial (~20 scripts), divididos:
- **Vendas**: Prospecção fria, Reativação de inativo, Quebra de objeção (preço, tempo, marido/esposa, "vou pensar"), Fechamento alto ticket, Resgate de orçamento parado (3, 7, 14 dias).
- **Gestão**: Alinhamento de meta com secretária, Feedback construtivo, Cobrança elegante de inadimplente, Comunicado interno de mudança, Reunião 1:1.
- **Posicionamento**: Boas-vindas VIP, Explicação de diferenciais (case "Resort Chic"), Justificativa de valor premium, Apresentação do dentista.
- **Melhoria**: Pedido de depoimento, Pedido de indicação ativa, Aniversário/fidelização, Follow-up pós-tratamento.

### 3. `supabase/functions/mentor-ai/index.ts` (novo edge function)
- Verbo único; recebe `{ action: "personalize" | "search", payload }`.
- `personalize`: recebe script + dados do paciente → chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com system prompt VEGA (tom Quiet Luxury, sem emojis exagerados) → retorna texto final.
- `search`: recebe situação livre + lista de títulos+tags → IA retorna array de IDs em ordem de relevância (tool calling com schema).
- CORS, tratamento de 429/402, sem `verify_jwt` adicional (default Lovable).

### 4. Roteamento e navegação
- `src/App.tsx`: adicionar rota `/mentora` → `<ProtectedRoute><MentoraVega /></ProtectedRoute>`.
- `src/components/AppSidebar.tsx`: adicionar item de menu "Mentor de IA" com ícone `Sparkles` ou `BookOpenText` (lucide), agrupado com Vega tools.

## Dados que a página consome

| Origem | Uso |
|---|---|
| `useClinic()` | `clinic.phone` para o botão WhatsApp |
| `mentorScripts.ts` | Catálogo estático (versionado em código, fácil de expandir) |
| Edge function `mentor-ai` | Personalização e busca semântica |

## Estética Quiet Luxury

- Tabs: underline dourado no ativo, hover `text-foreground`.
- Cards: `border-gold/30 hover:border-gold/60 transition`.
- Tipografia: títulos `font-plus-jakarta`, corpo `font-inter`.
- Sem emoji, sem gradientes berrantes. Botão WhatsApp em `variant="outline"` com ícone `WhatsAppIcon` existente, botão "Personalizar com IA" em `variant="gold"`.
- Spacing generoso (`gap-6`, `p-6`).

## O que NÃO entra

- Marketing (terá página própria, conforme pedido).
- Persistência de scripts editados (apenas clipboard e WhatsApp).
- Edição/criação de scripts pelo usuário (V2).
- Banco de dados — catálogo é estático em código.

## Resultado

Dentista abre `/mentora`, escolhe categoria ou digita "paciente achou caro" → IA filtra os 3 scripts de objeção de preço → clica "Personalizar com IA", informa nome e procedimento → recebe texto pronto → clica WhatsApp → abre conversa no número da clínica com o script completo já colado.
