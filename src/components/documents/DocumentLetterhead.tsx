import { SIGNATURE_LINES, cidadeData } from "./templates/signatureFooter";
import { DOC_TITLES, type DocType } from "./templates/documentTemplates";

interface Props {
  docType: DocType;
  body: string;
  clinicName?: string | null;
  clinicAddress?: string | null;
  clinicLogoUrl?: string | null;
}

export function DocumentLetterhead({ docType, body, clinicName, clinicAddress, clinicLogoUrl }: Props) {
  return (
    <div className="bg-white border border-amber-400/20 rounded-xl shadow-md p-10 lg:p-12 font-serif text-[#1a1a1a]">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-6 pb-4 border-b border-amber-400/40">
        {clinicLogoUrl ? (
          <img src={clinicLogoUrl} alt="Logo" className="h-14 w-14 object-contain" />
        ) : (
          <div className="h-14 w-14" />
        )}
        <div className="text-right">
          <div className="text-[#103444] font-bold text-base font-sans">
            {clinicName || "Clínica"}
          </div>
          {clinicAddress && (
            <div className="text-xs text-muted-foreground font-sans mt-1">{clinicAddress}</div>
          )}
        </div>
      </div>

      {/* Título */}
      <h2 className="text-center text-[#103444] font-bold uppercase tracking-wide text-lg mt-8 mb-6 font-sans">
        {DOC_TITLES[docType]}
      </h2>

      {/* Corpo */}
      <div className="whitespace-pre-line text-justify leading-relaxed text-[15px]">
        {body}
      </div>

      {/* Data */}
      <p className="text-right mt-10">{cidadeData()}</p>

      {/* Assinatura */}
      <div className="mt-16 text-center">
        <div className="mx-auto w-72 border-t border-slate-400" />
        <div className="mt-2 font-bold text-[#103444] font-sans text-sm">
          {SIGNATURE_LINES.dentist}
        </div>
        <div className="text-xs text-muted-foreground font-sans">{SIGNATURE_LINES.role}</div>
      </div>

      {/* Rodapé institucional */}
      <div className="mt-12 pt-4 border-t border-amber-400/30 text-center text-xs italic text-muted-foreground font-sans">
        {SIGNATURE_LINES.units}
      </div>
    </div>
  );
}
