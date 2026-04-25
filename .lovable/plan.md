## Objetivo

Disponibilizar o **Gerador de Documentos Clínicos** (Receita, Atestado, Declaração, Pedido de Exames, Relatório) em uma rota dedicada `/documentos`, acessível pelo menu lateral.

## Situação atual

O componente foi salvo em um caminho aninhado e quebrado:
```
src/components/src/components/documents/src/components/documents/DocumentGenerator.tsx.
```
(diretórios duplicados + ponto extra no final do nome). Esse arquivo não pode ser importado por nenhuma rota.

Além disso, o componente atual:
- Não tem `import React` corretamente compatível (usa `React` mas funciona com JSX automático).
- Recebe `patientName` como prop obrigatório, mas a rota `/documentos` não tem paciente fixo.
- Não está envolto em `AppLayout` (header/sidebar do app).

## Mudanças

### 1. Mover/recriar o componente no caminho correto
- **Criar** `src/components/documents/DocumentGenerator.tsx` com o conteúdo já fornecido, com pequenos ajustes:
  - Tornar `patientName` opcional (default `""`), para funcionar tanto na página `/documentos` (uso genérico) quanto futuramente embutido na ficha do paciente.
  - Tipar props em TypeScript (`{ patientName?: string }`).
  - Manter o design Quiet Luxury (azul petróleo + dourado) já presente.
- **Excluir** o arquivo quebrado `src/components/src/components/documents/src/components/documents/DocumentGenerator.tsx.` para não poluir o projeto.

### 2. Criar a página da rota
- **Criar** `src/pages/Documentos.tsx`:
  - Envolve o conteúdo em `AppLayout`.
  - Header da página com título "Documentos Clínicos" e subtítulo curto.
  - Campo opcional "Nome do paciente" (input) cujo valor alimenta a prop `patientName` do `DocumentGenerator` — assim o dentista pode digitar o nome rapidamente antes de imprimir.
  - Renderiza `<DocumentGenerator patientName={nome} />`.

### 3. Registrar a rota em `src/App.tsx`
- Importar `Documentos` em `./pages/Documentos`.
- Adicionar dentro do bloco "Protected":
  ```tsx
  <Route path="/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
  ```

### 4. Adicionar item "Documentos" no `AppSidebar.tsx`
- Importar `FileText` de `lucide-react` (somar à lista de imports já existente).
- Adicionar item dentro do primeiro `SidebarGroup` (logo após "Financeiro"), seguindo o mesmo padrão dos demais:
  ```tsx
  <SidebarMenuItem>
    <SidebarMenuButton asChild>
      <NavLink to="/documentos">
        <FileText className="h-4 w-4 text-primary" />
        {!collapsed && <span>Documentos</span>}
      </NavLink>
    </SidebarMenuButton>
  </SidebarMenuItem>
  ```

## O que NÃO muda

- Schema do banco (geração é 100% client-side via `window.print()`).
- Componente `DocumentGenerator` em sua lógica (modelos de texto, botões, layout).
- Outras rotas/sidebar.
- Não vou integrar com paciente específico nesta etapa (próxima iteração: botão "Gerar Documento" dentro de `PacienteDetalhe.tsx` que abre modal com o gerador já preenchido).

## Resultado

Dentista clica em **Documentos** no menu lateral → digita nome do paciente → escolhe tipo (Receita/Atestado/etc.) → edita o texto → clica **Imprimir / Salvar PDF** → caixa de impressão do navegador abre.
