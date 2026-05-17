import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Condition, CONDITION_LABELS, StatusType, Face, Specialty,
  CONDITION_SPECIALTY, SPECIALTY_LABEL, Combo, COMBO_LABEL,
  endodonticProcedureFor, isSiso, isDiagnosis,
} from "./odontogramConfig";
import {
  Activity, Sparkles, Crown, Anchor, Ruler, Leaf, Scissors,
  Stethoscope, Zap,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  anchor: { x: number; y: number } | null;
  statusType: StatusType;
  toothNumber: number;
  face: Face;
  currentCondition: Condition | null;
  onSelect: (c: Condition) => void;
  onSelectCombo: (combo: Combo) => void;
};

const SPECIALTY_ICON: Record<Specialty, React.ElementType> = {
  diagnostico: Stethoscope,
  dentistica: Sparkles,
  endodontia: Activity,
  protese: Crown,
  implantodontia: Anchor,
  ortodontia: Ruler,
  periodontia: Leaf,
  cirurgia: Scissors,
};

const TREATMENT_ORDER: Specialty[] = [
  "dentistica", "endodontia", "protese",
  "implantodontia", "ortodontia", "periodontia", "cirurgia",
];

function treatmentsBySpecialty(): Record<Specialty, Condition[]> {
  const map = Object.fromEntries(TREATMENT_ORDER.map((s) => [s, [] as Condition[]])) as Record<Specialty, Condition[]>;
  (Object.keys(CONDITION_SPECIALTY) as Condition[]).forEach((c) => {
    const sp = CONDITION_SPECIALTY[c];
    if (sp === "diagnostico") return;
    if (isDiagnosis(c)) return;
    map[sp].push(c);
  });
  return map;
}

const DIAGNOSES: Condition[] = (Object.keys(CONDITION_SPECIALTY) as Condition[])
  .filter((c) => CONDITION_SPECIALTY[c] === "diagnostico");

export function ToothActionMenu({
  open, onOpenChange, anchor, statusType, toothNumber, face, currentCondition,
  onSelect, onSelectCombo,
}: Props) {
  const grouped = treatmentsBySpecialty();
  const dynEndo = endodonticProcedureFor(toothNumber);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span
          style={{
            position: "fixed",
            left: anchor?.x ?? 0,
            top: anchor?.y ?? 0,
            width: 1, height: 1, pointerEvents: "none",
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={8}
        className="w-[440px] max-h-[75vh] overflow-hidden p-0 border border-white/50 bg-white/40 backdrop-blur-xl shadow-2xl rounded-2xl"
      >
        <div className="px-4 pt-3 pb-2 border-b border-white/40 bg-white/30 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-widest text-[#103444]/70 font-semibold">
            Dente {toothNumber} · {face}
            {isSiso(toothNumber) && (
              <span className="ml-2 text-[10px] text-amber-700 normal-case tracking-normal font-medium">
                (Siso)
              </span>
            )}
          </p>
          <p className="text-[11px] text-[#103444]/50">
            {statusType === "inicial" ? "Diagnóstico Inicial" : "Evolução Clínica"}
          </p>
        </div>

        <Tabs defaultValue="tratamentos" className="w-full">
          <TabsList className="grid grid-cols-2 mx-3 mt-2 bg-white/30 backdrop-blur-md">
            <TabsTrigger value="diagnosticos" className="text-xs data-[state=active]:bg-red-500/15 data-[state=active]:text-red-700">
              🔴 Diagnósticos
            </TabsTrigger>
            <TabsTrigger value="tratamentos" className="text-xs data-[state=active]:bg-[#103444]/15 data-[state=active]:text-[#103444]">
              🔵 Tratamentos Planejados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagnosticos" className="px-3 pb-3 mt-2 max-h-[55vh] overflow-y-auto">
            <p className="text-[10px] text-[#103444]/60 mb-2 px-1">
              Marca apenas a condição visual do dente (não vai ao orçamento).
            </p>
            <div className="space-y-1">
              {DIAGNOSES.map((c) => (
                <ConditionButton
                  key={c}
                  condition={c}
                  label={CONDITION_LABELS[c]}
                  active={currentCondition === c}
                  onSelect={onSelect}
                  accent="diagnostico"
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tratamentos" className="px-2 pb-2 mt-2 max-h-[55vh] overflow-y-auto">
            <p className="text-[10px] text-[#103444]/60 mb-1 px-2">
              Cada item é amarrado ao catálogo da clínica e entra no plano com valor automático.
            </p>
            <Accordion type="multiple" defaultValue={["dentistica"]}>
              {TREATMENT_ORDER.map((sp) => {
                const Icon = SPECIALTY_ICON[sp];
                const items = grouped[sp];
                if (!items.length) return null;
                return (
                  <AccordionItem key={sp} value={sp} className="border-b border-white/30 last:border-0">
                    <AccordionTrigger className="py-2 px-2 text-xs font-bold uppercase tracking-wider text-[#103444] hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {SPECIALTY_LABEL[sp]}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-1">
                        {sp === "endodontia" ? (
                          <>
                            <ConditionButton
                              condition={dynEndo}
                              label={`Canal — ${CONDITION_LABELS[dynEndo]}`}
                              active={currentCondition === dynEndo}
                              onSelect={onSelect}
                              accent="endodontia"
                            />
                            <ConditionButton
                              condition="retratamento_endodontico"
                              label={CONDITION_LABELS["retratamento_endodontico"]}
                              active={currentCondition === "retratamento_endodontico"}
                              onSelect={onSelect}
                              accent="endodontia"
                            />
                          </>
                        ) : (
                          items.map((c) => (
                            <ConditionButton
                              key={c}
                              condition={c}
                              label={CONDITION_LABELS[c]}
                              active={currentCondition === c}
                              onSelect={onSelect}
                              accent={sp}
                            />
                          ))
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <div className="px-2 py-3 mt-1 border-t border-white/40 bg-gradient-to-br from-amber-50/40 to-white/20 rounded-b-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a8801f] mb-2 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Combos Inteligentes
              </p>
              <div className="space-y-1">
                {(["reabilitacao_unitaria", "implante_unitario", "protocolo_arcada"] as Combo[]).map((cb) => (
                  <button
                    key={cb}
                    onClick={() => onSelectCombo(cb)}
                    className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-[#103444] hover:bg-amber-100/60 ring-1 ring-amber-300/40 bg-white/40 transition"
                  >
                    <Zap className="h-3.5 w-3.5 text-[#c9a24c]" />
                    {COMBO_LABEL[cb]}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function ConditionButton({
  condition, label, active, onSelect, accent,
}: {
  condition: Condition;
  label: string;
  active: boolean;
  onSelect: (c: Condition) => void;
  accent: Specialty;
}) {
  const tone =
    accent === "diagnostico"
      ? active
        ? "bg-red-500/20 text-red-700 ring-1 ring-red-400/50"
        : "text-[#103444] hover:bg-red-500/10"
      : accent === "implantodontia" || accent === "protese"
      ? active
        ? "bg-amber-200/40 text-[#103444] ring-1 ring-[#c9a24c]/70"
        : "text-[#103444] hover:bg-amber-100/40"
      : active
      ? "bg-[#103444]/15 text-[#103444] ring-1 ring-[#103444]/40"
      : "text-[#103444] hover:bg-[#103444]/10";
  return (
    <button
      onClick={() => onSelect(condition)}
      className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition text-left ${tone}`}
    >
      {label}
    </button>
  );
}
