import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WA_TEMPLATES, TEMPLATE_CATEGORIES, renderTemplate, type WaTemplate } from "@/lib/whatsappTemplates";
import { openWhatsApp } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  phone: string | null | undefined;
  vars?: Record<string, string | number | undefined>;
};

export function WhatsAppTemplatesDialog({ open, onOpenChange, phone, vars = {} }: Props) {
  const { clinicId } = useClinic();
  const { data: clinic } = useQuery({
    queryKey: ["clinic-name", clinicId],
    enabled: !!clinicId && open,
    queryFn: async () => {
      const { data } = await supabase.from("clinics").select("name").eq("id", clinicId!).maybeSingle();
      return data;
    },
  });

  const fullVars = useMemo(
    () => ({ clinica: clinic?.name || "nossa clínica", ...vars }),
    [clinic?.name, vars]
  );

  const [activeCat, setActiveCat] = useState<WaTemplate["category"]>("confirmacao");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edited, setEdited] = useState<string>("");

  const templates = WA_TEMPLATES.filter(t => t.category === activeCat);
  const selected = WA_TEMPLATES.find(t => t.id === selectedId);

  const pick = (t: WaTemplate) => {
    setSelectedId(t.id);
    setEdited(renderTemplate(t.body, fullVars));
  };

  const send = () => {
    if (!edited.trim()) return;
    openWhatsApp(phone, edited);
    onOpenChange(false);
    setSelectedId(null);
    setEdited("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#103444]">
            <WhatsAppIcon className="h-5 w-5 text-emerald-600" /> Mensagens WhatsApp
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeCat} onValueChange={(v: any) => { setActiveCat(v); setSelectedId(null); setEdited(""); }}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto">
            {TEMPLATE_CATEGORIES.map(c => (
              <TabsTrigger key={c.id} value={c.id} className="text-xs">{c.label}</TabsTrigger>
            ))}
          </TabsList>

          {TEMPLATE_CATEGORIES.map(c => (
            <TabsContent key={c.id} value={c.id} className="space-y-2">
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => pick(t)}
                    className={`text-left rounded-lg border p-3 transition-all hover:border-amber-400 ${
                      selectedId === t.id ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#103444]">{t.label}</div>
                    <div className="text-xs text-[#103444]/60 line-clamp-2 mt-1 whitespace-pre-line">
                      {renderTemplate(t.body, fullVars)}
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {selected && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#103444]/70">Editar antes de enviar</div>
            <Textarea
              value={edited}
              onChange={e => setEdited(e.target.value)}
              rows={7}
              className="text-sm"
            />
            <div className="text-[11px] text-[#103444]/50">
              Variáveis disponíveis: {Object.keys(fullVars).map(k => `{${k}}`).join(", ")}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={send}
            disabled={!edited.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <WhatsAppIcon className="h-4 w-4" /> Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
