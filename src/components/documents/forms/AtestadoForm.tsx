import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DocumentLetterhead } from "../DocumentLetterhead";
import { DocumentActions } from "../DocumentActions";
import { renderAtestado, type AtestadoData } from "../templates/documentTemplates";
import type { PickerPatient } from "../PatientPicker";

interface Props {
  patient: PickerPatient | null;
  clinic?: { name?: string | null; address?: string | null; logo_url?: string | null };
}

export function AtestadoForm({ patient, clinic }: Props) {
  const [data, setData] = useState<AtestadoData>({
    numero_de_dias: "",
    data_inicio_afastamento: "",
    cid_privado: true,
    campo_cid: "",
  });

  const body = useMemo(
    () => renderAtestado(patient ?? { name: "________" }, data),
    [patient, data],
  );

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-6">
      <div className="space-y-4 bg-white border border-amber-400/30 rounded-xl p-5 shadow-sm h-fit">
        <h3 className="font-semibold text-[#103444]">Dados do afastamento</h3>

        <div className="space-y-2">
          <Label className="text-[#103444]">Número de Dias de Afastamento</Label>
          <Input
            type="number"
            min={1}
            className="border-amber-400/30"
            value={data.numero_de_dias}
            onChange={(e) => setData({ ...data, numero_de_dias: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#103444]">Data de Início</Label>
          <Input
            type="date"
            className="border-amber-400/30"
            value={data.data_inicio_afastamento}
            onChange={(e) => setData({ ...data, data_inicio_afastamento: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-amber-400/30 px-3 py-2">
          <div>
            <Label className="text-[#103444]">Privacidade do CID</Label>
            <p className="text-xs text-muted-foreground">
              Quando ativo, o CID é omitido no atestado.
            </p>
          </div>
          <Switch
            checked={data.cid_privado}
            onCheckedChange={(v) => setData({ ...data, cid_privado: v })}
          />
        </div>

        {!data.cid_privado && (
          <div className="space-y-2">
            <Label className="text-[#103444]">CID / Diagnóstico</Label>
            <Input
              className="border-amber-400/30"
              placeholder="Ex: K02.9"
              value={data.campo_cid ?? ""}
              onChange={(e) => setData({ ...data, campo_cid: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <DocumentLetterhead
          docType="atestado"
          body={body}
          clinicName={clinic?.name}
          clinicAddress={clinic?.address}
          clinicLogoUrl={clinic?.logo_url}
        />
        {patient && (
          <DocumentActions
            docType="atestado"
            body={body}
            payload={data as unknown as Record<string, unknown>}
            patient={patient}
          />
        )}
      </div>
    </div>
  );
}
