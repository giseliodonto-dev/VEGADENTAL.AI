
-- Extension for accent-insensitive matching
CREATE EXTENSION IF NOT EXISTS unaccent;

-- New nullable FK column linking treatments to the catalog
ALTER TABLE public.treatments
  ADD COLUMN IF NOT EXISTS procedure_id uuid NULL;

CREATE INDEX IF NOT EXISTS idx_treatments_procedure_id
  ON public.treatments (procedure_id);

-- Smart matcher: normalized exact → ILIKE contains → shared-token score
CREATE OR REPLACE FUNCTION public.match_procedure(_clinic uuid, _name text)
RETURNS TABLE (id uuid, name text, default_value numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm text;
BEGIN
  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    RETURN;
  END IF;

  norm := lower(unaccent(regexp_replace(_name, '[^a-zA-Z0-9À-ÿ]+', ' ', 'g')));
  norm := trim(regexp_replace(norm, '\s+', ' ', 'g'));

  -- 1) Exact normalized match
  RETURN QUERY
  SELECT pc.id, pc.name, pc.default_value
  FROM public.procedures_catalog pc
  WHERE pc.clinic_id = _clinic
    AND COALESCE(pc.is_active, true) = true
    AND trim(regexp_replace(lower(unaccent(regexp_replace(pc.name, '[^a-zA-Z0-9À-ÿ]+', ' ', 'g'))), '\s+', ' ', 'g')) = norm
  LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  -- 2) ILIKE contains (either direction)
  RETURN QUERY
  SELECT pc.id, pc.name, pc.default_value
  FROM public.procedures_catalog pc
  WHERE pc.clinic_id = _clinic
    AND COALESCE(pc.is_active, true) = true
    AND (
      lower(unaccent(pc.name)) ILIKE '%' || norm || '%'
      OR norm ILIKE '%' || lower(unaccent(pc.name)) || '%'
    )
  ORDER BY abs(length(pc.name) - length(_name)) ASC
  LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  -- 3) Token overlap score (≥ 2 shared tokens of length > 3)
  RETURN QUERY
  WITH input_tokens AS (
    SELECT DISTINCT unnest(string_to_array(norm, ' ')) AS tok
  ),
  scored AS (
    SELECT
      pc.id,
      pc.name,
      pc.default_value,
      (
        SELECT count(*)
        FROM input_tokens it
        WHERE length(it.tok) > 3
          AND lower(unaccent(pc.name)) ILIKE '%' || it.tok || '%'
      ) AS score
    FROM public.procedures_catalog pc
    WHERE pc.clinic_id = _clinic
      AND COALESCE(pc.is_active, true) = true
  )
  SELECT s.id, s.name, s.default_value
  FROM scored s
  WHERE s.score >= 2
  ORDER BY s.score DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_procedure(uuid, text) TO authenticated;
