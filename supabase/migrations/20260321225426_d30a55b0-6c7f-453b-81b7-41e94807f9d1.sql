ALTER TABLE public.financials
  ADD COLUMN payment_method text DEFAULT 'pix',
  ADD COLUMN status text NOT NULL DEFAULT 'pago',
  ADD COLUMN responsible_user_id uuid;