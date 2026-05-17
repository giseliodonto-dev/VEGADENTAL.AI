import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentLetterhead } from "../DocumentLetterhead";
import { DocumentActions } from "../DocumentActions";
import { renderRelatorioOrto, type RelatorioOrtoData } from "../templates/documentTemplates";
import type { PickerPatient } from "../PatientPicker";

interface Props {
  patient: PickerPatient | null;
  clinic?: { name?: string | null; address?: string | null; logo_url?: string | null };
}

export function RelatorioOrtodonticoForm({ patient, clinic }: Props) {
  const [data, setData] = useState<RelatorioOrtoData>({
    diagnostico: "",
    aparelho: "",
    data_inicio: "",
    fase_atual: "",
    nivel_cooperacao: "",
    meses_estimados: "",
  });

  const body = useMemo(
    () => renderRelatorioOrto(patient ?? { name: "________" }, data),
    [patient, data],
  );

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-6">
      <div className="space-y-4 bg-white border border-amber-400/30 rounded-xl p-5 shadow-sm h-fit">
        <h3 className="font-semibold text-[#103444]">Tratamento ortodôntico</h3>

        <div className="space-y-2">
          <Label className="text-[#103444]">Diagnóstico Inicial</Label>
          <Textarea
            className="border-amber-400/30 min-h-[70px]"
            value={data.diagnostico}
            onChange={(e) => setData({ ...data, diagnostico: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#103444]">Aparelho Utilizado</Label>
          <Input
            className="border-amber-400/30"
            value={data.aparelho}
            onChange={(e) => setData({ ...data, aparelho: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#103444]">Data de Início</Label>
          <Input
            type="date"
            className="border-amber-400/30"
            value={data.data_inicio}
            onChange={(e) => setData({ ...data, data_inicio: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#103444]">Fase Clínica Atual</Label>
          <Input
            className="border-amber-400/30"
            value={data.fase_atual}
            onChange={(e) => setData({ ...data, fase_atual: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-[#103444]">Nível de Cooperação</Label>
            <Select
              value={data.nivel_cooperacao}
              onValueChange={(v) =>
                setData({ ...data, nivel_cooperacao: v as RelatorioOrtoData["nivel_cooperacao"] })
              }
            >
              <SelectTrigger className="border-amber-400/30">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Boa">Boa</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Ruim">Ruim</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#103444]">Meses Estimados</Label>
            <Input
              type="number"
              min={1}
              className="border-amber-400/30"
              value={data.meses_estimados}
              onChange={(e) => setData({ ...data, meses_estimados: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <DocumentLetterhead
          docType="relatorio_ortodontico"
          body={body}
          clinicName={clinic?.name}
          clinicAddress={clinic?.address}
          clinicLogoUrl={clinic?.logo_url}
        />
        {patient && (
          <DocumentActions
            docType="relatorio_ortodontico"
            body={body}
            payload={data as unknown as Record<string, unknown>}
            patient={patient}
          />
        )}
      </div>
    </div>
  );
}
