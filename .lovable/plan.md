

The user uploaded the GC Odontologia logo and wants it set as the clinic logo, plus confirm the contract uses it.

## Plan

1. **Copy logo to project assets**: `lov-copy user-uploads://logo_sem_fundo.png src/assets/gc-logo.png` — keep a project-level reference.

2. **Upload to Supabase storage** (`clinic-logos` bucket, public): Write a small one-shot script that reads the file and uploads it via the Supabase REST storage API using the service role key. Path: `gc-odontologia/logo.png`. Get the public URL.

3. **Update `clinics` row via migration**: 
   ```sql
   UPDATE clinics 
   SET logo_url = '<public_url>', cancellation_fee = 100
   WHERE name ILIKE '%GC Odontologia%';
   ```

4. **Verify rendering in `OrcamentoPublico.tsx`**: Read the file to confirm it already renders `clinic.logo_url` as `<img>` when present (replacing the gold circle). If not wired, add the conditional.

5. **Verify PDF rendering in `contractPdf.ts`**: Currently the PDF doesn't embed the logo (only text header). Add `doc.addImage(logo_url, ...)` at the top center if `data.clinic.logo_url` exists. Use `jsPDF`'s ability to load from URL via fetch→base64.

## Files

| File | Change |
|---|---|
| `src/assets/gc-logo.png` | New — copied from upload |
| Storage upload script (one-shot) | Upload to `clinic-logos/gc-odontologia/logo.png` |
| Migration | `UPDATE clinics SET logo_url=..., cancellation_fee=100` |
| `src/pages/OrcamentoPublico.tsx` | Confirm/add `<img>` rendering when `logo_url` exists |
| `src/utils/contractPdf.ts` | Embed logo in PDF header when present |

No new tables. No schema changes.

