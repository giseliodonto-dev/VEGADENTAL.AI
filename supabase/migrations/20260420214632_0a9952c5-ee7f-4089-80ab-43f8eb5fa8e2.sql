
CREATE OR REPLACE FUNCTION public.create_clinic_with_owner(
  _name text,
  _slug text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _clinic_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF EXISTS (SELECT 1 FROM clinic_members WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'Usuário já está vinculado a uma clínica';
  END IF;

  INSERT INTO clinics (name, slug)
  VALUES (trim(_name), _slug)
  RETURNING id INTO _clinic_id;

  INSERT INTO clinic_members (clinic_id, user_id, role)
  VALUES (_clinic_id, _user_id, 'dono');

  RETURN _clinic_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_clinic_with_owner(text, text) TO authenticated;
