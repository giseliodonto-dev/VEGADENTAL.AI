import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileSignature, Plus, Loader2, Download, Printer, MessageCircle, ChevronDown } from "lucide-react";
import { PrescriptionForm } from "./PrescriptionForm";
import {
  generatePrescriptionPdf,
  downloadPrescriptionPdf,
  printPrescriptionPdf,
  sendPrescriptionViaWhatsApp,
} from "@/utils/prescriptionPdf";
import type { Medication } from "@/lib/prescriptionAi";
import { toast } from "sonner";

interface Props {
  patient: any;
}

type PdfAction = "download" | "print" | "whatsapp";

export function PrescriptionPanel({ patient }: Props) {
  const { clinicId } = useClinic();
  const [creating, setCreating] = useState(false);

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ["prescriptions", patient.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!patient?.id,
  });

  const runAction = async (p: any, action: PdfAction) => {
    try {
      const { data: clinic } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinicId!)
        .maybeSingle();
      const { data: profile } = p.dentist_user_id
        ? await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", p.dentist_user_id)
            .maybeSingle()
        : { data: null as any };
      const doc = await generatePrescriptionPdf({
        clinicName: clinic?.name ?? "Clínica",
        clinicPhone: clinic?.phone,
        clinicEmail: clinic?.email,
        clinicAddress: clinic?.address,
        clinicLogoUrl: clinic?.logo_url,
        patientName: patient.name,
        patientCpf: patient.cpf,
        dentistName: profile?.full_name || clinic?.responsible_name,
        dentistCro: clinic?.responsible_cro,
        medications: (p.medications as Medication[]) ?? [],
        notes: p.notes,
        createdAt: new Date(p.created_at).toLocaleDateString("pt-BR"),
      });
      if (action === "download") downloadPrescriptionPdf(doc, patient.name);
      else if (action === "print") printPrescriptionPdf(doc);
      else
        sendPrescriptionViaWhatsApp(
          doc,
          patient.name,
          patient.phone ?? patient.whatsapp ?? null,
          clinic?.name ?? "nossa clínica",
        );
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <FileSignature className="h-5 w-5" /> Prescrições
          </h2>
          <p className="text-sm text-muted-foreground">
            Receituários do paciente — salvos com segurança e prontos para impressão.
          </p>
        </div>
        {!creating && (
          <Button variant="gold" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nova Prescrição
          </Button>
        )}
      </div>

      {creating && (
        <Card className="border-gold/30">
          <CardContent className="p-6">
            <PrescriptionForm
              patient={patient}
              onSaved={() => setCreating(false)}
            />
            <div className="mt-4 text-right">
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-primary">Histórico</h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : prescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma prescrição registrada.
          </p>
        ) : (
          prescriptions.map((p: any) => (
            <Card key={p.id} className="border-border">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")} ·{" "}
                    {(p.medications as any[])?.length ?? 0} medicamento(s)
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-md">
                    {(p.medications as any[])?.map((m) => m.name).join(", ")}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      Reimprimir <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => runAction(p, "download")}>
                      <Download className="h-4 w-4" /> Salvar no Computador
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => runAction(p, "print")}>
                      <Printer className="h-4 w-4" /> Imprimir Receita
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => runAction(p, "whatsapp")}>
                      <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
