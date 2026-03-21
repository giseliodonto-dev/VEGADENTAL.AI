
-- 1. PACIENTES
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'em_avaliacao', 'em_tratamento', 'ausente', 'desistente')),
  origin text CHECK (origin IN ('instagram', 'indicacao', 'google', 'facebook', 'site', 'outros')),
  responsible_user_id uuid,
  treatment_value numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view clinic patients" ON public.patients
  FOR SELECT USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can insert patients" ON public.patients
  FOR INSERT WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can update patients" ON public.patients
  FOR UPDATE USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can delete patients" ON public.patients
  FOR DELETE USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. LEADS
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text,
  origin text CHECK (origin IN ('instagram', 'indicacao', 'google', 'facebook', 'site', 'outros')),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'agendado', 'convertido', 'perdido')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view clinic leads" ON public.leads
  FOR SELECT USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can insert leads" ON public.leads
  FOR INSERT WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can update leads" ON public.leads
  FOR UPDATE USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can delete leads" ON public.leads
  FOR DELETE USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. FUNIL DE VENDAS
CREATE TABLE public.sales_funnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'avaliacao', 'proposta', 'fechado', 'perdido')),
  value numeric(12,2) DEFAULT 0,
  responsible_user_id uuid,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_funnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view clinic sales" ON public.sales_funnel
  FOR SELECT USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can insert sales" ON public.sales_funnel
  FOR INSERT WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can update sales" ON public.sales_funnel
  FOR UPDATE USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can delete sales" ON public.sales_funnel
  FOR DELETE USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE TRIGGER update_sales_funnel_updated_at BEFORE UPDATE ON public.sales_funnel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. AGENDA
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  date date NOT NULL,
  time time NOT NULL,
  duration_minutes int DEFAULT 60,
  status text NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'faltou', 'cancelou', 'remarcado')),
  dentist_user_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view clinic appointments" ON public.appointments
  FOR SELECT USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Members can update appointments" ON public.appointments
  FOR UPDATE USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can delete appointments" ON public.appointments
  FOR DELETE USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. FINANCEIRO
CREATE TABLE public.financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entrada', 'saida')),
  value numeric(12,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text,
  description text,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos can view financials" ON public.financials
  FOR SELECT USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE POLICY "Donos can insert financials" ON public.financials
  FOR INSERT WITH CHECK (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE POLICY "Donos can update financials" ON public.financials
  FOR UPDATE USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE POLICY "Donos can delete financials" ON public.financials
  FOR DELETE USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

-- 6. METAS
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  month date NOT NULL,
  revenue_goal numeric(12,2) DEFAULT 0,
  profit_goal numeric(12,2) DEFAULT 0,
  conversion_goal numeric(5,2) DEFAULT 0,
  current_result numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, month)
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos can view goals" ON public.goals
  FOR SELECT USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE POLICY "Donos can insert goals" ON public.goals
  FOR INSERT WITH CHECK (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE POLICY "Donos can update goals" ON public.goals
  FOR UPDATE USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE POLICY "Donos can delete goals" ON public.goals
  FOR DELETE USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
