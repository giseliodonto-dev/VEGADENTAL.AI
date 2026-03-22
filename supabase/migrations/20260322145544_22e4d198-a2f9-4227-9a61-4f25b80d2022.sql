
-- Table for procedures catalog
CREATE TABLE public.procedures_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  name text NOT NULL,
  category text NOT NULL,
  default_value numeric DEFAULT 0,
  is_favorite boolean DEFAULT false,
  is_custom boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.procedures_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view procedures" ON procedures_catalog FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can insert procedures" ON procedures_catalog FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Members can update procedures" ON procedures_catalog FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids(auth.uid())));
CREATE POLICY "Donos can delete procedures" ON procedures_catalog FOR DELETE
  USING (has_clinic_role(auth.uid(), clinic_id, 'dono'));

-- Seed function to populate default procedures for a clinic
CREATE OR REPLACE FUNCTION public.seed_default_procedures(_clinic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only seed if clinic has no procedures yet
  IF EXISTS (SELECT 1 FROM procedures_catalog WHERE clinic_id = _clinic_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO procedures_catalog (clinic_id, name, category) VALUES
    -- Preventivos
    (_clinic_id, 'Profilaxia (limpeza)', 'preventivo'),
    (_clinic_id, 'Aplicação de flúor', 'preventivo'),
    (_clinic_id, 'Selante', 'preventivo'),
    -- Clínico geral
    (_clinic_id, 'Restauração em resina', 'clinico_geral'),
    (_clinic_id, 'Restauração provisória', 'clinico_geral'),
    (_clinic_id, 'Cimentação de coroa', 'clinico_geral'),
    (_clinic_id, 'Ajuste oclusal', 'clinico_geral'),
    -- Endodontia
    (_clinic_id, 'Tratamento de canal (1 canal)', 'endodontia'),
    (_clinic_id, 'Tratamento de canal (2 canais)', 'endodontia'),
    (_clinic_id, 'Tratamento de canal (3 canais)', 'endodontia'),
    (_clinic_id, 'Retratamento endodôntico', 'endodontia'),
    -- Periodontia
    (_clinic_id, 'Raspagem supragengival', 'periodontia'),
    (_clinic_id, 'Raspagem subgengival', 'periodontia'),
    (_clinic_id, 'Alisamento radicular', 'periodontia'),
    (_clinic_id, 'Tratamento periodontal', 'periodontia'),
    -- Prótese
    (_clinic_id, 'Coroa unitária', 'protese'),
    (_clinic_id, 'Coroa provisória', 'protese'),
    (_clinic_id, 'Prótese parcial removível', 'protese'),
    (_clinic_id, 'Prótese total (dentadura)', 'protese'),
    (_clinic_id, 'Ponte fixa', 'protese'),
    -- Estética
    (_clinic_id, 'Clareamento dental', 'estetica'),
    (_clinic_id, 'Faceta em resina', 'estetica'),
    (_clinic_id, 'Faceta em porcelana', 'estetica'),
    (_clinic_id, 'Lente de contato dental', 'estetica'),
    (_clinic_id, 'Recontorno estético', 'estetica'),
    -- Implantodontia
    (_clinic_id, 'Implante unitário', 'implantodontia'),
    (_clinic_id, 'Implante múltiplo', 'implantodontia'),
    (_clinic_id, 'Enxerto ósseo', 'implantodontia'),
    (_clinic_id, 'Prótese sobre implante', 'implantodontia'),
    (_clinic_id, 'Prótese Protocolo', 'implantodontia'),
    -- Cirurgia
    (_clinic_id, 'Extração simples', 'cirurgia'),
    (_clinic_id, 'Extração de siso', 'cirurgia'),
    (_clinic_id, 'Cirurgia oral menor', 'cirurgia'),
    (_clinic_id, 'Frenectomia', 'cirurgia'),
    -- Ortodontia
    (_clinic_id, 'Aparelho fixo', 'ortodontia'),
    (_clinic_id, 'Aparelho móvel', 'ortodontia'),
    (_clinic_id, 'Manutenção ortodôntica', 'ortodontia'),
    (_clinic_id, 'Alinhadores', 'ortodontia'),
    -- Outros
    (_clinic_id, 'Consulta inicial', 'outros'),
    (_clinic_id, 'Avaliação', 'outros'),
    (_clinic_id, 'Urgência', 'outros'),
    (_clinic_id, 'Ajuste/controle', 'outros');
END;
$$;
