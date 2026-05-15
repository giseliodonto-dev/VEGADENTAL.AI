import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const USAGE_TYPES = [
  "Interno",
  "Externo",
  "IM",
  "EV",
  "Pomada",
  "Tópico",
  "Solução Oral",
  "Bochecho",
] as const;
export type UsageType = (typeof USAGE_TYPES)[number];

export interface Medication {
  name: string;
  usage_type: UsageType;
  posology: string;
  duration_days: number;
}

const medSchema = z.object({
  name: z.string().min(1),
  usage_type: z.enum(USAGE_TYPES),
  posology: z.string().min(1),
  duration_days: z.coerce.number().int().min(1).max(365),
});

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const m = text.match(/\{[\s\S]*\}/);
  return m ? m[0] : text;
}

export async function suggestPosology(name: string): Promise<Medication> {
  const prompt = `Atue como um farmacologista clínico. Para o medicamento ${name}, forneça a posologia padrão odontológica, tipo de uso e duração recomendada seguindo as normas farmacológicas brasileiras. Retorne APENAS JSON válido no formato: {"name": string, "usage_type": one of [${USAGE_TYPES.map((u) => `"${u}"`).join(", ")}], "posology": string, "duration_days": number}. Sem texto fora do JSON.`;

  const { data, error } = await supabase.functions.invoke("claude-ai-service", {
    body: { messages: [{ role: "user", content: prompt }] },
  });
  if (error) throw error;
  const reply: string = data?.reply ?? "";
  const parsed = JSON.parse(extractJson(reply));
  return medSchema.parse(parsed);
}
