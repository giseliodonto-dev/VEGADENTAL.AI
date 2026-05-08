import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "./useClinic";

export function useSidebarCounters() {
  const { clinicId } = useClinic();

  const today = new Date().toISOString().slice(0, 10);

  const agenda = useQuery({
    queryKey: ["sidebar-counter-agenda", clinicId, today],
    enabled: !!clinicId,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .eq("date", today)
        .eq("status", "confirmado");
      return count ?? 0;
    },
  });

  const vendas = useQuery({
    queryKey: ["sidebar-counter-vendas", clinicId],
    enabled: !!clinicId,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .eq("status", "novo");
      return count ?? 0;
    },
  });

  // GPS alerts: derive from leads stuck > 7 days as a lightweight proxy.
  const gps = useQuery({
    queryKey: ["sidebar-counter-gps", clinicId],
    enabled: !!clinicId,
    staleTime: 60_000,
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .in("status", ["novo", "contatado"])
        .lt("updated_at", cutoff.toISOString());
      return count ?? 0;
    },
  });

  return {
    agenda: agenda.data ?? 0,
    vendas: vendas.data ?? 0,
    gpsAlerts: gps.data ?? 0,
  };
}
