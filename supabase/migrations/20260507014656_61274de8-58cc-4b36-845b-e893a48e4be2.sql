-- Drop overly-permissive public policies on budgets
DROP POLICY IF EXISTS "Public can view budget by token" ON public.budgets;
DROP POLICY IF EXISTS "Public can accept budget by token" ON public.budgets;
DROP POLICY IF EXISTS "Public can view budget_items by token" ON public.budget_items;

-- Recreate with token-header check (matches anamneses pattern)
CREATE POLICY "Anon can view budget by token"
ON public.budgets
FOR SELECT
TO anon
USING (
  public_token IS NOT NULL
  AND public_token = ((current_setting('request.headers', true))::json ->> 'x-orcamento-token')
);

CREATE POLICY "Anon can accept budget by token"
ON public.budgets
FOR UPDATE
TO anon
USING (
  public_token IS NOT NULL
  AND public_token = ((current_setting('request.headers', true))::json ->> 'x-orcamento-token')
  AND status IN ('pendente','enviado')
)
WITH CHECK (status = 'aceito');

CREATE POLICY "Anon can view budget_items by token"
ON public.budget_items
FOR SELECT
TO anon
USING (
  budget_id IN (
    SELECT id FROM public.budgets
    WHERE public_token IS NOT NULL
      AND public_token = ((current_setting('request.headers', true))::json ->> 'x-orcamento-token')
  )
);