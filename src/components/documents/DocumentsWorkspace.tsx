import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { FileText, Stethoscope, ClipboardList, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientPicker, type PickerPatient } from "./PatientPicker";
import { ComparecimentoForm } from "./forms/ComparecimentoForm";
import { AtestadoForm } from "./forms/AtestadoForm";
import { RelatorioOrtodonticoForm } from "./forms/RelatorioOrtodonticoForm";
import { EncaminhamentosFolder } from "./forms/EncaminhamentosFolder";
import type { DocType } from "./templates/documentTemplates";

interface Props {
  patient?: PickerPatient | null;
}

const FOLDERS: { id: DocType; label: string; icon: typeof FileText }[] = [
  { id: "comparecimento", label: "Declaração de Comparecimento", icon: FileText },
  { id: "atestado", label: "Atestado Odontológico", icon: Stethoscope },
  { id: "relatorio_ortodontico", label: "Relatório Ortodôntico", icon: ClipboardList },
  { id: "encaminhamento", label: "Encaminhamentos", icon: Send },
];

export function DocumentsWorkspace({ patient: initialPatient }: Props) {
  const { clinicId } = useClinic();
  const [active, setActive] = useState<DocType>("comparecimento");
  const [patient, setPatient] = useState<PickerPatient | null>(initialPatient ?? null);

  const { data: clinic } = useQuery({
    queryKey: ["clinic-doc", clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinics")
        .select("name, address, logo_url")
        .eq("id", clinicId!)
        .maybeSingle();
      return data;
    },
    enabled: !!clinicId,
  });

  const lockPatient = !!initialPatient;

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      {/* Sidebar */}
      <aside className="bg-white border border-amber-400/30 rounded-xl p-3 h-fit shadow-sm">
        <p className="px-3 pt-2 pb-3 text-xs font-semibold uppercase tracking-wider text-[#103444]/70">
          Pastas
        </p>
        <nav className="space-y-1">
          {FOLDERS.map((f) => {
            const isActive = active === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all",
                  isActive
                    ? "bg-[#103444] text-white shadow-sm border-r-2 border-amber-400"
                    : "text-[#103444] hover:bg-[#103444]/5",
                )}
              >
                <f.icon className="h-4 w-4 shrink-0" />
                <span className="leading-tight">{f.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="space-y-5">
        {!lockPatient && (
          <div className="bg-white border border-amber-400/30 rounded-xl p-5 shadow-sm">
            <PatientPicker value={patient?.id} onChange={setPatient} />
            {patient && (
              <p className="text-xs text-muted-foreground mt-2">
                {patient.cpf && <>CPF {patient.cpf}</>}
                {patient.cpf && patient.rg && " · "}
                {patient.rg && <>RG {patient.rg}</>}
              </p>
            )}
          </div>
        )}

        {!patient && active !== "encaminhamento" && (
          <div className="bg-amber-50/40 border border-amber-400/40 rounded-xl p-6 text-center text-sm text-[#103444]">
            Selecione um paciente para começar a emitir documentos.
          </div>
        )}

        {patient && active === "comparecimento" && (
          <ComparecimentoForm patient={patient} clinic={clinic ?? undefined} />
        )}
        {patient && active === "atestado" && (
          <AtestadoForm patient={patient} clinic={clinic ?? undefined} />
        )}
        {patient && active === "relatorio_ortodontico" && (
          <RelatorioOrtodonticoForm patient={patient} clinic={clinic ?? undefined} />
        )}
        {active === "encaminhamento" && <EncaminhamentosFolder />}
      </div>
    </div>
  );
}
