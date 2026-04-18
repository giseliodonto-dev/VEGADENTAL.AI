-- 1. Add new metadata columns to procedures_catalog
ALTER TABLE public.procedures_catalog
  ADD COLUMN IF NOT EXISTS time_minutes integer,
  ADD COLUMN IF NOT EXISTS observations text;

-- 2. Rewrite seed function with full VEGA library (~70 procedures)
CREATE OR REPLACE FUNCTION public.seed_default_procedures(_clinic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only seed if clinic has no procedures yet
  IF EXISTS (SELECT 1 FROM procedures_catalog WHERE clinic_id = _clinic_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO procedures_catalog (clinic_id, name, category, default_value, time_minutes, observations) VALUES
    -- A) Clínica Geral / Diagnóstico
    (_clinic_id, 'Consulta inicial', 'clinico_geral', 200.00, 60, 'Avaliação clínica completa'),
    (_clinic_id, 'Consulta de urgência', 'clinico_geral', 150.00, 45, 'Apenas paliativo (medicação/curativo)'),
    (_clinic_id, 'Retorno clínico', 'clinico_geral', 100.00, 30, 'Avaliação pós-operatória ou continuidade'),
    (_clinic_id, 'Avaliação com plano de tratamento', 'clinico_geral', 200.00, 60, 'Apresentação de planejamento complexo'),
    (_clinic_id, 'Profilaxia adulta', 'clinico_geral', 200.00, 60, 'Jato de bicarbonato e polimento'),
    (_clinic_id, 'Aplicação tópica de flúor', 'clinico_geral', 100.00, 30, 'Ambas arcadas'),
    (_clinic_id, 'Raspagem supragengival por sextante', 'clinico_geral', 100.00, 30, 'Ultrassom ou manual'),

    -- B) Dentística / Estética
    (_clinic_id, 'Restauração em resina 1 face', 'dentistica', 180.00, 45, 'Resina composta fotopolimerizável'),
    (_clinic_id, 'Restauração em resina 2 faces', 'dentistica', 250.00, 60, 'Envolve ponto de contato'),
    (_clinic_id, 'Restauração em resina 3 faces ou mais', 'dentistica', 350.00, 90, 'Reconstrução extensa'),
    (_clinic_id, 'Faceta em resina composta', 'dentistica', 600.00, 90, 'Valor por dente (estética direta)'),
    (_clinic_id, 'Clareamento de consultório por sessão', 'dentistica', 450.00, 60, 'Material clareador incluso'),
    (_clinic_id, 'Clareamento caseiro supervisionado', 'dentistica', 800.00, NULL, 'Inclui moldeiras e bisnagas'),
    (_clinic_id, 'Ajuste oclusal simples', 'dentistica', 100.00, 30, 'Desgaste seletivo'),

    -- C) Endodontia
    (_clinic_id, 'Tratamento de canal unirradicular', 'endodontia', 700.00, 90, 'Dentes anteriores / pré-molares simples'),
    (_clinic_id, 'Tratamento de canal birradicular', 'endodontia', 900.00, 90, 'Pré-molares'),
    (_clinic_id, 'Tratamento de canal multirradicular', 'endodontia', 1200.00, 120, 'Molares'),
    (_clinic_id, 'Retratamento unirradicular', 'endodontia', 900.00, 90, 'Inclui remoção de material obturador'),
    (_clinic_id, 'Retratamento multirradicular', 'endodontia', 1500.00, 120, 'Alta complexidade'),
    (_clinic_id, 'Curativo de urgência endodôntico', 'endodontia', 250.00, 45, 'Acesso, pulpectomia e medicação'),
    (_clinic_id, 'Remoção de núcleo/pino para acesso', 'endodontia', 300.00, 60, 'Risco de fratura radicular'),

    -- D) Periodontia
    (_clinic_id, 'Raspagem e alisamento radicular por quadrante', 'periodontia', 250.00, 60, 'Subgengival sob anestesia'),
    (_clinic_id, 'Manutenção periodontal', 'periodontia', 200.00, 60, 'Controle periódico de bolsa'),
    (_clinic_id, 'Gengivoplastia por região', 'periodontia', 700.00, 60, 'Setor anterior ou posterior'),
    (_clinic_id, 'Aumento de coroa clínica', 'periodontia', 450.00, 60, 'Valor por dente, inclui osteotomia se necessária'),
    (_clinic_id, 'Controle periodontal de suporte', 'periodontia', 150.00, 45, 'Reavaliação de tecidos moles'),

    -- E) Cirurgia Oral
    (_clinic_id, 'Exodontia simples', 'cirurgia', 200.00, 45, 'Dentes sem complexidade óssea'),
    (_clinic_id, 'Exodontia de raiz residual', 'cirurgia', 300.00, 60, 'Exige retalho e possível osteotomia'),
    (_clinic_id, 'Exodontia cirúrgica', 'cirurgia', 400.00, 60, 'Odontossecção e osteotomia'),
    (_clinic_id, 'Terceiro molar incluso simples', 'cirurgia', 600.00, 60, 'Posição favorável'),
    (_clinic_id, 'Terceiro molar incluso complexo', 'cirurgia', 900.00, 90, 'Impactado / íntima relação com nervo'),
    (_clinic_id, 'Frenectomia', 'cirurgia', 450.00, 45, 'Labial ou lingual'),
    (_clinic_id, 'Biópsia de lesão bucal', 'cirurgia', 500.00, 45, 'Exame anatomopatológico cobrado à parte'),
    (_clinic_id, 'Ulectomia / ulotomia', 'cirurgia', 200.00, 30, 'Auxílio em erupção dentária'),

    -- F) Implantodontia
    (_clinic_id, 'Avaliação para implante', 'implantodontia', 200.00, 60, 'Análise de tomografia e planejamento'),
    (_clinic_id, 'Manutenção de implante', 'implantodontia', 150.00, 30, 'Controle clínico, higiene e avaliação peri-implantar'),
    (_clinic_id, 'Implante unitário (instalação)', 'implantodontia', 1800.00, 60, 'Fase cirúrgica (apenas pino)'),
    (_clinic_id, 'Implante com enxerto ósseo pequeno porte', 'implantodontia', 2800.00, 90, 'Inclui biomaterial simples'),
    (_clinic_id, 'Implante com cirurgia guiada', 'implantodontia', 2500.00, 60, 'Guia cirúrgico cobrado ou embutido'),
    (_clinic_id, 'Pilar protético sobre implante', 'implantodontia', 450.00, 30, 'Componente intermediário'),
    (_clinic_id, 'Coroa sobre implante', 'implantodontia', 1600.00, 60, 'Metalocerâmica ou Zircônia simples'),
    (_clinic_id, 'Protocolo sobre implantes (arcada)', 'implantodontia', 14000.00, NULL, 'Valor médio total (fase protética)'),
    (_clinic_id, 'Enxerto ósseo / biomaterial complementar', 'implantodontia', 1200.00, 60, 'Levantamento de seio maxilar simples, etc.'),

    -- G) Prótese Dentária
    (_clinic_id, 'Pino de fibra de vidro', 'protese', 350.00, 45, 'Inclui preparo, cimentação e material'),
    (_clinic_id, 'Pino metálico / núcleo metálico fundido', 'protese', 450.00, 60, 'Inclui fase clínica e adaptação laboratorial'),
    (_clinic_id, 'Coroa provisória', 'protese', 200.00, 45, 'Acrílico em consultório ou lab'),
    (_clinic_id, 'Coroa em porcelana / metalocerâmica', 'protese', 1500.00, NULL, 'Inclui moldagem e cimentação'),
    (_clinic_id, 'Coroa total em zircônia', 'protese', 1800.00, NULL, 'Metal-free, maior estética e custo lab'),
    (_clinic_id, 'Onlay / inlay cerâmica', 'protese', 1400.00, NULL, 'Restauração indireta parcial'),
    (_clinic_id, 'Prótese parcial removível', 'protese', 2500.00, NULL, 'PPR convencional (armação metálica)'),
    (_clinic_id, 'Prótese total', 'protese', 1800.00, NULL, 'Dentadura padrão por arcada'),
    (_clinic_id, 'Reembasamento de prótese', 'protese', 400.00, 60, 'Reembasamento direto ou indireto'),
    (_clinic_id, 'Placa miorrelaxante', 'protese', 900.00, 60, 'Acrílica rígida para bruxismo'),

    -- H) Ortodontia
    (_clinic_id, 'Documentação ortodôntica / planejamento', 'ortodontia', 250.00, 30, 'Análise de pasta radiográfica na clínica'),
    (_clinic_id, 'Instalação de aparelho metálico convencional', 'ortodontia', 800.00, 60, 'Apenas o aparelho básico'),
    (_clinic_id, 'Manutenção mensal aparelho metálico', 'ortodontia', 150.00, 30, 'Consulta de ativação periódica'),
    (_clinic_id, 'Instalação aparelho estético', 'ortodontia', 1500.00, 60, 'Bráquetes de safira'),
    (_clinic_id, 'Manutenção aparelho estético', 'ortodontia', 200.00, 30, 'Valor ajustado pelo tipo de material'),
    (_clinic_id, 'Contenção ortodôntica (2 arcadas)', 'ortodontia', 850.00, 45, 'Fixa (inferior) e placa (superior)'),
    (_clinic_id, 'Alinhadores (planejamento inicial)', 'ortodontia', 1500.00, 60, 'Custo do setup digital e moldagem/escaneamento'),

    -- I) Odontopediatria
    (_clinic_id, 'Consulta infantil', 'odontopediatria', 200.00, 60, 'Abordagem comportamental e lúdica'),
    (_clinic_id, 'Profilaxia infantil', 'odontopediatria', 120.00, 30, 'Escovação supervisionada e taça de borracha'),
    (_clinic_id, 'Aplicação de flúor infantil', 'odontopediatria', 100.00, 30, 'Verniz ou gel'),
    (_clinic_id, 'Selante por dente', 'odontopediatria', 100.00, 30, 'Prevenção de cáries em molares'),
    (_clinic_id, 'Restauração em dente decíduo', 'odontopediatria', 150.00, 45, 'Resina ou ionômero de vidro'),
    (_clinic_id, 'Pulpotomia', 'odontopediatria', 350.00, 60, 'Tratamento endodôntico parcial'),
    (_clinic_id, 'Exodontia dente decíduo', 'odontopediatria', 150.00, 30, 'Dentes "de leite" com mobilidade'),
    (_clinic_id, 'Mantenedor de espaço', 'odontopediatria', 450.00, 60, 'Banda e alça (inclui fase laboratorial)');
END;
$function$;