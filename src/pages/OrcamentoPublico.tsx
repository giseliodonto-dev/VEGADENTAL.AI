import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, MessageCircle, Printer } from "lucide-react";
import { format } from "date-fns";
import { generateTreatmentPlanPdf } from "@/utils/treatmentPlanPdf";
import { buildPaymentOptions, selectedPaymentKey } from "@/utils/paymentOptions";
import { openWhatsApp } from "@/lib/whatsapp";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const statusLabels: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 border-amber-300" },
  enviado: { label: "Enviado", color: "bg-blue-100 text-blue-800 border-blue-300" },
  aceito: { label: "Aceito", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  recusado: { label: "Recusado", color: "bg-red-100 text-red-800 border-red-300" },
  expirado: { label: "Expirado", color: "bg-muted text-muted-foreground" },
};

const brl = (n: number) => `R$ ${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function OrcamentoPublico() {
  const { token } = useParams<{ token: string }>();

  const tokenClient = useMemo(() => {
    if (!token) return null;
    return createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { "x-orcamento-token": token } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }, [token]);

  const { data: budget, isLoading } = useQuery({
    queryKey: ["public-budget", token],
    queryFn: async () => {
      if (!tokenClient) return null;
      const { data, error } = await (tokenClient as any).from("budgets").select("*").eq("public_token", token!).maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!token && !!tokenClient,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["public-budget-items", budget?.id],
    queryFn: async () => {
      if (!tokenClient) return [];
      const { data, error } = await (tokenClient as any).from("budget_items").select("*").eq("budget_id", budget.id);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!budget?.id && !!tokenClient,
  });

  const { data: clinic } = useQuery({
    queryKey: ["public-clinic", budget?.clinic_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("name, phone, email, address, responsible_name, responsible_cro, logo_url")
        .eq("id", budget.clinic_id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!budget?.clinic_id,
  });

  const { data: patient } = useQuery({
    queryKey: ["public-patient", budget?.patient_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("name, cpf, rg, phone")

        .eq("id", budget.patient_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!budget?.patient_id,
  });

  const handleDownloadPdf = async () => {
    if (!budget || !clinic || !patient) return;
    const doc = await generateTreatmentPlanPdf({
      clinic,
      patient,
      items: items as any,
      totalValue: Number(budget.total_value),
      discount: Number(budget.discount || 0),
      finalValue: Number(budget.final_value),
      paymentMethod: budget.notes?.replace(/^Forma de pagamento:\s*/i, "") || null,
      validUntil: budget.valid_until ? format(new Date(budget.valid_until), "dd/MM/yyyy") : null,
      createdAt: format(new Date(budget.created_at), "dd/MM/yyyy"),
    });
    doc.save(`plano-tratamento-${patient.name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const handleWhatsApp = () => {
    const message = `Olá ${patient?.name?.split(" ")[0] || ""}, segue seu plano de tratamento da ${clinic?.name || "clínica"}:\n\n${window.location.href}\n\nValor: ${brl(budget.final_value)}`;
    openWhatsApp(patient?.phone, message);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!budget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Plano de tratamento não encontrado</h2>
            <p className="text-sm text-muted-foreground mt-2">Este link pode estar expirado ou inválido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const st = statusLabels[budget.status] || statusLabels.pendente;
  const clinicInitials = (clinic?.name || "C").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();
  const paymentOptions = buildPaymentOptions(Number(budget.final_value));
  const chosen = selectedPaymentKey(budget.notes);

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Barra de ações — oculta na impressão */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-amber-400/30 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">Plano de Tratamento</span>
          <div className="flex gap-2 ml-auto">
            <Button onClick={handleDownloadPdf} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
              <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Baixar PDF</span>
            </Button>
            <Button onClick={handleWhatsApp} size="sm" variant="outline" className="border-amber-400/50 gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">WhatsApp</span>
            </Button>
            <Button onClick={() => window.print()} size="sm" variant="ghost" className="gap-1.5">
              <Printer className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Imprimir</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 print:py-2">
        <Card className="border-amber-400/30 shadow-sm print:shadow-none print:border-0">
          <CardContent className="p-8 sm:p-12 print:p-6 font-serif">
            {/* ===== Cabeçalho ===== */}
            <header className="text-center pb-6 border-b border-amber-400/40">
              {clinic?.logo_url ? (
                <img src={clinic.logo_url} alt={clinic.name} className="h-16 mx-auto mb-3 object-contain" />
              ) : (
                <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-600 font-bold text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {clinicInitials}
                </div>
              )}
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#103444" }}>
                {clinic?.name || "Clínica"}
              </h1>
              {(clinic?.responsible_name || clinic?.responsible_cro) && (
                <p className="text-sm italic text-slate-600 mt-1">
                  {[clinic?.responsible_name, clinic?.responsible_cro].filter(Boolean).join(" | ")}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {[clinic?.address, clinic?.phone, clinic?.email].filter(Boolean).join(" • ")}
              </p>
            </header>

            {/* ===== Título ===== */}
            <div className="text-center mt-8 mb-6">
              <h2 className="text-base sm:text-lg font-bold tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#103444" }}>
                PLANO DE TRATAMENTO E ORÇAMENTO
              </h2>
              <div className="w-20 h-px bg-amber-500 mx-auto mt-2" />
              <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
                <span>Emitido em {format(new Date(budget.created_at), "dd/MM/yyyy")}</span>
                {budget.valid_until && <span>• Válido até {format(new Date(budget.valid_until), "dd/MM/yyyy")}</span>}
                <Badge variant="outline" className={`${st.color} text-[10px] print:hidden`}>{st.label}</Badge>
              </div>
            </div>

            {/* ===== Paciente ===== */}
            <div className="border border-amber-400/40 rounded-lg p-4 bg-amber-50/30 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">Paciente</p>
                <p className="font-semibold text-base" style={{ color: "#103444" }}>{patient?.name || "—"}</p>
                <p className="text-xs text-slate-600">
                  {[patient?.cpf && `CPF: ${patient.cpf}`, patient?.phone].filter(Boolean).join("  •  ")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Emissão: {format(new Date(budget.created_at), "dd/MM/yyyy")}
              </p>
            </div>

            {/* ===== Procedimentos ===== */}
            <section className="mt-8">
              <h3 className="text-sm font-bold tracking-wide mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#103444" }}>
                PROCEDIMENTOS PLANEJADOS
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                  <div className="col-span-5">Procedimento</div>
                  <div className="col-span-2">Dente</div>
                  <div className="col-span-2">Região</div>
                  <div className="col-span-3 text-right">Valor</div>
                </div>
                {items.map((item: any) => (
                  <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-2 text-sm border-t border-slate-100">
                    <div className="col-span-5 text-slate-800">{item.procedure_name}</div>
                    <div className="col-span-2 text-slate-500">{item.tooth_number || "—"}</div>
                    <div className="col-span-2 text-slate-500">{item.region || "—"}</div>
                    <div className="col-span-3 text-right text-slate-800 font-medium">{brl(item.value)}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ===== Valores ===== */}
            <section className="mt-8">
              <div className="border border-amber-400/30 rounded-lg p-5 bg-gradient-to-br from-white to-amber-50/40">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{brl(budget.total_value)}</span>
                  </div>
                  {Number(budget.discount) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Desconto</span>
                      <span>- {brl(budget.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-amber-400/40">
                    <span className="text-xs uppercase tracking-wider text-amber-700 font-semibold">Valor Total</span>
                    <span className="text-2xl font-bold" style={{ color: "#103444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {brl(budget.final_value)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== Formas de pagamento ===== */}
            <section className="mt-8">
              <h3 className="text-sm font-bold tracking-wide mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#103444" }}>
                FORMAS DE PAGAMENTO
              </h3>
              <div className="border border-amber-400/30 rounded-lg divide-y divide-amber-400/20 overflow-hidden">
                {paymentOptions.map((opt) => {
                  const isChosen = chosen === opt.key;
                  return (
                    <div
                      key={opt.key}
                      className={`px-5 py-3 flex items-baseline justify-between gap-4 ${isChosen ? "bg-amber-50/70" : "bg-white"}`}
                    >
                      <div>
                        <p className={`text-sm ${isChosen ? "font-bold" : "font-medium"}`} style={{ color: "#103444" }}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {opt.detail}
                          {isChosen && <span className="text-amber-700 font-medium"> · condição escolhida</span>}
                        </p>
                      </div>
                      <span className="text-sm font-bold whitespace-nowrap" style={{ color: "#103444" }}>{opt.highlight}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ===== Assinaturas ===== */}
            <section className="mt-14 grid md:grid-cols-2 gap-10">
              <div className="text-center">
                <div className="border-t border-slate-400 pt-2" />
                <p className="text-xs text-slate-600 mt-1">Assinatura do Paciente</p>
                <p className="text-[11px] text-muted-foreground">{patient?.name}</p>
              </div>
              <div className="text-center">
                <div className="border-t border-slate-400 pt-2" />
                <p className="text-xs text-slate-600 mt-1">Assinatura da Profissional</p>
                <p className="text-[11px] text-muted-foreground">
                  {[clinic?.responsible_name || clinic?.name, clinic?.responsible_cro].filter(Boolean).join(" | ")}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}
