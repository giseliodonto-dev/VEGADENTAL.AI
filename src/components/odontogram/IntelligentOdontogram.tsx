import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ToothSVG } from "./ToothSVG";
import { ToothActionMenu } from "./ToothActionMenu";
import {
  UPPER_TEETH, LOWER_TEETH_VISUAL,
  Face, StatusType, Condition, Combo,
  CONDITION_LABELS, CONDITION_FILL,
} from "./odontogramConfig";
import { useOdontogramMarks, useToggleMark, useApplyCombo, OdontogramMark } from "./useOdontogram";

type Props = { patientId: string; clinicId: string | null; };

function Arch({
  teeth, isUpper, marksByTooth, onClickFace,
}: {
  teeth: number[];
  isUpper: boolean;
  marksByTooth: Record<string, Partial<Record<Face, Condition>>>;
  onClickFace: (toothNumber: number, face: Face, e: React.MouseEvent<SVGPathElement>) => void;
}) {
  return (
    <div className="flex justify-center gap-1 flex-wrap">
      {teeth.map((n) => (
        <ToothSVG
          key={n}
          toothNumber={n}
          isUpper={isUpper}
          facesByCondition={marksByTooth[String(n)] || {}}
          onFaceClick={(face, e) => onClickFace(n, face, e)}
        />
      ))}
    </div>
  );
}

function Legend({ statusType }: { statusType: StatusType }) {
  const items: Condition[] = statusType === "inicial"
    ? ["carie", "fratura", "pulpite_necrose", "ausente", "destruicao_coronaria"]
    : ["restauracao_direta_1face", "canal_unirradicular", "implante_unitario_cirurgia", "coroa_ceramica"];
  return (
    <div className="flex flex-wrap gap-3 pt-3 border-t border-[#103444]/10 mt-4">
      {items.map((c) => (
        <div key={c} className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded border border-[#103444]/20"
            style={{ background: CONDITION_FILL[c] }}
          />
          <span className="text-[11px] text-[#103444]/80">{CONDITION_LABELS[c]}</span>
        </div>
      ))}
    </div>
  );
}

function ArchView({ patientId, clinicId, statusType }: Props & { statusType: StatusType }) {
  const { data: marks = [], isLoading } = useOdontogramMarks(patientId, statusType);
  const toggle = useToggleMark(patientId, clinicId);
  const applyCombo = useApplyCombo(patientId, clinicId);

  const [menu, setMenu] = useState<{
    open: boolean;
    anchor: { x: number; y: number } | null;
    toothNumber: number;
    face: Face;
    currentCondition: Condition | null;
    existingId: string | null;
  } | null>(null);

  const marksByTooth = useMemo(() => {
    const map: Record<string, Partial<Record<Face, Condition>>> = {};
    const idMap: Record<string, Partial<Record<Face, OdontogramMark>>> = {};
    marks.forEach((m) => {
      map[m.tooth_number] = { ...(map[m.tooth_number] || {}), [m.face]: m.condition };
      idMap[m.tooth_number] = { ...(idMap[m.tooth_number] || {}), [m.face]: m };
    });
    return { map, idMap };
  }, [marks]);

  const handleClickFace = (toothNumber: number, face: Face, e: React.MouseEvent<SVGPathElement>) => {
    const rect = (e.target as SVGElement).getBoundingClientRect();
    const tooth = String(toothNumber);
    const existing = marksByTooth.idMap[tooth]?.[face] || null;
    setMenu({
      open: true,
      anchor: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      toothNumber,
      face,
      currentCondition: existing?.condition || null,
      existingId: existing?.id || null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 py-2">
        <Arch teeth={UPPER_TEETH} isUpper={true} marksByTooth={marksByTooth.map} onClickFace={handleClickFace} />
        <div className="border-t border-dashed border-[#103444]/20 mx-8" />
        <Arch teeth={LOWER_TEETH_VISUAL} isUpper={false} marksByTooth={marksByTooth.map} onClickFace={handleClickFace} />
      </div>

      {isLoading && <p className="text-xs text-[#103444]/50 text-center">Carregando marcas…</p>}

      <Legend statusType={statusType} />

      {menu && (
        <ToothActionMenu
          open={menu.open}
          onOpenChange={(o) => setMenu((m) => (m ? { ...m, open: o } : null))}
          anchor={menu.anchor}
          statusType={statusType}
          toothNumber={menu.toothNumber}
          face={menu.face}
          currentCondition={menu.currentCondition}
          onSelect={(c) => {
            if (c === "arcada_ausente_total") {
              const isUpper = menu.toothNumber >= 11 && menu.toothNumber <= 28;
              const ok = window.confirm(
                `Aplicar Protocolo Fixo ${isUpper ? "Superior" : "Inferior"} em toda a arcada?`,
              );
              if (ok) {
                applyCombo.mutate({
                  combo: "protocolo_arcada",
                  tooth_number: String(menu.toothNumber),
                  status_type: statusType,
                  arcadaScope: isUpper ? "superior" : "inferior",
                });
              }
            } else {
              toggle.mutate({
                tooth_number: String(menu.toothNumber),
                face: menu.face,
                status_type: statusType,
                condition: c,
                existingId: menu.existingId,
                existingCondition: menu.currentCondition,
              });
            }
            setMenu((m) => (m ? { ...m, open: false } : null));
          }}
          onSelectCombo={(combo) => {
            applyCombo.mutate({
              combo,
              tooth_number: String(menu.toothNumber),
              status_type: statusType,
            });
            setMenu((m) => (m ? { ...m, open: false } : null));
          }}
        />
      )}
    </div>
  );
}

export function IntelligentOdontogram({ patientId, clinicId }: Props) {
  return (
    <Card className="bg-white border-amber-400/30">
      <CardContent className="p-6">
        <Tabs defaultValue="inicial">
          <TabsList className="bg-[#103444]/5 border border-[#103444]/10 h-auto p-1">
            <TabsTrigger
              value="inicial"
              className="data-[state=active]:bg-[#103444] data-[state=active]:text-white text-xs px-4"
            >
              Odontograma Clínico
            </TabsTrigger>
            <TabsTrigger
              value="final"
              className="data-[state=active]:bg-[#103444] data-[state=active]:text-white text-xs px-4"
            >
              Planejamento Estético
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inicial" className="mt-4">
            <p className="text-xs text-[#103444]/60 mb-3">
              Marque o estado em que o paciente chegou. Cada diagnóstico gera automaticamente
              uma linha no Plano de Tratamento.
            </p>
            <ArchView patientId={patientId} clinicId={clinicId} statusType="inicial" />
          </TabsContent>

          <TabsContent value="final" className="mt-4">
            <p className="text-xs text-[#103444]/60 mb-3">
              Marque os procedimentos concluídos. O Plano de Tratamento correspondente
              passa para "Executado" automaticamente.
            </p>
            <ArchView patientId={patientId} clinicId={clinicId} statusType="final" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
