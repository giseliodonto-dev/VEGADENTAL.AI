
-- Tighten anon UPDATE policy to only allow acceptance updates
DROP POLICY "Public can accept budget by token" ON budgets;
CREATE POLICY "Public can accept budget by token" ON budgets FOR UPDATE
  TO anon
  USING (status = 'pendente' OR status = 'enviado')
  WITH CHECK (status = 'aceito');
