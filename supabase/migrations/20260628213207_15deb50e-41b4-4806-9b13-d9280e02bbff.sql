
-- 1) Junction table
CREATE TABLE IF NOT EXISTS public.patient_history_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id uuid NOT NULL REFERENCES public.patient_history(id) ON DELETE CASCADE,
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(history_id, treatment_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_history_treatments TO authenticated;
GRANT ALL ON public.patient_history_treatments TO service_role;

ALTER TABLE public.patient_history_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view history treatments"
  ON public.patient_history_treatments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_history ph
      WHERE ph.id = patient_history_treatments.history_id
        AND public.is_clinic_member(auth.uid(), ph.clinic_id)
    )
  );

CREATE POLICY "Members can insert history treatments"
  ON public.patient_history_treatments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_history ph
      WHERE ph.id = patient_history_treatments.history_id
        AND public.is_clinic_member(auth.uid(), ph.clinic_id)
    )
  );

CREATE POLICY "Members can delete history treatments"
  ON public.patient_history_treatments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_history ph
      WHERE ph.id = patient_history_treatments.history_id
        AND public.is_clinic_member(auth.uid(), ph.clinic_id)
    )
  );

-- 2) Indexes for pagination
CREATE INDEX IF NOT EXISTS idx_patient_history_patient_created
  ON public.patient_history(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pht_history
  ON public.patient_history_treatments(history_id);

CREATE INDEX IF NOT EXISTS idx_pht_treatment
  ON public.patient_history_treatments(treatment_id);

-- 3) Atomic RPC
CREATE OR REPLACE FUNCTION public.record_clinical_evolution(
  _patient_id uuid,
  _content text,
  _summary text,
  _treatment_ids uuid[]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _clinic_id uuid;
  _history_id uuid;
  _valid_count int;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF _content IS NULL OR length(trim(_content)) = 0 THEN
    RAISE EXCEPTION 'Conteúdo da evolução é obrigatório';
  END IF;

  SELECT clinic_id INTO _clinic_id
  FROM public.patients
  WHERE id = _patient_id;

  IF _clinic_id IS NULL THEN
    RAISE EXCEPTION 'Paciente não encontrado';
  END IF;

  IF NOT public.is_clinic_member(_user_id, _clinic_id) THEN
    RAISE EXCEPTION 'Acesso negado à clínica deste paciente';
  END IF;

  -- Validate treatments belong to this patient
  IF _treatment_ids IS NOT NULL AND array_length(_treatment_ids, 1) > 0 THEN
    SELECT count(*) INTO _valid_count
    FROM public.treatments
    WHERE id = ANY(_treatment_ids) AND patient_id = _patient_id;

    IF _valid_count <> array_length(_treatment_ids, 1) THEN
      RAISE EXCEPTION 'Um ou mais procedimentos não pertencem a este paciente';
    END IF;
  END IF;

  INSERT INTO public.patient_history (
    clinic_id, patient_id, dentist_user_id, content, summary
  ) VALUES (
    _clinic_id, _patient_id, _user_id, _content, _summary
  ) RETURNING id INTO _history_id;

  IF _treatment_ids IS NOT NULL AND array_length(_treatment_ids, 1) > 0 THEN
    INSERT INTO public.patient_history_treatments (history_id, treatment_id)
    SELECT _history_id, t_id FROM unnest(_treatment_ids) AS t_id;

    UPDATE public.treatments
    SET status = 'executado'
    WHERE id = ANY(_treatment_ids) AND patient_id = _patient_id;
  END IF;

  RETURN _history_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_clinical_evolution(uuid, text, text, uuid[]) TO authenticated;
