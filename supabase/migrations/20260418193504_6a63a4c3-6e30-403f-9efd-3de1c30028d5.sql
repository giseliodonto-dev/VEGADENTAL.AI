UPDATE public.clinics
SET logo_url = 'https://tyfjsxtorlvvrpzyhclc.supabase.co/storage/v1/object/public/clinic-logos/gc-odontologia/logo.png',
    cancellation_fee = COALESCE(cancellation_fee, 100)
WHERE name ILIKE '%GC Odontologia%' OR name ILIKE '%gc%odontologia%';