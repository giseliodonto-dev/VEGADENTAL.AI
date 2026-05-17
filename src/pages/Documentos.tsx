import { AppLayout } from "@/components/AppLayout";
import { DocumentsWorkspace } from "@/components/documents/DocumentsWorkspace";

export default function Documentos() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-[#103444]">Documentos Clínicos</h1>
          <p className="text-muted-foreground mt-1">
            Emita declarações, atestados e relatórios com preview em tempo real e arquivo seguro no
            prontuário do paciente.
          </p>
        </header>

        <DocumentsWorkspace />
      </div>
    </AppLayout>
  );
}
