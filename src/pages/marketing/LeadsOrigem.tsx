import { AppLayout } from "@/components/AppLayout";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Trophy, TrendingUp, Users } from "lucide-react";

const originLabels: Record<string, string> = {
  instagram: "Instagram",
  google: "Google",
  indicacao: "Indicação",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  site: "Site",
  outros: "Outros",
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#6b7280"];

const LeadsOrigem = () => {
  const { clinicId } = useClinic();

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-origin", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase.from("patients").select("id, origin, treatment_value").eq("clinic_id", clinicId);
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-origin", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase.from("leads").select("id, origin").eq("clinic_id", clinicId);
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId,
  });

  // Aggregate by origin
  const originMap = new Map<string, { leads: number; patients: number; revenue: number }>();
  
  leads.forEach((l) => {
    const key = l.origin || "outros";
    const entry = originMap.get(key) || { leads: 0, patients: 0, revenue: 0 };
    entry.leads++;
    originMap.set(key, entry);
  });

  patients.forEach((p) => {
    const key = p.origin || "outros";
    const entry = originMap.get(key) || { leads: 0, patients: 0, revenue: 0 };
    entry.patients++;
    entry.revenue += Number(p.treatment_value || 0);
    originMap.set(key, entry);
  });

  const chartData = Array.from(originMap.entries())
    .map(([origin, data]) => ({
      origin: originLabels[origin] || origin,
      leads: data.leads,
      pacientes: data.patients,
      faturamento: data.revenue,
    }))
    .sort((a, b) => (b.leads + b.pacientes) - (a.leads + a.pacientes));

  const totalLeads = chartData.reduce((s, d) => s + d.leads, 0);
  const totalPatients = chartData.reduce((s, d) => s + d.pacientes, 0);
  const totalRevenue = chartData.reduce((s, d) => s + d.faturamento, 0);
  const bestOrigin = chartData[0];

  return (
    <AppLayout title="Leads por Origem" subtitle="De onde vêm seus pacientes">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Leads</p>
                  <p className="text-2xl font-bold">{totalLeads + totalPatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Faturamento Total</p>
                  <p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString("pt-BR")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Melhor Origem</p>
                  <p className="text-2xl font-bold">{bestOrigin?.origin || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Leads e Pacientes por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="origin" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pacientes" name="Pacientes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado disponível ainda.</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue by origin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Faturamento por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.filter((d) => d.faturamento > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.filter((d) => d.faturamento > 0)}
                    dataKey="faturamento"
                    nameKey="origin"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ origin, percent }) => `${origin} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.filter((d) => d.faturamento > 0).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum faturamento registrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Ranking Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ranking de Origens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chartData.map((d, i) => (
                <div key={d.origin} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{d.origin}</p>
                      <p className="text-xs text-muted-foreground">{d.leads} leads · {d.pacientes} pacientes</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">R$ {d.faturamento.toLocaleString("pt-BR")}</p>
                </div>
              ))}
              {chartData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Cadastre pacientes e leads para ver as origens.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default LeadsOrigem;
