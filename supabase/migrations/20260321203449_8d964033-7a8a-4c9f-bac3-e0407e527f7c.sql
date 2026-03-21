ALTER TABLE public.sales_funnel
  ADD CONSTRAINT sales_funnel_responsible_user_id_fkey
  FOREIGN KEY (responsible_user_id) REFERENCES public.profiles(id);

ALTER TABLE public.sales_funnel
  ADD CONSTRAINT sales_funnel_patient_id_fkey_patients
  FOREIGN KEY (patient_id) REFERENCES public.patients(id);