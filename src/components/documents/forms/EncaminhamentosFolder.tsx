import { Send } from "lucide-react";

export function EncaminhamentosFolder() {
  return (
    <div className="bg-white border border-amber-400/30 rounded-xl p-12 text-center shadow-sm">
      <div className="mx-auto h-14 w-14 rounded-full bg-[#103444]/5 flex items-center justify-center mb-4">
        <Send className="h-6 w-6 text-[#103444]" />
      </div>
      <h3 className="font-semibold text-[#103444] text-lg">Encaminhamentos</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        Pasta criada para organizar encaminhamentos a especialistas. O formulário completo
        será habilitado em breve — todo histórico ficará vinculado ao paciente.
      </p>
    </div>
  );
}
