import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentLetterhead } from "../DocumentLetterhead";
import { DocumentActions } from "../DocumentActions";
import { renderComparecimento, type ComparecimentoData } from "../templates/documentTemplates";
import type { PickerPatient } from "../PatientPicker";

interface Props {
  patient: PickerPatient | null;
  clinic?: { name?: string | null; address?: string | null; logo_url?: string | null };
}

export function ComparecimentoForm({ patient, clinic }: Props) {
  const [data, setData] = useState<ComparecimentoData>({
    data_consulta: "",
    hora_inicio: "",
    hora_fim: "",
  });

  const body = useMemo(
    () => renderComparecimento(patient ?? { name: "________" }, data),
    [patient, data],
  );

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-6">
      <div className="space-y-4 bg-white border border-amber-400/30 rounded-xl p-5 shadow-sm h-fit">
        <h3 className="font-semibold text-[#103444]">Dados da consulta</h3>
        <div className="space-y-2">
          <Label className="text-[#103444]">Data da Consulta</Label>
          <Input
            type="date"
            className="border-amber-400/30"
            value={data.data_consulta}
            onChange={(e) => setData({ ...data, data_consulta: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-[#103444]">Horário de Início</Label>
            <Input
              type="time"
              className="border-amber-400/30"
              value={data.hora_inicio}
              onChange={(e) => setData({ ...data, hora_inicio: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#103444]">Horário de Término</Label>
            <Input
              type="time"
              className="border-amber-400/30"
              value={data.hora_fim}
              onChange={(e) => setData({ ...data, hora_fim: e.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Nome, RG e CPF são puxados automaticamente do cadastro do paciente.
        </p>
      </div>

      <div className="space-y-4">
        <DocumentLetterhead
          docType="comparecimento"
          body={body}
          clinicName={clinic?.name}
          clinicAddress={clinic?.address}
          clinicLogoUrl={clinic?.logo_url}
        />
        {patient && (
          <DocumentActions
            docType="comparecimento"
            body={body}
            payload={data as unknown as Record<string, unknown>}
            patient={patient}
          />
        )}
      </div>
    </div>
  );
}
