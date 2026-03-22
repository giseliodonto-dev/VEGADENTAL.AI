
-- Content Calendar table
CREATE TABLE public.content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'post',
  theme text,
  status text NOT NULL DEFAULT 'planejado',
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view content" ON content_calendar FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can insert content" ON content_calendar FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can update content" ON content_calendar FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Donos can delete content" ON content_calendar FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'::app_role));

-- Campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'instagram',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  investment numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'ativa',
  leads_generated integer DEFAULT 0,
  sales_closed integer DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view campaigns" ON campaigns FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can insert campaigns" ON campaigns FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can update campaigns" ON campaigns FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Donos can delete campaigns" ON campaigns FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'::app_role));
