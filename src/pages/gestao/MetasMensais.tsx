import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Target, ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const MetasMensais = () => {
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(startOfMonth(new Date()));
  const monthKey = format(selectedDate, "yyyy-MM-dd");

  const { data: goal, isLoading } = useQuery({
    queryKey: ["goal", clinicId, monthKey],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("clinic_id", clinicId!)
        .eq("month", monthKey)
        .maybeSingle();
      return data;
    },
  });

  const [revenueGoal, setRevenueGoal] = useState("");
  const [profitGoal, setProfitGoal] = useState("");
  const [conversionGoal, setConversionGoal] = useState("");

  // Sync form with loaded data
  const formRevenue = revenueGoal || String(goal?.revenue_goal ?? "");
  const formProfit = profitGoal || String(goal?.profit_goal ?? "");
  const formConversion = conversionGoal || String(goal?.conversion_goal ?? "");

  const resetForm = () => {
    setRevenueGoal("");
    setProfitGoal("");
    setConversionGoal("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clinic_id: clinicId!,
        month: monthKey,
        revenue_goal: Number(formRevenue) || 0,
        profit_goal: Number(formProfit) || 0,
        conversion_goal: Number(formConversion) || 0,
      };

      if (goal?.id) {
        const { error } = await supabase
          .from("goals")
          .update(payload)
          .eq("id", goal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Metas salvas com sucesso!");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["goal", clinicId, monthKey] });
      queryClient.invalidateQueries({ queryKey: ["gps-goal"] });
    },
    onError: () => toast.error("Erro ao salvar metas"),
  });

  const navigateMonth = (dir: number) => {
    setSelectedDate((prev) => (dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1)));
    resetForm();
  };

  const monthLabel = format(selectedDate, "MMMM yyyy", { locale: ptBR });

  return (
    <AppLayout title="Metas Mensais" subtitle="Defina e acompanhe suas metas">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Month selector */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-lg font-semibold font-display capitalize min-w-[180px] text-center">
            {monthLabel}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-gestao" />
                Metas de {monthLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="revenue">Meta de Faturamento (R$)</Label>
                <Input
                  id="revenue"
                  type="number"
                  placeholder="Ex: 80000"
                  value={formRevenue}
                  onChange={(e) => setRevenueGoal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profit">Meta de Lucro (R$)</Label>
                <Input
                  id="profit"
                  type="number"
                  placeholder="Ex: 30000"
                  value={formProfit}
                  onChange={(e) => setProfitGoal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conversion">Meta de Conversão (%)</Label>
                <Input
                  id="conversion"
                  type="number"
                  placeholder="Ex: 40"
                  value={formConversion}
                  onChange={(e) => setConversionGoal(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {goal?.id ? "Atualizar Metas" : "Salvar Metas"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default MetasMensais;
