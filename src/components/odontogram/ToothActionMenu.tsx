import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Condition, CONDITION_LABELS, StatusType, Face } from "./odontogramConfig";
import { Activity, Sparkles, Crown, Hammer, Drill, Wrench, X, Anchor } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  anchor: { x: number; y: number } | null;
  statusType: StatusType;
  toothNumber: number;
  face: Face;
  currentCondition: Condition | null;
  onSelect: (c: Condition) => void;
};

const DIAGNOSIS: { c: Condition; icon: React.ElementType }[] = [
  { c: "carie", icon: Drill },
  { c: "fratura", icon: Hammer },
  { c: "canal_necessario", icon: Activity },
  { c: "ausente", icon: X },
];

const TREATMENT: { c: Condition; icon: React.ElementType }[] = [
  { c: "restauracao", icon: Sparkles },
  { c: "endodontia", icon: Wrench },
  { c: "implante", icon: Anchor },
  { c: "coroa", icon: Crown },
];

export function ToothActionMenu({
  open, onOpenChange, anchor, statusType, toothNumber, face, currentCondition, onSelect,
}: Props) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span
          style={{
            position: "fixed",
            left: anchor?.x ?? 0,
            top: anchor?.y ?? 0,
            width: 1,
            height: 1,
            pointerEvents: "none",
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={8}
        className="w-[360px] p-0 border border-white/50 bg-white/40 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden"
      >
        <div className="px-4 pt-3 pb-2 border-b border-white/40 bg-white/30">
          <p className="text-xs uppercase tracking-widest text-[#103444]/70 font-semibold">
            Dente {toothNumber} · {face}
          </p>
          <p className="text-[11px] text-[#103444]/50">
            {statusType === "inicial" ? "Diagnóstico Inicial" : "Evolução Clínica"}
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/40">
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-600/80 mb-2">
              Diagnósticos
            </p>
            <div className="space-y-1">
              {DIAGNOSIS.map(({ c, icon: Icon }) => {
                const active = currentCondition === c;
                return (
                  <button
                    key={c}
                    onClick={() => onSelect(c)}
                    className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition
                      ${active
                        ? "bg-red-500/20 text-red-700 ring-1 ring-red-400/50"
                        : "text-[#103444] hover:bg-red-500/10"}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-red-500" />
                    {CONDITION_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#103444]/80 mb-2">
              Tratamentos
            </p>
            <div className="space-y-1">
              {TREATMENT.map(({ c, icon: Icon }) => {
                const active = currentCondition === c;
                return (
                  <button
                    key={c}
                    onClick={() => onSelect(c)}
                    className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition
                      ${active
                        ? "bg-[#103444]/15 text-[#103444] ring-1 ring-[#c9a24c]/60"
                        : "text-[#103444] hover:bg-[#103444]/10"}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-[#c9a24c]" />
                    {CONDITION_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
