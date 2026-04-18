import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  enviado: { label: "Aguardando aprovação", color: "bg-blue-100 text-blue-800" },
  aceito: { label: "Aceito", color: "bg-green-100 text-green-800" },
  recusado: { label: "Recusado", color: "bg-red-100 text-red-800" },
  expirado: { label: "Expirado", color: "bg-muted text-muted-foreground" },
};

export default function OrcamentoPublico() {
  const { token } = useParams<{ token: string }>();
  const [signature, setSignature] = useState("");

  const { data: budget, isLoading, refetch } = useQuery({
    queryKey: ["public-budget", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets" as any)
        .select("*")
        .eq("public_token", token!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!token,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["public-budget-items", budget?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_items" as any)
        .select("*")
        .eq("budget_id", budget.id);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!budget?.id,
  });

  const { data: clinic } = useQuery({
    queryKey: ["public-clinic", budget?.clinic_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("name, phone, email, address")
        .eq("id", budget.clinic_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!budget?.clinic_id,
  });

  const { data: patient } = useQuery({
    queryKey: ["public-patient", budget?.patient_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("name, cpf, rg, phone, email, street, number, neighborhood, city, state, postal_code")
        .eq("id", budget.patient_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!budget?.patient_id,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!signature.trim()) throw new Error("Digite seu nome completo");
      const { error } = await supabase
        .from("budgets" as any)
        .update({
          status: "aceito",
          accepted_signature: signature.trim(),
          accepted_at: new Date().toISOString(),
        } as any)
        .eq("id", budget.id);
      if (error) throw error;

      // Update linked treatments to "aprovado"
      const treatmentIds = items.filter((i: any) => i.treatment_id).map((i: any) => i.treatment_id);
      if (treatmentIds.length > 0) {
        await supabase
          .from("treatments" as any)
          .update({ status: "aprovado" } as any)
          .in("id", treatmentIds);
      }
    },
    onSuccess: () => {
      toast.success("Orçamento aceito com sucesso!");
      refetch();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao aceitar"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Orçamento não encontrado</h2>
            <p className="text-sm text-muted-foreground mt-2">Este link pode estar expirado ou inválido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const st = statusLabels[budget.status] || statusLabels.pendente;
  const isAcceptable = budget.status === "pendente" || budget.status === "enviado";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Clinic header */}
        <div className="text-center space-y-1 border-b pb-6">
          <h1 className="text-2xl font-bold text-foreground">{clinic?.name || "Clínica"}</h1>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {clinic?.address && <p>{clinic.address}</p>}
            <p>
              {[clinic?.phone, clinic?.email].filter(Boolean).join(" • ")}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Budget header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Plano de Tratamento Odontológico</h2>
                <p className="text-xs text-muted-foreground">
                  Emitido em: {format(new Date(budget.created_at), "dd/MM/yyyy")}
                  {budget.valid_until && ` • Válido até: ${format(new Date(budget.valid_until), "dd/MM/yyyy")}`}
                </p>
              </div>
              <Badge className={st.color}>{st.label}</Badge>
            </div>

            {/* Parties — Contratante / Contratada */}
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="border rounded-lg p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Contratada (Clínica)</p>
                <p className="font-medium text-foreground">{clinic?.name || "—"}</p>
                {clinic?.address && <p className="text-xs text-muted-foreground">{clinic.address}</p>}
                {clinic?.phone && <p className="text-xs text-muted-foreground">Tel: {clinic.phone}</p>}
                {clinic?.email && <p className="text-xs text-muted-foreground">{clinic.email}</p>}
              </div>
              <div className="border rounded-lg p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Contratante (Paciente)</p>
                <p className="font-medium text-foreground">{patient?.name || "—"}</p>
                {patient?.cpf && <p className="text-xs text-muted-foreground">CPF: {patient.cpf}</p>}
                {patient?.rg && <p className="text-xs text-muted-foreground">RG: {patient.rg}</p>}
                {patient?.phone && <p className="text-xs text-muted-foreground">Tel: {patient.phone}</p>}
                {patient?.email && <p className="text-xs text-muted-foreground">{patient.email}</p>}
                {(patient?.street || patient?.city) && (
                  <p className="text-xs text-muted-foreground">
                    {[patient.street, patient.number, patient.neighborhood, patient.city, patient.state, patient.postal_code].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground">
                <div className="col-span-5">Procedimento</div>
                <div className="col-span-2">Dente</div>
                <div className="col-span-2">Região</div>
                <div className="col-span-3 text-right">Valor</div>
              </div>
              {items.map((item: any) => (
                <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-2 text-sm border-t">
                  <div className="col-span-5 text-foreground">{item.procedure_name}</div>
                  <div className="col-span-2 text-muted-foreground">{item.tooth_number || "—"}</div>
                  <div className="col-span-2 text-muted-foreground">{item.region || "—"}</div>
                  <div className="col-span-3 text-right text-foreground">
                    R$ {Number(item.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">R$ {Number(budget.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              {Number(budget.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="text-red-600">- R$ {Number(budget.discount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">R$ {Number(budget.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {budget.notes && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                <p className="text-sm text-foreground">{budget.notes}</p>
              </div>
            )}

            {/* Acceptance */}
            {budget.status === "aceito" ? (
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                <p className="font-semibold text-green-800 dark:text-green-200">Orçamento Aceito</p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Assinado por: {budget.accepted_signature}
                  {budget.accepted_at && ` em ${format(new Date(budget.accepted_at), "dd/MM/yyyy 'às' HH:mm")}`}
                </p>
              </div>
            ) : isAcceptable ? (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-foreground">Aceitar Orçamento</h3>
                <p className="text-sm text-muted-foreground">
                  Digite seu nome completo como assinatura digital para aceitar este orçamento.
                </p>
                <Input
                  placeholder="Nome completo"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="text-lg font-medium"
                />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || !signature.trim()}
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Aceitar Orçamento
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
