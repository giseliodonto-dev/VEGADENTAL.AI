import { AppLayout } from "@/components/AppLayout";
import { CalendarDays } from "lucide-react";

const Agenda = () => {
  return (
    <AppLayout title="Agenda">
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <CalendarDays className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">Em construção</p>
        <p className="text-xs">Novas ideias em breve</p>
      </div>
    </AppLayout>
  );
};

export default Agenda;
