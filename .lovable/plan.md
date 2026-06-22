## Objetivo

Criar o separador "Exames e Fotos" em `/pacientes/:id` com upload seguro (LGPD), galeria otimizada e lightbox para análise clínica de RX e fotos.

## 1. Backend (Migration única + bucket)

**Bucket** (via tool de storage, não SQL): `patient-exams`, **privado**.

**Tabela** `public.patient_exams`:
- `id uuid PK default gen_random_uuid()`
- `clinic_id uuid not null` (ref `clinics`)
- `patient_id uuid not null` (ref `patients` on delete cascade)
- `file_path text not null` (caminho no bucket)
- `file_type text not null` (ex: `RX Panorâmico`, `Periapical`, `Foto Intraoral`, `Foto Rosto`)
- `notes text`
- `created_at timestamptz default now()`
- `created_by uuid` (auth.uid)

**Grants + RLS** (padrão do projeto, baseado em `get_user_clinic_ids(auth.uid())`):
- `GRANT SELECT, INSERT, DELETE ON public.patient_exams TO authenticated`
- `GRANT ALL TO service_role`
- Policies SELECT/INSERT/DELETE: `clinic_id IN (SELECT get_user_clinic_ids(auth.uid()))`
- Index em `(patient_id, created_at desc)`

**RLS no `storage.objects` para o bucket `patient-exams`:**
- SELECT/INSERT/DELETE permitidos quando `bucket_id = 'patient-exams'` E o primeiro segmento do `name` (clinic_id) está em `get_user_clinic_ids(auth.uid())`.
- Path enforçado pelo cliente: `${clinic_id}/${patient_id}/${uuid}-${filename}`.

## 2. Frontend

**Novo componente** `src/components/patients/PatientExamsPanel.tsx` (props: `patientId`, `clinicId`).

Estrutura:
1. **Dropzone** (drag & drop + click) — borda tracejada `border-amber-400/30`, fundo branco, ícone `ImagePlus` em `#103444`. Antes de upload, abre um pequeno seletor de `file_type` (Select shadcn com as 4 opções + "Outro") e campo opcional `notes`.
2. **Validações client-side**:
   - Tipos aceites: `image/jpeg`, `image/png`, `image/webp`, `image/jpg`.
   - Tamanho ≤ 10 MB.
   - Erros via `toast.error` (sonner).
3. **Upload**: `supabase.storage.from('patient-exams').upload(path, file)` → em sucesso, `insert` em `patient_exams`. Spinner no dropzone (`Loader2`) durante upload; barra/contagem se múltiplos ficheiros.
4. **Galeria**: grid responsivo (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`, `gap-4`). Cada card:
   - `<img loading="lazy" />` com signed URL (1h).
   - Badge canto superior esquerdo com `file_type` (estilo gold/azul petróleo).
   - Data de envio (`dd/MM/yyyy`) no rodapé.
   - Botão lixeira (apaga do storage + tabela, com `AlertDialog` de confirmação).
   - `rounded-xl`, `shadow-sm`, `hover:shadow-md`, `cursor-zoom-in`.
5. **Signed URLs**: hook interno que, ao receber a lista de exames, chama `storage.from('patient-exams').createSignedUrls(paths, 3600)` em batch único. Re-fetch ao expirar não é necessário no MVP (sessão curta).
6. **Lightbox**: `Dialog` shadcn em modo fullscreen — overlay `bg-black/80 backdrop-blur-md`, imagem centralizada `max-h-[90vh] object-contain`, botão `X` no topo direito, metadados (tipo + data + notas) em rodapé sutil. Navegação ←/→ entre imagens (teclado e botões).
7. **Estados**: skeletons enquanto carrega lista; empty state "Nenhum exame enviado ainda" com ícone.

**Integração no `PacienteDetalhe.tsx`**:
- Adicionar `<TabsTrigger value="exames">Exames e Fotos</TabsTrigger>` na `TabsList` existente (linhas 458–481).
- Adicionar `<TabsContent value="exames"><PatientExamsPanel patientId={id} clinicId={clinicId} /></TabsContent>`.

## 3. Validação após implementar

1. Upload de PNG/JPG/WEBP ≤ 10 MB → aparece no grid com badge correto.
2. Upload de PDF ou ficheiro > 10 MB → toast vermelho, nada gravado.
3. Outro utilizador de outra clínica não vê os ficheiros (RLS).
4. Clique numa miniatura → lightbox fullscreen com X para fechar.
5. Apagar → some do grid e do storage.

## Fora de escopo

- Edição de `file_type`/`notes` pós-upload (poderá vir depois).
- Anotações sobre o RX, comparação lado-a-lado, integração com IA.
- Compressão automática client-side.
