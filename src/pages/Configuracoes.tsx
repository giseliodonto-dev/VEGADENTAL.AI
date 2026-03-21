import { AppLayout } from "@/components/AppLayout";
import { Settings } from "lucide-react";

const Configuracoes = () => {
  return (
    <AppLayout title="Configurações">
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Settings className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">Em construção</p>
        <p className="text-xs">Novas ideias em breve</p>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
