import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useClinic() {
  const { user } = useAuth();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setClinicId(null);
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase
      .from("clinic_members")
      .select("clinic_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar clínica do usuário:", error);
          setClinicId(null);
          setRole(null);
        } else {
          setClinicId(data?.clinic_id ?? null);
          setRole((data?.role as AppRole) ?? null);
        }
        setLoading(false);
      });
  }, [user?.id]);

  const createClinic = async (clinicName: string) => {
    if (!user) {
      throw new Error("Sessão não encontrada. Faça login novamente.");
    }
    const baseSlug =
      clinicName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "clinica";
    // Append short suffix to avoid unique-slug collisions
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .insert({ name: clinicName.trim(), slug })
      .select("id")
      .single();

    if (clinicError) {
      console.error("Falha ao inserir clínica:", clinicError);
      throw clinicError;
    }

    const { error: memberError } = await supabase
      .from("clinic_members")
      .insert({
        clinic_id: clinic.id,
        user_id: user.id,
        role: "dono" as const,
      });

    if (memberError) {
      console.error("Falha ao vincular dono à clínica:", memberError);
      throw memberError;
    }

    setClinicId(clinic.id);
    setRole("dono");
    return clinic.id;
  };

  return { clinicId, role, loading, createClinic };
}
