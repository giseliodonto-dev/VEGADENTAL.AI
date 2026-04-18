-- Fix critical security: anon SELECT on anamneses must filter by token
DROP POLICY IF EXISTS "Anon can view anamnese by token" ON public.anamneses;

CREATE POLICY "Anon can view anamnese by token"
ON public.anamneses
FOR SELECT
TO anon
USING (
  public_token IS NOT NULL
  AND public_token = current_setting('request.headers', true)::json->>'x-anamnese-token'
);

-- Same hardening for UPDATE (currently allows updating any row whose status is nao_enviada/enviada)
DROP POLICY IF EXISTS "Anon can update anamnese by token" ON public.anamneses;

CREATE POLICY "Anon can update anamnese by token"
ON public.anamneses
FOR UPDATE
TO anon
USING (
  public_token IS NOT NULL
  AND public_token = current_setting('request.headers', true)::json->>'x-anamnese-token'
  AND status = ANY (ARRAY['nao_enviada'::text, 'enviada'::text])
)
WITH CHECK (status = 'respondida'::text);