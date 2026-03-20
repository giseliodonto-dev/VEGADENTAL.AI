import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Clock, Palette } from "lucide-react";

const Configuracoes = () => {
  return (
    <AppLayout title="Configurações">
      <div className="max-w-2xl space-y-6">
        {/* Clinic info */}
        <div
          className="animate-fade-up rounded-xl border bg-card p-6 shadow-sm"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Dados do Consultório</h3>
              <p className="text-xs text-muted-foreground">Informações gerais</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do consultório</Label>
              <Input defaultValue="OdontoGest Clínica" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CNPJ</Label>
              <Input defaultValue="12.345.678/0001-90" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Endereço</Label>
              <Input defaultValue="Rua das Flores, 123 — São Paulo, SP" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input defaultValue="(11) 3456-7890" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input defaultValue="contato@odontogest.com" />
            </div>
          </div>
          <Button className="mt-4">Salvar Alterações</Button>
        </div>

        {/* Work hours */}
        <div
          className="animate-fade-up rounded-xl border bg-card p-6 shadow-sm"
          style={{ animationDelay: "100ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Horário de Funcionamento</h3>
              <p className="text-xs text-muted-foreground">Dias e horários de atendimento</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Segunda a Sexta</Label>
              <Input defaultValue="08:00 — 18:00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sábado</Label>
              <Input defaultValue="08:00 — 12:00" />
            </div>
          </div>
          <Button className="mt-4">Salvar Alterações</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
