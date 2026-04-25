import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentGenerator } from "@/components/documents/DocumentGenerator";

export default function Documentos() {
  const [patientName, setPatientName] = useState("");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-primary">Documentos Clínicos</h1>
          <p className="text-muted-foreground mt-1">
            Gere receituários, atestados, declarações e pedidos de exames em segundos.
          </p>
        </header>

        <div className="bg-card border border-border rounded-xl p-6">
          <Label htmlFor="patient-name" className="text-sm font-medium">
            Nome do paciente
          </Label>
          <Input
            id="patient-name"
            placeholder="Ex: Maria Silva"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="mt-2 max-w-md"
          />
        </div>

        <DocumentGenerator patientName={patientName} />
      </div>
    </AppLayout>
  );
}
