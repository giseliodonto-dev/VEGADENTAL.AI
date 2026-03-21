import { AppLayout } from "@/components/AppLayout";
import { LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  return (
    <AppLayout title="Dashboard">
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <LayoutDashboard className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">Em construção</p>
        <p className="text-xs">Novas ideias em breve</p>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
