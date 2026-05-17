// Configuração do Odontograma Inteligente
// Numeração FDI (ISO 3950) — arcadas permanentes

export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_LEFT  = [38, 37, 36, 35, 34, 33, 32, 31];
export const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

export const UPPER_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT];
export const LOWER_TEETH = [...LOWER_RIGHT.slice().reverse(), ...LOWER_LEFT.slice().reverse()];
// ordem visual inferior (esquerda→direita do observador): 48..41 | 31..38
export const LOWER_TEETH_VISUAL = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export type ToothType = "incisivo" | "canino" | "premolar" | "molar";
export type Face = "vestibular" | "lingual" | "oclusal" | "mesial" | "distal" | "raiz";
export type StatusType = "inicial" | "final";

export type DiagnosisCondition = "carie" | "fratura" | "canal_necessario" | "ausente";
export type TreatmentCondition = "restauracao" | "endodontia" | "implante" | "coroa";
export type Condition = DiagnosisCondition | TreatmentCondition;

export function toothType(n: number): ToothType {
  const unit = n % 10;
  if (unit <= 2) return "incisivo";
  if (unit === 3) return "canino";
  if (unit <= 5) return "premolar";
  return "molar";
}

export const FACE_LABELS: Record<Face, string> = {
  vestibular: "Vestibular",
  lingual: "Palatina/Lingual",
  oclusal: "Oclusal/Incisal",
  mesial: "Mesial",
  distal: "Distal",
  raiz: "Raiz",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  carie: "Cárie",
  fratura: "Fratura",
  canal_necessario: "Canal Necessário",
  ausente: "Ausente",
  restauracao: "Restauração",
  endodontia: "Endodontia Concluída",
  implante: "Implante",
  coroa: "Coroa / Prótese",
};

// Cores por condição (preenchimento da face)
export const CONDITION_FILL: Record<Condition, string> = {
  carie: "rgba(239, 68, 68, 0.55)",
  fratura: "rgba(239, 68, 68, 0.3)",
  canal_necessario: "rgba(168, 85, 247, 0.5)",
  ausente: "rgba(148, 163, 184, 0.85)",
  restauracao: "rgba(16, 52, 68, 0.85)",
  endodontia: "rgba(59, 130, 246, 0.7)",
  implante: "rgba(201, 162, 76, 0.9)",
  coroa: "rgba(201, 162, 76, 0.6)",
};

export const CONDITION_STROKE: Record<Condition, string> = {
  carie: "#dc2626",
  fratura: "#dc2626",
  canal_necessario: "#7e22ce",
  ausente: "#475569",
  restauracao: "#103444",
  endodontia: "#1d4ed8",
  implante: "#a8801f",
  coroa: "#a8801f",
};

// Mapa: condição + face → nome do procedimento no procedures_catalog
export function procedureForCondition(c: Condition, face: Face): string {
  switch (c) {
    case "carie":
      return face === "oclusal"
        ? "Restauração em resina 1 face"
        : "Restauração em resina 2 faces";
    case "fratura":
      return "Restauração em resina 2 faces";
    case "canal_necessario":
      return "Tratamento de canal multirradicular";
    case "ausente":
      return "Implante unitário (instalação)";
    case "restauracao":
      return "Restauração em resina 1 face";
    case "endodontia":
      return "Tratamento de canal multirradicular";
    case "implante":
      return "Implante unitário (instalação)";
    case "coroa":
      return "Coroa em porcelana / metalocerâmica";
  }
}

// Diagnóstico marcado na visão "inicial" gera treatment planejado;
// Tratamento marcado na visão "final" gera/atualiza para executado.
export function isDiagnosis(c: Condition): c is DiagnosisCondition {
  return ["carie", "fratura", "canal_necessario", "ausente"].includes(c);
}
