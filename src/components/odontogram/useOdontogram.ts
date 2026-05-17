import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Condition, Face, StatusType, isDiagnosis, procedureForCondition,
} from "./odontogramConfig";

export type OdontogramMark = {
  id: string;
  patient_id: string;
  clinic_id: string;
  tooth_number: string;
  face: Face;
  status_type: StatusType;
  condition: Condition;
  treatment_id: string | null;
  created_at: string;
};

export function useOdontogramMarks(patientId: string, statusType: StatusType) {
  return useQuery({
    queryKey: ["odontogram-marks", patientId, statusType],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("patient_odontogram")
        .select("*")
        .eq("patient_id", patientId)
        .eq("status_type", statusType);
      if (error) throw error;
      return (data as OdontogramMark[]) || [];
    },
    enabled: !!patientId,
  });
}

export function useToggleMark(patientId: string, clinicId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tooth_number: string;
      face: Face;
      status_type: StatusType;
      condition: Condition;
      existingId?: string | null;
      existingCondition?: Condition | null;
    }) => {
      if (!clinicId) throw new Error("Clínica não identificada");

      // Toggle off: clique na mesma condição já marcada → remove
      if (input.existingId && input.existingCondition === input.condition) {
        const { error } = await (supabase as any)
          .from("patient_odontogram")
          .delete()
          .eq("id", input.existingId);
        if (error) throw error;
        return { removed: true };
      }

      // Upsert da marca
      const payload = {
        patient_id: patientId,
        clinic_id: clinicId,
        tooth_number: input.tooth_number,
        face: input.face,
        status_type: input.status_type,
        condition: input.condition,
      };
      const { data: upserted, error: upErr } = await (supabase as any)
        .from("patient_odontogram")
        .upsert(payload, { onConflict: "patient_id,tooth_number,face,status_type" })
        .select()
        .single();
      if (upErr) throw upErr;

      // Geração automática no Plano de Tratamento
      const procName = procedureForCondition(input.condition, input.face);
      const { data: catalog } = await supabase
        .from("procedures_catalog")
        .select("name, default_value")
        .eq("clinic_id", clinicId)
        .ilike("name", procName)
        .maybeSingle();
      const value = Number(catalog?.default_value || 0);

      // checa se já existe treatment do mesmo dente/procedimento planejado
      const { data: existing } = await supabase
        .from("treatments")
        .select("id, status")
        .eq("patient_id", patientId)
        .eq("clinic_id", clinicId)
        .eq("tooth_number", input.tooth_number)
        .eq("procedure_type", procName)
        .maybeSingle();

      let treatmentId: string | null = existing?.id || null;
      if (input.status_type === "inicial" && isDiagnosis(input.condition)) {
        if (!existing) {
          const { data: ins, error: tErr } = await supabase
            .from("treatments")
            .insert({
              patient_id: patientId,
              clinic_id: clinicId,
              procedure_type: procName,
              tooth_number: input.tooth_number,
              value,
              status: "planejado",
            })
            .select("id")
            .single();
          if (tErr) throw tErr;
          treatmentId = ins.id;
        }
      } else if (input.status_type === "final") {
        if (existing) {
          await supabase
            .from("treatments")
            .update({ status: "executado" })
            .eq("id", existing.id);
          treatmentId = existing.id;
        } else {
          const { data: ins } = await supabase
            .from("treatments")
            .insert({
              patient_id: patientId,
              clinic_id: clinicId,
              procedure_type: procName,
              tooth_number: input.tooth_number,
              value,
              status: "executado",
            })
            .select("id")
            .single();
          treatmentId = ins?.id || null;
        }
      }

      if (treatmentId && upserted?.id && upserted.treatment_id !== treatmentId) {
        await (supabase as any)
          .from("patient_odontogram")
          .update({ treatment_id: treatmentId })
          .eq("id", upserted.id);
      }
      return { removed: false };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["odontogram-marks", patientId, vars.status_type] });
      qc.invalidateQueries({ queryKey: ["treatments", patientId] });
    },
    onError: (e: any) => toast.error("Erro: " + (e.message || e)),
  });
}
