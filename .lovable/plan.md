## Visão geral

Landing pública em `/evolucao` ("O Salto Evolutivo"), narrativa em 4 atos. Visitante preenche nome + WhatsApp + e-mail → grava na lista de espera (banco) → redireciona pro seu WhatsApp com mensagem pré-pronta. App em `/` continua intacto.

## Pendência (assumido por padrão — me avise se quiser mudar)

- **Verde esmeralda**: profundo `#047857` com glow `#10B981` (alinha com Quiet Luxury, evita parecer neon).
- **Fonte display**: Bagel Fat One via Google Fonts, escopada só nesta landing (`.font-bagel`) — não polui o resto.
- **Número de WhatsApp pra redirect**: vou usar placeholder `5511999999999`. **Me passa o seu** ou eu deixo configurável depois.

## 1. Banco — tabela `evolution_waitlist`

Migração SQL:

```sql
create table public.evolution_waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  email text,
  source text default 'landing_evolucao',
  user_agent text,
  created_at timestamptz default now()
);

alter table public.evolution_waitlist enable row level security;

-- Insert público (qualquer visitante pode entrar na lista)
create policy "anyone can join waitlist"
  on public.evolution_waitlist for insert
  to anon, authenticated
  with check (true);

-- Leitura: só dono/admin de qualquer clínica (você)
create policy "owners can read waitlist"
  on public.evolution_waitlist for select
  to authenticated
  using (
    exists (
      select 1 from clinic_members
      where user_id = auth.uid() and role in ('dono','admin')
    )
  );
```

## 2. Página `src/pages/SaltoEvolutivo.tsx`

Estrutura (full-bleed, sem `AppLayout`, sem sidebar — é landing pública):

```text
[Hero / Logo Vega no topo, fixo translúcido]

ATO I — A Dor (h-screen, fundo preto/azul-aço gradient)
  Imagem IA #1 (consultório caótico, tons frios)
  Headline gigante Bagel Fat: "O caos não é o preço do sucesso."
  Copy: "O consultório que você sonhou se tornou a prisão que você habita?..."

ATO II — A Ascensão (h-screen, transição luz esmeralda)
  Imagem IA #2 (explosão de luz esmeralda, nave entrando no software)
  Headline: "Conheça o Vega."
  Copy do roteiro
  Grid 8 módulos (Pacientes, Funil, Financeiro, Marketing, GPS, Inteligência, 
    Equipe, Autoridade) em cards com hover lift + glow esmeralda

ATO III — A Nova Realidade (h-screen, Quiet Luxury)
  Imagem IA #3 (dentista em paz com família, consultório iluminado)
  Headline: "Onde a inteligência assume o controle."
  Copy do roteiro

ATO IV — O Chamado (h-screen, preto absoluto)
  Imagem IA #4 (logo Vega brilhando esmeralda em fundo preto)
  Headline: "O mundo evoluiu, Doutor. E você?"
  Form de captura (nome, WhatsApp, email opcional)
  Botão Bagel Fat: "QUERO MINHA EVOLUÇÃO AGORA"

[Footer minimalista: © Vega Dental AI · Política · Contato]
```

Animações: `IntersectionObserver` + classes `animate-fade-up`/`animate-glow` que disparam ao entrar no viewport. Scroll suave entre atos.

## 3. Geração das 4 imagens IA

Usando o skill `ai-gateway` com `google/gemini-3-pro-image-preview` (qualidade cinematográfica). Imagens salvas em `public/landing/ato-{1..4}.webp` e referenciadas por `<img src="/landing/ato-1.webp">`.

Prompts (em inglês, técnica fotográfica/cinema):
1. **Caos**: "Cinematic dark moody dental clinic, exhausted dentist hunched over desk buried in paperwork, cold blue-grey lighting, depth of field, photorealistic, anamorphic"
2. **Ascensão**: "Cinematic emerald green light explosion entering a futuristic dental software interface, holographic UI panels floating, dark space background, sci-fi, dramatic lighting"
3. **Nova Realidade**: "Quiet luxury — well-dressed dentist smiling peacefully with family at golden hour, modern minimalist clinic in soft focus background, warm cinematic lighting, premium lifestyle photography"
4. **Logo**: "Glowing emerald green letter 'V' monogram suspended in absolute black void, lens flare, premium luxury brand identity, cinematic"

## 4. Captura de leads

Componente `WaitlistForm` no Ato IV:
- Validação Zod (nome 2-100 chars, WhatsApp 10-15 dígitos, email opcional)
- `supabase.from("evolution_waitlist").insert(...)` (anônimo, RLS permite)
- Salva user_agent automaticamente
- Em sucesso: toast "Você está dentro." → `window.location.href = "https://wa.me/55XXX?text=Olá%20Dra...%20acabei%20de%20entrar%20na%20lista%20de%20espera%20do%20Vega"`
- Tratamento de erro com toast amigável

## 5. Rota e fonte

**`src/App.tsx`** — adicionar em "Public":
```tsx
<Route path="/evolucao" element={<SaltoEvolutivo />} />
```

**`index.html`** — adicionar Google Font Bagel Fat One com `<link rel="preconnect">` e usar em CSS apenas dentro de `.font-bagel` (escopo local, não vira default global).

**`tailwind.config.ts`** — adicionar `bagel: ['"Bagel Fat One"', 'cursive']` em `fontFamily` extend.

## O que NÃO muda

- App principal (`/`, `/auth`, todas rotas protegidas) — zero impacto.
- Sidebar, design system existente, demais páginas.
- Schema de pacientes/clínicas/etc.

## Detalhes técnicos

- Verde esmeralda como CSS custom properties locais à landing (não toca em `index.css` global).
- Imagens em `/public/landing/` para CDN cache automático.
- Lazy load das imagens dos atos II/III/IV (`loading="lazy"`).
- Meta tags Open Graph/Twitter cards na landing pra preview bonito quando compartilhado.
- Mobile-first: atos viram stack vertical, fonte Bagel reduz pra `clamp(2.5rem, 8vw, 6rem)`.

## Resultado

Você divulga `vegadental.com.br/evolucao` em campanhas → visitante rola pelos 4 atos cinematográficos com narrativa visual forte → preenche o form → cai no seu WhatsApp já aquecido pela narrativa, e fica salvo no banco pra você acompanhar conversão.

## Pra eu começar com tudo certo, confirma:
1. **Número de WhatsApp** pro redirect (formato `5511999999999`).
2. **OK no esmeralda `#047857` + glow `#10B981`?** Ou prefere o neon `#10B981` puro mais vibrante?
