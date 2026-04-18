import { Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useClinic } from "@/hooks/useClinic";
import { Loader2, Lock } from "lucide-react";
import { AppLayout } from "./AppLayout";
import { Card, CardContent } from "./ui/card";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Props {
  children: React.ReactNode;
  allowedRoles: AppRole[];
}

function RoleGate({ children, allowedRoles }: Props) {
  const { role, loading } = useClinic();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <AppLayout title="Acesso restrito">
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="p-8 text-center space-y-3">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">Área restrita</h2>
            <p className="text-sm text-muted-foreground">
              Esta seção é exclusiva para o Dono da clínica e administradores.
              Solicite acesso ao responsável da sua clínica.
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return <>{children}</>;
}

export function RoleProtectedRoute({ children, allowedRoles }: Props) {
  return (
    <ProtectedRoute>
      <RoleGate allowedRoles={allowedRoles}>{children}</RoleGate>
    </ProtectedRoute>
  );
}
