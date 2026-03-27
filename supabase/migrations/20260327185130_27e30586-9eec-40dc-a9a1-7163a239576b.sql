CREATE OR REPLACE FUNCTION public.accept_pending_invites(_user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN
    SELECT * FROM invites WHERE email = _email AND status = 'pending'
  LOOP
    INSERT INTO clinic_members (clinic_id, user_id, role)
    VALUES (inv.clinic_id, _user_id, inv.role)
    ON CONFLICT DO NOTHING;

    UPDATE invites SET status = 'accepted', accepted_at = now()
    WHERE id = inv.id;
  END LOOP;
END;
$$;