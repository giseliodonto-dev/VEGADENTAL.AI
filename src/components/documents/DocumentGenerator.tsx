import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Send } from "lucide-react";

const DOC_MODELS: Record<string, string> = {
  RECEITA: "Receituário: [Nome do Paciente]. Uso interno/externo...",
  ATESTADO: "Atestado: Declaro para os devidos fins que [Nome] esteve em consulta...",
  DECLARACAO: "Declaração: Comparecimento do paciente no dia [Data] às [Hora]...",
  RADIOGRAFIA: "Pedido de Exames: Solicito radiografia panorâmica para fins de...",
  RELATORIO: "Relatório Clínico: Paciente apresenta quadro de...",
};

interface DocumentGeneratorProps {
  patientName?: string;
}

export const DocumentGenerator = ({ patientName = "" }: DocumentGeneratorProps) => {
  const [selectedType, setSelectedType] = useState<keyof typeof DOC_MODELS>("RECEITA");
  const [content, setContent] = useState<string>(DOC_MODELS["RECEITA"]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 bg-card border border-gold/30 rounded-xl shadow-sm no-print">
      <h2 className="text-primary font-bold text-xl mb-4">Gerador de Documentos Clínicos</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        {Object.keys(DOC_MODELS).map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? "default" : "outline"}
            onClick={() => {
              setSelectedType(type);
              setContent(DOC_MODELS[type]);
            }}
          >
            {type.replace("_", " ")}
          </Button>
        ))}
      </div>

      <textarea
        className="w-full h-64 p-4 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground font-serif text-lg"
        value={content.replace("[Nome do Paciente]", patientName).replace("[Nome]", patientName)}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex gap-4 mt-6">
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
        </Button>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" /> Enviar via WhatsApp
        </Button>
      </div>
    </div>
  );
};
