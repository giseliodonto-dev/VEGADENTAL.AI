import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2, FileText, Download, MessageCircle, Printer } from "lucide-react";
import { format } from "date-fns";
import { generateContractPdf } from "@/utils/contractPdf";

const statusLabels: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 border-amber-300" },
  enviado: { label: "Aguardando Aceite", color: "bg-blue-100 text-blue-800 border-blue-300" },
  aceito: { label: "Aceito", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  recusado: { label: "Recusado", color: "bg-red-100 text-red-800 border-red-300" },
  expirado: { label: "Expirado", color: "bg-muted text-muted-foreground" },
};

export default function OrcamentoPublico() {
  const { token } = useParams<{ token: string }>();
  const [signature, setSignature] = useState("");

  const { data: budget, isLoading, refetch } = useQuery({
    queryKey: ["public-budget", token],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets" as any).select("*").eq("public_token", token!).maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!token,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["public-budget-items", budget?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("budget_items" as any).select("*").eq("budget_id", budget.id);
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
        .select("name, phone, email, address, responsible_name, responsible_cro, logo_url, cancellation_fee")
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
        .update({ status: "aceito", accepted_signature: signature.trim(), accepted_at: new Date().toISOString() } as any)
        .eq("id", budget.id);
      if (error) throw error;
      const treatmentIds = items.filter((i: any) => i.treatment_id).map((i: any) => i.treatment_id);
      if (treatmentIds.length > 0) {
        await supabase.from("treatments" as any).update({ status: "em_andamento" } as any).in("id", treatmentIds);
      }
    },
    onSuccess: () => { toast.success("Plano de tratamento aceito!"); refetch(); },
    onError: (e: any) => toast.error(e.message || "Erro ao aceitar"),
  });

  const handleDownloadPdf = () => {
    if (!budget || !clinic || !patient) return;
    const paymentMethod = budget.notes?.replace(/^Forma de pagamento:\s*/i, "") || null;
    const doc = generateContractPdf({
      clinic,
      patient,
      items: items as any,
      totalValue: Number(budget.total_value),
      discount: Number(budget.discount || 0),
      finalValue: Number(budget.final_value),
      paymentMethod,
      validUntil: budget.valid_until ? format(new Date(budget.valid_until), "dd/MM/yyyy") : null,
      createdAt: format(new Date(budget.created_at), "dd/MM/yyyy"),
      acceptedSignature: budget.accepted_signature,
      acceptedAt: budget.accepted_at ? format(new Date(budget.accepted_at), "dd/MM/yyyy 'às' HH:mm") : null,
    });
    doc.save(`contrato-${patient.name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const handleWhatsApp = () => {
    if (!patient?.phone) { toast.error("Paciente sem telefone cadastrado"); return; }
    const phone = patient.phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá ${patient.name.split(" ")[0]}, segue seu plano de tratamento da ${clinic?.name || "clínica"}:\n\n${window.location.href}\n\nValor: R$ ${Number(budget.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    );
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
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
            <h2 className="text-lg font-semibold">Contrato não encontrado</h2>
            <p className="text-sm text-muted-foreground mt-2">Este link pode estar expirado ou inválido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const st = statusLabels[budget.status] || statusLabels.pendente;
  const isAcceptable = budget.status === "pendente" || budget.status === "enviado";
  const paymentMethodLabel = budget.notes?.replace(/^Forma de pagamento:\s*/i, "") || "—";
  const clinicInitials = (clinic?.name || "C").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Sticky action bar - hidden on print */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-amber-400/30 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">Contrato de Tratamento</span>
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
            {/* ===== Official Header ===== */}
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
                  {clinic?.responsible_name}
                  {clinic?.responsible_name && clinic?.responsible_cro && " — "}
                  {clinic?.responsible_cro}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {[clinic?.address, clinic?.phone, clinic?.email].filter(Boolean).join(" • ")}
              </p>
            </header>

            {/* ===== Title ===== */}
            <div className="text-center mt-8 mb-6">
              <h2 className="text-base sm:text-lg font-bold tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#103444" }}>
                CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS
              </h2>
              <div className="w-20 h-px bg-amber-500 mx-auto mt-2" />
              <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
                <span>Emitido em {format(new Date(budget.created_at), "dd/MM/yyyy")}</span>
                {budget.valid_until && <span>• Válido até {format(new Date(budget.valid_until), "dd/MM/yyyy")}</span>}
                <Badge variant="outline" className={`${st.color} text-[10px] print:hidden`}>{st.label}</Badge>
              </div>
            </div>

            {/* ===== Parties ===== */}
            <div className="grid md:grid-cols-2 gap-4 text-sm mt-6">
              <div className="border border-amber-400/40 rounded-lg p-4 space-y-1 bg-amber-50/30">
                <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">Contratada (Clínica)</p>
                <p className="font-semibold" style={{ color: "#103444" }}>{clinic?.name || "—"}</p>
                {clinic?.responsible_name && <p className="text-xs text-slate-600">Resp. Técnica: {clinic.responsible_name}</p>}
                {clinic?.responsible_cro && <p className="text-xs text-slate-600">{clinic.responsible_cro}</p>}
                {clinic?.address && <p className="text-xs text-muted-foreground">{clinic.address}</p>}
                {(clinic?.phone || clinic?.email) && (
                  <p className="text-xs text-muted-foreground">{[clinic.phone, clinic.email].filter(Boolean).join(" • ")}</p>
                )}
              </div>
              <div className="border border-amber-400/40 rounded-lg p-4 space-y-1 bg-amber-50/30">
                <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">Contratante (Paciente)</p>
                <p className="font-semibold" style={{ color: "#103444" }}>{patient?.name || "—"}</p>
                {patient?.cpf && <p className="text-xs text-slate-600">CPF: {patient.cpf}</p>}
                {patient?.rg && <p className="text-xs text-slate-600">RG: {patient.rg}</p>}
                {(patient?.phone || patient?.email) && (
                  <p className="text-xs text-muted-foreground">{[patient.phone, patient.email].filter(Boolean).join(" • ")}</p>
                )}
                {(patient?.street || patient?.city) && (
                  <p className="text-xs text-muted-foreground">
                    {[patient.street, patient.number, patient.neighborhood, patient.city, patient.state, patient.postal_code].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* ===== Object ===== */}
            <section className="mt-8">
              <h3 className="text-sm font-bold tracking-wide mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#103444" }}>
                1. OBJETO DO CONTRATO
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">
                O presente contrato tem por objeto a prestação de serviços odontológicos pela <strong>Contratada</strong> ao <strong>Contratante</strong>, conforme plano de tratamento abaixo discriminado:
              </p>
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
                    <div className="col-span-3 text-right text-slate-800 font-medium">
                      R$ {Number(item.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ===== Values ===== */}
            <section className="mt-8">
              <h3 className="text-sm font-bold tracking-wide mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#103444" }}>
                2. VALORES E CONDIÇÕES DE PAGAMENTO
              </h3>
              <div className="border border-amber-400/30 rounded-lg p-5 bg-gradient-to-br from-white to-amber-50/40">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>R$ {Number(budget.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {Number(budget.discount) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Desconto</span>
                      <span>- R$ {Number(budget.discount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-amber-400/40">
                    <span className="text-xs uppercase tracking-wider text-amber-700 font-semibold">Valor Final</span>
                    <span className="text-2xl font-bold" style={{ color: "#103444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      R$ {Number(budget.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="pt-3 text-xs text-slate-600 capitalize">
                    <span className="font-semibold">Forma de pagamento:</span> {paymentMethodLabel}
                  </div>
                </div>
              </div>
            </section>

            {/* ===== Clauses ===== */}
            <section className="mt-8">
              <h3 className="text-sm font-bold tracking-wide mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#103444" }}>
                3. CLÁUSULAS CONTRATUAIS
              </h3>
              <ol className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <li><strong>3.1.</strong> O Contratante declara estar ciente do plano de tratamento proposto e que o sucesso do resultado depende da resposta biológica individual e do cumprimento rigoroso das orientações fornecidas pela Contratada.</li>
                <li><strong>3.2.</strong> O Contratante compromete-se a seguir todas as orientações pré e pós-operatórias, comparecer às sessões agendadas e colaborar ativamente para o êxito do tratamento.</li>
                <li><strong>3.3.</strong> Faltas não justificadas com no mínimo 24 (vinte e quatro) horas de antecedência poderão gerar taxa de reagendamento no valor de <strong>R$ {Number(clinic?.cancellation_fee || 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>, em razão da reserva da hora clínica.</li>
                <li><strong>3.4.</strong> O presente orçamento tem validade de <strong>15 (quinze) dias corridos</strong> a partir da data de emissão, podendo os valores serem reajustados após este prazo.</li>
                <li><strong>3.5.</strong> Fica eleito o foro da comarca da Contratada para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</li>
              </ol>
            </section>

            {/* ===== Signatures ===== */}
            <section className="mt-12 grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t-2 border-slate-400 pt-2 min-h-[60px] flex items-end justify-center">
                  {budget.accepted_signature ? (
                    <p className="italic text-base mb-1" style={{ color: "#103444", fontFamily: "'Dancing Script', cursive" }}>
                      {budget.accepted_signature}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-slate-600 mt-1">Assinatura do Contratante</p>
                <p className="text-[11px] text-muted-foreground">{patient?.name}</p>
                {budget.accepted_at && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Aceito em {format(new Date(budget.accepted_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                )}
              </div>
              <div className="text-center">
                <div className="border-2 border-amber-500/60 rounded-lg p-4 min-h-[80px] flex flex-col items-center justify-center bg-amber-50/30">
                  <p className="font-bold text-sm" style={{ color: "#103444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {clinic?.responsible_name || clinic?.name}
                  </p>
                  {clinic?.responsible_cro && (
                    <p className="text-xs text-slate-600 mt-0.5">{clinic.responsible_cro}</p>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2">Responsável Técnica</p>
              </div>
            </section>

            {/* ===== Acceptance Form ===== */}
            {budget.status === "aceito" ? (
              <div className="mt-10 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center print:hidden">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-1" />
                <p className="font-semibold text-emerald-800">Contrato Aceito</p>
              </div>
            ) : isAcceptable ? (
              <div className="mt-10 pt-8 border-t border-amber-400/40 print:hidden">
                <h4 className="font-semibold mb-2" style={{ color: "#103444" }}>Aceitar Contrato</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Digite seu nome completo abaixo como assinatura digital para formalizar o aceite deste contrato.
                </p>
                <Input
                  placeholder="Nome completo"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="text-lg mb-3"
                />
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  size="lg"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || !signature.trim()}
                >
                  {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Aceitar e Assinar Contrato
                </Button>
              </div>
            ) : null}
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
