import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Sparkles, Copy, Search, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { mentorScripts, CATEGORY_LABELS, type MentorScript, type MentorCategory } from "@/data/mentorScripts";
import { openWhatsApp } from "@/lib/whatsapp";
import { useClinic } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES: MentorCategory[] = ["vendas", "gestao", "posicionamento", "melhoria"];

export default function MentoraVega() {
  const { clinicId } = useClinic();
  const [clinic, setClinic] = useState<{ name: string | null; phone: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState<MentorCategory>("vendas");
  const [search, setSearch] = useState("");
  const [aiFilteredIds, setAiFilteredIds] = useState<string[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!clinicId) return;
    supabase
      .from("clinics")
      .select("name, phone")
      .eq("id", clinicId)
      .maybeSingle()
      .then(({ data }) => setClinic(data ?? null));
  }, [clinicId]);

  const localFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mentorScripts;
    return mentorScripts.filter((s) =>
      [s.title, s.subcategory, s.body, s.why, ...s.tags].some((t) => t.toLowerCase().includes(q))
    );
  }, [search]);

  const visibleScripts = useMemo(() => {
    if (aiFilteredIds && aiFilteredIds.length) {
      const map = new Map(mentorScripts.map((s) => [s.id, s]));
      return aiFilteredIds.map((id) => map.get(id)).filter(Boolean) as MentorScript[];
    }
    return localFiltered;
  }, [aiFilteredIds, localFiltered]);

  const scriptsByCategory = useMemo(() => {
    const map: Record<MentorCategory, MentorScript[]> = {
      vendas: [], gestao: [], posicionamento: [], melhoria: [],
    };
    visibleScripts.forEach((s) => map[s.category].push(s));
    return map;
  }, [visibleScripts]);

  async function handleAiSearch() {
    if (!search.trim()) {
      toast({ title: "Descreva a situação", description: "Ex: paciente achou caro, não quer fechar agora." });
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("mentor-ai", {
        body: {
          action: "search",
          payload: {
            situation: search,
            scripts: mentorScripts.map(({ id, subcategory, title, tags }) => ({
              id, subcategory, title, tags,
            })),
          },
        },
      });
      if (error) throw error;
      const ids: string[] = data?.ids ?? [];
      if (!ids.length) {
        toast({ title: "Nenhum script relevante encontrado", description: "Tente reformular a situação." });
        return;
      }
      setAiFilteredIds(ids);
      // Switch to the tab of the first result
      const first = mentorScripts.find((s) => s.id === ids[0]);
      if (first) setActiveTab(first.category);
      toast({ title: `${ids.length} scripts selecionados pela IA` });
    } catch (e: any) {
      toast({ title: "Erro na busca", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }

  function clearAiFilter() {
    setAiFilteredIds(null);
    setSearch("");
  }

  return (
    <AppLayout title="Mentor de IA" subtitle="Biblioteca curada de scripts de alta conversão">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Search bar */}
        <Card className="border-gold/30">
          <CardContent className="p-5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Qual situação você precisa resolver agora?
            </Label>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (aiFilteredIds) setAiFilteredIds(null);
                  }}
                  placeholder="Ex: paciente achou caro, sumiu após orçamento, secretária desalinhada..."
                  className="pl-9"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAiSearch(); }}
                />
              </div>
              <Button onClick={handleAiSearch} disabled={searching} variant="gold">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Buscar com IA
              </Button>
              {aiFilteredIds && (
                <Button variant="outline" onClick={clearAiFilter}>
                  <X className="h-4 w-4" /> Limpar
                </Button>
              )}
            </div>
            {aiFilteredIds && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Mostrando {aiFilteredIds.length} scripts selecionados pela IA para a sua situação.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MentorCategory)}>
          <TabsList className="bg-transparent p-0 h-auto border-b border-border w-full justify-start rounded-none gap-6">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 font-display"
              >
                {CATEGORY_LABELS[cat]}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({scriptsByCategory[cat].length})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-6">
              {scriptsByCategory[cat].length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Nenhum script nesta categoria com o filtro atual.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {scriptsByCategory[cat].map((s) => (
                    <ScriptCard key={s.id} script={s} clinic={clinic} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}

function ScriptCard({
  script,
  clinic,
}: {
  script: MentorScript;
  clinic: { name: string | null; phone: string | null } | null;
}) {
  const [open, setOpen] = useState(false);
  const [personalized, setPersonalized] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ patientName: "", procedure: "", value: "" });

  const finalText = personalized ?? script.body;

  async function handlePersonalize() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mentor-ai", {
        body: {
          action: "personalize",
          payload: {
            script: script.body,
            patientName: form.patientName,
            procedure: form.procedure,
            value: form.value,
            clinicName: clinic?.name ?? "",
          },
        },
      });
      if (error) throw error;
      const text = data?.text;
      if (!text) throw new Error("Resposta vazia da IA");
      setPersonalized(text);
      toast({ title: "Script personalizado" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao personalizar", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(finalText);
      toast({ title: "Copiado para a área de transferência" });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  }

  function handleWhatsApp() {
    openWhatsApp(clinic?.phone ?? "", finalText);
  }

  return (
    <Card className="border-gold/30 hover:border-gold/60 transition-colors shadow-sm hover:shadow-md">
      <CardContent className="p-6 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gold mb-1">{script.subcategory}</p>
          <h3 className="font-display font-semibold text-lg leading-tight">{script.title}</h3>
        </div>
        <p className="text-xs italic text-muted-foreground leading-relaxed">
          <span className="not-italic font-medium text-foreground/70">Por que funciona — </span>
          {script.why}
        </p>
        <pre className="bg-muted/40 border border-border/50 rounded-lg p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed">
          {finalText}
        </pre>
        {personalized && (
          <button
            type="button"
            onClick={() => setPersonalized(null)}
            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Voltar ao script original
          </button>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="gold" onClick={() => setOpen(true)}>
            <Sparkles className="h-4 w-4" /> Personalizar com IA
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4" /> Copiar
          </Button>
          <Button size="sm" variant="outline" onClick={handleWhatsApp}>
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Personalizar com IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="pname">Nome do paciente</Label>
              <Input id="pname" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Ex: Marina" />
            </div>
            <div>
              <Label htmlFor="proc">Procedimento</Label>
              <Input id="proc" value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })} placeholder="Ex: lentes de contato" />
            </div>
            <div>
              <Label htmlFor="val">Valor (opcional)</Label>
              <Input id="val" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Ex: R$ 12.000" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Script base</Label>
              <Textarea value={script.body} readOnly rows={4} className="text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button variant="gold" onClick={handlePersonalize} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
