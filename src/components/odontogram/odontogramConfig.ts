// Configuração do Odontograma Inteligente — Matriz Preditiva Absoluta
// Numeração FDI (ISO 3950) — arcadas permanentes

export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_LEFT  = [38, 37, 36, 35, 34, 33, 32, 31];
export const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

export const UPPER_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT];
export const LOWER_TEETH = [...LOWER_RIGHT.slice().reverse(), ...LOWER_LEFT.slice().reverse()];
export const LOWER_TEETH_VISUAL = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export type ToothType = "incisivo" | "canino" | "premolar" | "molar";
export type Face = "vestibular" | "lingual" | "oclusal" | "mesial" | "distal" | "raiz";
export type StatusType = "inicial" | "final";

export type Specialty =
  | "diagnostico"
  | "dentistica"
  | "endodontia"
  | "protese"
  | "implantodontia"
  | "ortodontia"
  | "periodontia"
  | "cirurgia";

export type Condition =
  // Diagnósticos
  | "carie"
  | "fratura"
  | "pulpite_necrose"
  | "ausente"
  | "destruicao_coronaria"
  | "arcada_ausente_total"
  // Dentística
  | "restauracao_direta_1face"
  | "restauracao_complexa_2faces"
  | "remineralizacao_selante"
  | "restauracao_cervical"
  | "reconstrucao_estetica"
  | "restauracao_indireta"
  // Endodontia
  | "canal_unirradicular"
  | "canal_birradicular"
  | "canal_multirradicular"
  | "retratamento_endodontico"
  // Prótese
  | "retentor_intrarradicular"
  | "coroa_provisoria"
  | "coroa_ceramica"
  | "ponte_fixa"
  | "ppr"
  | "protese_total"
  // Implantodontia
  | "implante_unitario_cirurgia"
  | "coroa_sobre_implante"
  | "implantes_multiplos_cirurgia"
  | "ponte_sobre_implantes"
  | "protocolo_cirurgia"
  | "protocolo_protese"
  // Ortodontia
  | "aparelho_fixo"
  | "aparelho_removivel"
  | "alinhadores"
  | "planejamento_ortodontico_digital"
  // Periodontia
  | "raspagem_supra_profilaxia"
  | "raspagem_sub_polimento"
  | "splintagem_gengival"
  // Cirurgia
  | "exodontia_permanente"
  | "exodontia_siso"
  | "placa_miorrelaxante";

export type DiagnosisCondition =
  | "carie" | "fratura" | "pulpite_necrose" | "ausente"
  | "destruicao_coronaria" | "arcada_ausente_total";

const DIAGNOSIS_SET: DiagnosisCondition[] = [
  "carie", "fratura", "pulpite_necrose", "ausente",
  "destruicao_coronaria", "arcada_ausente_total",
];

export function isDiagnosis(c: Condition): c is DiagnosisCondition {
  return (DIAGNOSIS_SET as string[]).includes(c);
}

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

// Labels curtas (UI do menu)
export const CONDITION_LABELS: Record<Condition, string> = {
  carie: "Cárie",
  fratura: "Fratura",
  pulpite_necrose: "Pulpite / Necrose",
  ausente: "Ausente",
  destruicao_coronaria: "Destruição Coronária",
  arcada_ausente_total: "Arcada Ausente Total",

  restauracao_direta_1face: "Restauração Direta (1 face)",
  restauracao_complexa_2faces: "Restauração Complexa (2+ faces)",
  remineralizacao_selante: "Remineralização / Selante",
  restauracao_cervical: "Restauração Cervical",
  reconstrucao_estetica: "Reconstrução Estética",
  restauracao_indireta: "Inlay / Onlay / Overlay",

  canal_unirradicular: "Canal Unirradicular",
  canal_birradicular: "Canal Birradicular",
  canal_multirradicular: "Canal Trirradicular / Multirradicular",
  retratamento_endodontico: "Retratamento Endodôntico",

  retentor_intrarradicular: "Retentor Intrarradicular (Pino/Núcleo)",
  coroa_provisoria: "Coroa Total Provisória",
  coroa_ceramica: "Coroa Total em Cerâmica / Metalocerâmica",
  ponte_fixa: "Prótese Parcial Fixa (Ponte)",
  ppr: "Prótese Parcial Removível (PPR)",
  protese_total: "Prótese Total (Dentadura)",

  implante_unitario_cirurgia: "Implante Unitário (Cirúrgica)",
  coroa_sobre_implante: "Coroa sobre Implante (Protética)",
  implantes_multiplos_cirurgia: "Implantes Múltiplos (Cirúrgica)",
  ponte_sobre_implantes: "Ponte Fixa sobre Implantes (Protética)",
  protocolo_cirurgia: "Protocolo (Cirúrgica)",
  protocolo_protese: "Protocolo Fixo (Protética)",

  aparelho_fixo: "Aparelho Ortodôntico Fixo",
  aparelho_removivel: "Aparelho Ortodôntico Removível",
  alinhadores: "Alinhadores Invisíveis",
  planejamento_ortodontico_digital: "Planejamento Ortodôntico Digital",

  raspagem_supra_profilaxia: "Raspagem Supragengival + Profilaxia",
  raspagem_sub_polimento: "Raspagem Subgengival + Polimento",
  splintagem_gengival: "Splintagem Gengival (Contenção)",

  exodontia_permanente: "Exodontia de Dente Permanente",
  exodontia_siso: "Exodontia de Siso (Incluso/Semi-Incluso)",
  placa_miorrelaxante: "Placa Miorrelaxante (Bruxismo)",
};

// Nome EXATO usado no procedures_catalog / treatments.procedure_type
export const PROCEDURE_NAME: Record<Condition, string> = {
  // diagnósticos não geram procedimento por si — fallback string vazia tratada no resolver
  carie: "Restauração Estética Direta (1 face)",
  fratura: "Restauração Estética Complexa (2 ou mais faces)",
  pulpite_necrose: "Tratamento Endodôntico",
  ausente: "Implante Dentário Unitário (Fase Cirúrgica)",
  destruicao_coronaria: "Reconstrução Dentária Estética",
  arcada_ausente_total: "Prótese Protocolo Fixa (Fase Protética)",

  restauracao_direta_1face: "Restauração Estética Direta (1 face)",
  restauracao_complexa_2faces: "Restauração Estética Complexa (2 ou mais faces)",
  remineralizacao_selante: "Protocolo de Remineralização / Selante",
  restauracao_cervical: "Restauração Estética Cervical",
  reconstrucao_estetica: "Reconstrução Dentária Estética",
  restauracao_indireta: "Restauração Indireta Estética (Inlay / Onlay / Overlay)",

  canal_unirradicular: "Canal Unirradicular",
  canal_birradicular: "Canal Birradicular",
  canal_multirradicular: "Canal Trirradicular / Multirradicular",
  retratamento_endodontico: "Retratamento Endodôntico",

  retentor_intrarradicular: "Retentor Intrarradicular (Pino de Fibra / Núcleo Metálico)",
  coroa_provisoria: "Coroa Total Provisória",
  coroa_ceramica: "Coroa Total em Cerâmica Pura / Metalocerâmica",
  ponte_fixa: "Prótese Parcial Fixa (Ponte)",
  ppr: "Prótese Parcial Removível (PPR)",
  protese_total: "Prótese Total (Dentadura)",

  implante_unitario_cirurgia: "Implante Dentário Unitário (Fase Cirúrgica)",
  coroa_sobre_implante: "Coroa sobre Implante (Fase Protética)",
  implantes_multiplos_cirurgia: "Implantes Múltiplos (Fase Cirúrgica)",
  ponte_sobre_implantes: "Ponte Fixa sobre Implantes (Fase Protética)",
  protocolo_cirurgia: "Instalação de Implantes para Protocolo (Fase Cirúrgica)",
  protocolo_protese: "Prótese Protocolo Fixa (Fase Protética)",

  aparelho_fixo: "Instalação de Aparelho Ortodôntico Fixo",
  aparelho_removivel: "Aparelho Ortodôntico Removível",
  alinhadores: "Tratamento com Alinhadores Invisíveis",
  planejamento_ortodontico_digital: "Planejamento Ortodôntico Digital / Escaneamento",

  raspagem_supra_profilaxia: "Raspagem Supragengival + Profilaxia",
  raspagem_sub_polimento: "Raspagem Subgengival + Polimento Radicular",
  splintagem_gengival: "Splintagem Gengival (Contenção)",

  exodontia_permanente: "Exodontia de Dente Permanente",
  exodontia_siso: "Exodontia de Dente Incluso / Semi-Incluso (Siso)",
  placa_miorrelaxante: "Placa Miorrelaxante Estabilizadora (Placa de Bruxismo)",
};

export const CONDITION_SPECIALTY: Record<Condition, Specialty> = {
  carie: "diagnostico",
  fratura: "diagnostico",
  pulpite_necrose: "diagnostico",
  ausente: "diagnostico",
  destruicao_coronaria: "diagnostico",
  arcada_ausente_total: "diagnostico",

  restauracao_direta_1face: "dentistica",
  restauracao_complexa_2faces: "dentistica",
  remineralizacao_selante: "dentistica",
  restauracao_cervical: "dentistica",
  reconstrucao_estetica: "dentistica",
  restauracao_indireta: "dentistica",

  canal_unirradicular: "endodontia",
  canal_birradicular: "endodontia",
  canal_multirradicular: "endodontia",
  retratamento_endodontico: "endodontia",

  retentor_intrarradicular: "protese",
  coroa_provisoria: "protese",
  coroa_ceramica: "protese",
  ponte_fixa: "protese",
  ppr: "protese",
  protese_total: "protese",

  implante_unitario_cirurgia: "implantodontia",
  coroa_sobre_implante: "implantodontia",
  implantes_multiplos_cirurgia: "implantodontia",
  ponte_sobre_implantes: "implantodontia",
  protocolo_cirurgia: "implantodontia",
  protocolo_protese: "implantodontia",

  aparelho_fixo: "ortodontia",
  aparelho_removivel: "ortodontia",
  alinhadores: "ortodontia",
  planejamento_ortodontico_digital: "ortodontia",

  raspagem_supra_profilaxia: "periodontia",
  raspagem_sub_polimento: "periodontia",
  splintagem_gengival: "periodontia",

  exodontia_permanente: "cirurgia",
  exodontia_siso: "cirurgia",
  placa_miorrelaxante: "cirurgia",
};

export const SPECIALTY_LABEL: Record<Specialty, string> = {
  diagnostico: "Diagnósticos",
  dentistica: "Dentística & Estética",
  endodontia: "Endodontia",
  protese: "Prótese & Reabilitação",
  implantodontia: "Implantodontia",
  ortodontia: "Ortodontia",
  periodontia: "Periodontia",
  cirurgia: "Cirurgia & Disfunção",
};

// Cores por especialidade (fallback) e por condição (overrides)
const SPECIALTY_FILL: Record<Specialty, string> = {
  diagnostico: "rgba(239, 68, 68, 0.55)",
  dentistica: "rgba(16, 52, 68, 0.55)",
  endodontia: "rgba(59, 130, 246, 0.6)",
  protese: "rgba(201, 162, 76, 0.6)",
  implantodontia: "rgba(201, 162, 76, 0.85)",
  ortodontia: "rgba(124, 58, 237, 0.55)",
  periodontia: "rgba(16, 185, 129, 0.55)",
  cirurgia: "rgba(220, 38, 38, 0.65)",
};

const SPECIALTY_STROKE: Record<Specialty, string> = {
  diagnostico: "#dc2626",
  dentistica: "#103444",
  endodontia: "#1d4ed8",
  protese: "#a8801f",
  implantodontia: "#a8801f",
  ortodontia: "#6d28d9",
  periodontia: "#047857",
  cirurgia: "#991b1b",
};

const CONDITION_FILL_OVERRIDES: Partial<Record<Condition, string>> = {
  carie: "rgba(239, 68, 68, 0.55)",
  fratura: "rgba(239, 68, 68, 0.3)",
  pulpite_necrose: "rgba(168, 85, 247, 0.55)",
  ausente: "rgba(148, 163, 184, 0.85)",
  destruicao_coronaria: "rgba(220, 38, 38, 0.4)",
  arcada_ausente_total: "rgba(148, 163, 184, 0.85)",
};

const CONDITION_STROKE_OVERRIDES: Partial<Record<Condition, string>> = {
  pulpite_necrose: "#7e22ce",
  ausente: "#475569",
  arcada_ausente_total: "#475569",
};

export const CONDITION_FILL: Record<Condition, string> = Object.fromEntries(
  (Object.keys(CONDITION_SPECIALTY) as Condition[]).map((c) => [
    c,
    CONDITION_FILL_OVERRIDES[c] ?? SPECIALTY_FILL[CONDITION_SPECIALTY[c]],
  ]),
) as Record<Condition, string>;

export const CONDITION_STROKE: Record<Condition, string> = Object.fromEntries(
  (Object.keys(CONDITION_SPECIALTY) as Condition[]).map((c) => [
    c,
    CONDITION_STROKE_OVERRIDES[c] ?? SPECIALTY_STROKE[CONDITION_SPECIALTY[c]],
  ]),
) as Record<Condition, string>;

// ─── Endodontia dinâmica ─────────────────────────────────────────────────
export function endodonticProcedureFor(toothNumber: number): Condition {
  const unit = toothNumber % 10;
  if (unit <= 3) return "canal_unirradicular";          // incisivos e caninos
  if (unit === 4 || unit === 5) return "canal_birradicular"; // pré-molares
  return "canal_multirradicular";                        // molares (6, 7, 8)
}

// ─── Siso automático ─────────────────────────────────────────────────────
export function isSiso(toothNumber: number): boolean {
  return [18, 28, 38, 48].includes(toothNumber);
}

// ─── Combos inteligentes ─────────────────────────────────────────────────
export type Combo =
  | "reabilitacao_unitaria"   // canal + destruição
  | "implante_unitario"       // ausente + implante
  | "protocolo_arcada";       // arcada ausente total

export const COMBO_LABEL: Record<Combo, string> = {
  reabilitacao_unitaria: "Reabilitação Unitária (Canal + Pino + Coroa)",
  implante_unitario: "Implante Unitário (Cirurgia + Coroa)",
  protocolo_arcada: "Protocolo de Arcada (Cirurgia + Prótese)",
};

export function expandCombo(combo: Combo, toothNumber: number): Condition[] {
  switch (combo) {
    case "reabilitacao_unitaria":
      return [
        endodonticProcedureFor(toothNumber),
        "retentor_intrarradicular",
        "coroa_provisoria",
        "coroa_ceramica",
      ];
    case "implante_unitario":
      return ["implante_unitario_cirurgia", "coroa_sobre_implante"];
    case "protocolo_arcada":
      return ["protocolo_cirurgia", "protocolo_protese"];
  }
}

// ─── Resolver: condition + tooth → lista de nomes exatos ─────────────────
export function resolveProcedures(condition: Condition, toothNumber: number): string[] {
  // Pulpite/Necrose → canal dinâmico
  if (condition === "pulpite_necrose") {
    return [PROCEDURE_NAME[endodonticProcedureFor(toothNumber)]];
  }
  // Exodontia em siso (18/28/38/48) → trocar para exodontia_siso
  if (condition === "exodontia_permanente" && isSiso(toothNumber)) {
    return [PROCEDURE_NAME["exodontia_siso"]];
  }
  // Ausente diagnóstico já mapeia para implante unitário (PROCEDURE_NAME["ausente"])
  return [PROCEDURE_NAME[condition]];
}

// Compat: ainda exporta procedureForCondition (assinatura antiga) p/ não quebrar imports
export function procedureForCondition(c: Condition, _face: Face, toothNumber = 11): string {
  return resolveProcedures(c, toothNumber)[0] ?? "";
}
