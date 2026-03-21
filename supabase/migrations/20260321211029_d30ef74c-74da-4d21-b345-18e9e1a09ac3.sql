-- Add CRM and SDR roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crm';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sdr';