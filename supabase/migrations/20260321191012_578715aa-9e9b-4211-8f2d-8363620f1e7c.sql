
-- =============================================
-- VEGA Dental AI — Multi-Tenant Architecture
-- =============================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('dono', 'recepcao', 'dentista');

-- 2. Clinics table
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table (basic)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Clinic members (links users to clinics with roles)
CREATE TABLE public.clinic_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'dentista',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, user_id)
);

ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;

-- 5. Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Security definer helper: check if user belongs to a clinic
CREATE OR REPLACE FUNCTION public.is_clinic_member(_user_id UUID, _clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clinic_members
    WHERE user_id = _user_id AND clinic_id = _clinic_id
  );
$$;

-- 8. Security definer helper: check user role in clinic
CREATE OR REPLACE FUNCTION public.has_clinic_role(_user_id UUID, _clinic_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clinic_members
    WHERE user_id = _user_id AND clinic_id = _clinic_id AND role = _role
  );
$$;

-- 9. Security definer helper: get clinic IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_clinic_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.clinic_members WHERE user_id = _user_id;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES: users see only their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- CLINICS: users see only clinics they belong to
CREATE POLICY "Members can view their clinics"
  ON public.clinics FOR SELECT
  USING (id IN (SELECT public.get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can update their clinic"
  ON public.clinics FOR UPDATE
  USING (public.has_clinic_role(auth.uid(), id, 'dono'));

CREATE POLICY "Authenticated users can create clinics"
  ON public.clinics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- CLINIC_MEMBERS: members see only their clinic's members
CREATE POLICY "Members can view clinic members"
  ON public.clinic_members FOR SELECT
  USING (clinic_id IN (SELECT public.get_user_clinic_ids(auth.uid())));

CREATE POLICY "Donos can add members"
  ON public.clinic_members FOR INSERT
  WITH CHECK (public.has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE POLICY "Donos can remove members"
  ON public.clinic_members FOR DELETE
  USING (public.has_clinic_role(auth.uid(), clinic_id, 'dono'));

CREATE POLICY "Donos can update member roles"
  ON public.clinic_members FOR UPDATE
  USING (public.has_clinic_role(auth.uid(), clinic_id, 'dono'));
