import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useClinic() {
  const { user } = useAuth();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setClinicId(null);
      setLoading(false);
      return;
    }

    supabase
      .from("clinic_members")
      .select("clinic_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setClinicId(data?.clinic_id ?? null);
        setLoading(false);
      });
  }, [user]);

  const createClinic = async (clinicName: string) => {
    if (!user) return null;

    const slug = clinicName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "clinica";

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .insert({ name: clinicName.trim(), slug })
      .select("id")
      .single();

    if (clinicError) throw clinicError;

    const { error: memberError } = await supabase
      .from("clinic_members")
      .insert({
        clinic_id: clinic.id,
        user_id: user.id,
        role: "dono" as const,
      });

    if (memberError) throw memberError;

    setClinicId(clinic.id);
    return clinic.id;
  };

  return { clinicId, loading, createClinic };
}
