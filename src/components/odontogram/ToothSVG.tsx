import { memo } from "react";
import { Face, ToothType, Condition, CONDITION_FILL, CONDITION_STROKE, toothType } from "./odontogramConfig";

// Silhuetas anatômicas simplificadas. Cada dente é desenhado em viewBox 60x90.
// Crown (parte superior) com formato por tipo + raiz embaixo.
// As 5 faces são paths transparentes sobrepostos sobre o crown, clicáveis.

type Props = {
  toothNumber: number;
  isUpper: boolean;                              // controla orientação da raiz
  facesByCondition: Partial<Record<Face, Condition>>;
  onFaceClick: (face: Face, e: React.MouseEvent<SVGPathElement>) => void;
};

// Caminho do crown por tipo
function crownPath(type: ToothType): string {
  switch (type) {
    case "incisivo":
      // retangular afilado
      return "M14 12 Q30 4 46 12 L48 38 Q30 44 12 38 Z";
    case "canino":
      // ponta única
      return "M14 16 Q30 2 46 16 L48 38 Q30 44 12 38 Z";
    case "premolar":
      // duas cúspides suaves
      return "M12 18 Q20 6 30 14 Q40 6 48 18 L48 40 Q30 46 12 40 Z";
    case "molar":
      // quatro cúspides (sulco em +)
      return "M10 18 Q17 8 22 16 Q30 8 38 16 Q43 8 50 18 L50 42 Q30 48 10 42 Z";
  }
}

// Linhas que delimitam as 5 faces (visualmente, sobre o crown)
function FaceOverlays({
  type, facesByCondition, onFaceClick,
}: { type: ToothType; facesByCondition: Props["facesByCondition"]; onFaceClick: Props["onFaceClick"]; }) {
  // Definição genérica: dividimos o crown em uma cruz.
  // mesial = esquerda, distal = direita, vestibular = topo (frente), lingual = base do crown,
  // oclusal = centro (1/3 central). Funciona como representação clínica simplificada.
  const faces: { face: Face; d: string }[] = [
    { face: "vestibular", d: "M12 12 Q30 4 48 12 L42 22 L18 22 Z" },
    { face: "mesial",     d: "M12 12 L18 22 L18 34 L12 38 Z" },
    { face: "distal",     d: "M48 12 L42 22 L42 34 L48 38 Z" },
    { face: "lingual",    d: "M18 34 L42 34 L48 38 Q30 44 12 38 Z" },
    { face: "oclusal",    d: "M18 22 L42 22 L42 34 L18 34 Z" },
  ];
  // Ajustes leves por tipo
  if (type === "incisivo" || type === "canino") {
    faces[4].d = "M22 22 L38 22 L38 32 L22 32 Z"; // oclusal/incisal mais estreita
  }
  return (
    <>
      {faces.map(({ face, d }) => {
        const cond = facesByCondition[face];
        return (
          <path
            key={face}
            d={d}
            data-face={face}
            onClick={(e) => onFaceClick(face, e)}
            className="cursor-pointer transition-all hover:stroke-[#103444]"
            fill={cond ? CONDITION_FILL[cond] : "transparent"}
            stroke={cond ? CONDITION_STROKE[cond] : "rgba(16,52,68,0.25)"}
            strokeWidth={cond ? 1.2 : 0.6}
            style={{
              filter: cond ? "drop-shadow(0 0 2px rgba(16,52,68,0.25))" : undefined,
            }}
          />
        );
      })}
    </>
  );
}

function ToothSVGBase({ toothNumber, isUpper, facesByCondition, onFaceClick }: Props) {
  const type = toothType(toothNumber);
  const ausente = facesByCondition.vestibular === "ausente"
    || facesByCondition.oclusal === "ausente"
    || Object.values(facesByCondition).includes("ausente");

  return (
    <div className="flex flex-col items-center group">
      <span className="text-[10px] font-semibold text-[#103444]/60 tabular-nums">
        {toothNumber}
      </span>
      <svg viewBox="0 0 60 90" className="w-12 h-16 group-hover:drop-shadow-[0_0_4px_rgba(16,52,68,0.35)] transition">
        <g transform={isUpper ? "" : "translate(0,90) scale(1,-1)"}>
          {/* raiz */}
          <path
            d="M18 38 Q30 36 42 38 L38 70 Q30 78 22 70 Z"
            data-face="raiz"
            onClick={(e) => onFaceClick("raiz", e)}
            className="cursor-pointer transition-all hover:stroke-[#103444]"
            fill={facesByCondition.raiz ? CONDITION_FILL[facesByCondition.raiz] : "#fdfaf2"}
            stroke={facesByCondition.raiz ? CONDITION_STROKE[facesByCondition.raiz] : "rgba(16,52,68,0.3)"}
            strokeWidth={0.8}
          />
          {/* coroa base */}
          <path
            d={crownPath(type)}
            fill={ausente ? "rgba(148,163,184,0.5)" : "#ffffff"}
            stroke="rgba(16,52,68,0.4)"
            strokeWidth={0.8}
            style={ausente ? { textDecoration: "line-through" } : undefined}
          />
          {/* faces clicáveis */}
          {!ausente && (
            <FaceOverlays type={type} facesByCondition={facesByCondition} onFaceClick={onFaceClick} />
          )}
          {ausente && (
            <line x1="10" y1="10" x2="50" y2="44" stroke="#475569" strokeWidth="1.2" />
          )}
        </g>
      </svg>
    </div>
  );
}

export const ToothSVG = memo(ToothSVGBase);
