import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Condition, Face, StatusType, isDiagnosis, resolveProcedures,
  Combo, expandCombo, UPPER_TEETH, LOWER_TEETH_VISUAL,
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

// Garante uma linha em treatments com fallback 0.00 quando o catálogo não tem o procedimento.
async function ensureTreatment(args: {
  patientId: string;
  clinicId: string;
  procName: string;
  toothNumber: string;
  statusType: StatusType;
  condition: Condition;
}): Promise<string | null> {
  const { patientId, clinicId, procName, toothNumber, statusType, condition } = args;
  if (!procName) return null;

  // Busca catálogo: match exato; fallback ilike
  let value = 0;
  const { data: catExact } = await supabase
    .from("procedures_catalog")
    .select("default_value")
    .eq("clinic_id", clinicId)
    .eq("name", procName)
    .maybeSingle();
  if (catExact?.default_value != null) {
    value = Number(catExact.default_value);
  } else {
    const { data: catLike } = await supabase
      .from("procedures_catalog")
      .select("default_value")
      .eq("clinic_id", clinicId)
      .ilike("name", procName)
      .maybeSingle();
    value = Number(catLike?.default_value ?? 0);
  }

  // Verifica duplicidade
  const { data: existing } = await supabase
    .from("treatments")
    .select("id, status")
    .eq("patient_id", patientId)
    .eq("clinic_id", clinicId)
    .eq("tooth_number", toothNumber)
    .eq("procedure_type", procName)
    .maybeSingle();

  const isDx = isDiagnosis(condition);
  if (statusType === "inicial" && isDx) {
    if (existing) return existing.id;
    const { data: ins, error } = await supabase
      .from("treatments")
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        procedure_type: procName,
        tooth_number: toothNumber,
        value,
        status: "planejado",
      })
      .select("id")
      .single();
    if (error) throw error;
    return ins.id;
  }

  if (statusType === "final") {
    if (existing) {
      await supabase.from("treatments").update({ status: "executado" }).eq("id", existing.id);
      return existing.id;
    }
    const { data: ins } = await supabase
      .from("treatments")
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        procedure_type: procName,
        tooth_number: toothNumber,
        value,
        status: "executado",
      })
      .select("id")
      .single();
    return ins?.id ?? null;
  }

  // visão inicial mas tratamento direto → planejado
  if (existing) return existing.id;
  const { data: ins } = await supabase
    .from("treatments")
    .insert({
      patient_id: patientId,
      clinic_id: clinicId,
      procedure_type: procName,
      tooth_number: toothNumber,
      value,
      status: "planejado",
    })
    .select("id")
    .single();
  return ins?.id ?? null;
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

      // Toggle off
      if (input.existingId && input.existingCondition === input.condition) {
        const { error } = await (supabase as any)
          .from("patient_odontogram")
          .delete()
          .eq("id", input.existingId);
        if (error) throw error;
        return { removed: true };
      }

      // Upsert da marca
      const { data: upserted, error: upErr } = await (supabase as any)
        .from("patient_odontogram")
        .upsert(
          {
            patient_id: patientId,
            clinic_id: clinicId,
            tooth_number: input.tooth_number,
            face: input.face,
            status_type: input.status_type,
            condition: input.condition,
          },
          { onConflict: "patient_id,tooth_number,face,status_type" },
        )
        .select()
        .single();
      if (upErr) throw upErr;

      // Gera/atualiza tratamentos (1+ por condition via resolver)
      const procNames = resolveProcedures(input.condition, Number(input.tooth_number));
      let firstTreatmentId: string | null = null;
      for (const procName of procNames) {
        const tid = await ensureTreatment({
          patientId,
          clinicId,
          procName,
          toothNumber: input.tooth_number,
          statusType: input.status_type,
          condition: input.condition,
        });
        if (!firstTreatmentId) firstTreatmentId = tid;
      }

      if (firstTreatmentId && upserted?.id && upserted.treatment_id !== firstTreatmentId) {
        await (supabase as any)
          .from("patient_odontogram")
          .update({ treatment_id: firstTreatmentId })
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

export function useApplyCombo(patientId: string, clinicId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      combo: Combo;
      tooth_number: string;
      status_type: StatusType;
      arcadaScope?: "superior" | "inferior";
    }) => {
      if (!clinicId) throw new Error("Clínica não identificada");

      const conditions = expandCombo(input.combo, Number(input.tooth_number));

      // Procedimentos: gerados uma única vez por combo (não duplicar para cada dente da arcada).
      const procNames = new Set<string>();
      conditions.forEach((c) => {
        resolveProcedures(c, Number(input.tooth_number)).forEach((p) => procNames.add(p));
      });
      for (const procName of procNames) {
        await ensureTreatment({
          patientId,
          clinicId,
          procName,
          toothNumber: input.tooth_number,
          statusType: input.status_type,
          condition: conditions[0],
        });
      }

      // Marcas no odontograma
      if (input.combo === "protocolo_arcada" && input.arcadaScope) {
        const teeth = input.arcadaScope === "superior" ? UPPER_TEETH : LOWER_TEETH_VISUAL;
        const rows = teeth.map((t) => ({
          patient_id: patientId,
          clinic_id: clinicId,
          tooth_number: String(t),
          face: "vestibular" as Face,
          status_type: input.status_type,
          condition: "ausente" as Condition,
        }));
        await (supabase as any)
          .from("patient_odontogram")
          .upsert(rows, { onConflict: "patient_id,tooth_number,face,status_type" });
      } else {
        // Combos pontuais (reabilitação / implante unitário): marcamos as conditions na face vestibular do dente
        const rows = conditions.map((c) => ({
          patient_id: patientId,
          clinic_id: clinicId,
          tooth_number: input.tooth_number,
          // Para múltiplas conditions em um único dente/face, salvamos só a primeira (vestibular)
          // e as restantes em faces distintas para preservar histórico visual.
          face: faceForIndex(conditions.indexOf(c)),
          status_type: input.status_type,
          condition: c,
        }));
        await (supabase as any)
          .from("patient_odontogram")
          .upsert(rows, { onConflict: "patient_id,tooth_number,face,status_type" });
      }

      return { ok: true };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["odontogram-marks", patientId, vars.status_type] });
      qc.invalidateQueries({ queryKey: ["treatments", patientId] });
      toast.success("Combo aplicado ao plano de tratamento.");
    },
    onError: (e: any) => toast.error("Erro: " + (e.message || e)),
  });
}

function faceForIndex(i: number): Face {
  const order: Face[] = ["vestibular", "oclusal", "lingual", "mesial", "distal", "raiz"];
  return order[i % order.length];
}
