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
      .single()
      .then(({ data }) => {
        setClinicId(data?.clinic_id ?? null);
        setLoading(false);
      });
  }, [user]);

  return { clinicId, loading };
}
