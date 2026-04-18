import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Plus, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  preventivo: "Preventivos",
  clinico_geral: "Clínica Geral / Diagnóstico",
  dentistica: "Dentística / Estética",
  endodontia: "Endodontia",
  periodontia: "Periodontia",
  cirurgia: "Cirurgia Oral",
  implantodontia: "Implantodontia",
  protese: "Prótese Dentária",
  ortodontia: "Ortodontia",
  odontopediatria: "Odontopediatria",
  estetica: "Estética",
  outros: "Outros",
};

const formatCurrency = (v: number) =>
  v ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "";

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

interface Procedure {
  id: string;
  name: string;
  category: string;
  default_value: number;
  is_favorite: boolean;
  is_custom: boolean;
  time_minutes: number | null;
  observations: string | null;
}

interface ProcedureSelectorProps {
  value: string;
  onSelect: (procedure: { name: string; default_value: number }) => void;
}

export function ProcedureSelector({ value, onSelect }: ProcedureSelectorProps) {
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("outros");
  const [customValue, setCustomValue] = useState("");

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures_catalog", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from("procedures_catalog" as any)
        .select("*")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as unknown as Procedure[];
    },
    enabled: !!clinicId,
  });

  // Seed on first access if empty
  useQuery({
    queryKey: ["procedures_seed", clinicId],
    queryFn: async () => {
      if (!clinicId) return null;
      const { error } = await supabase.rpc("seed_default_procedures", { _clinic_id: clinicId });
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["procedures_catalog", clinicId] });
      }
      return null;
    },
    enabled: !!clinicId && procedures.length === 0,
    staleTime: Infinity,
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase
        .from("procedures_catalog" as any)
        .update({ is_favorite: !current } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["procedures_catalog", clinicId] }),
  });

  const addCustom = useMutation({
    mutationFn: async () => {
      if (!clinicId || !customName.trim()) throw new Error("Nome obrigatório");
      const { error } = await supabase.from("procedures_catalog" as any).insert({
        clinic_id: clinicId,
        name: customName.trim(),
        category: customCategory,
        default_value: parseFloat(customValue) || 0,
        is_custom: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures_catalog", clinicId] });
      toast.success("Procedimento adicionado!");
      setShowCustom(false);
      setCustomName("");
      setCustomCategory("outros");
      setCustomValue("");
    },
    onError: () => toast.error("Erro ao adicionar procedimento"),
  });

  // Group: favorites first, then by category
  const grouped = useMemo(() => {
    const favorites = procedures.filter((p) => p.is_favorite);
    const byCategory: Record<string, Procedure[]> = {};
    procedures.forEach((p) => {
      if (!byCategory[p.category]) byCategory[p.category] = [];
      byCategory[p.category].push(p);
    });
    const sortedCategories = CATEGORY_ORDER.filter((c) => byCategory[c]?.length);
    return { favorites, byCategory, sortedCategories };
  }, [procedures]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            {value || "Selecionar procedimento..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar procedimento..." />
            <CommandList>
              <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>

              {grouped.favorites.length > 0 && (
                <CommandGroup heading="⭐ Favoritos">
                  {grouped.favorites.map((p) => (
                    <CommandItem
                      key={p.id + "-fav"}
                      value={p.name}
                      onSelect={() => {
                        onSelect({ name: p.name, default_value: p.default_value });
                        setOpen(false);
                      }}
                      className="items-start"
                    >
                      <Check className={cn("mr-2 mt-0.5 h-4 w-4", value === p.name ? "opacity-100" : "opacity-0")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate">{p.name}</span>
                          <span className="text-xs font-medium text-foreground/80 shrink-0">{formatCurrency(p.default_value)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {p.time_minutes && <span>{p.time_minutes}min</span>}
                          {p.observations && <span className="truncate">· {p.observations}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="p-0.5 ml-1"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite.mutate({ id: p.id, current: true }); }}
                      >
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {grouped.sortedCategories.map((cat) => (
                <CommandGroup key={cat} heading={CATEGORY_LABELS[cat] || cat}>
                  {grouped.byCategory[cat].map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        onSelect({ name: p.name, default_value: p.default_value });
                        setOpen(false);
                      }}
                      className="items-start"
                    >
                      <Check className={cn("mr-2 mt-0.5 h-4 w-4", value === p.name ? "opacity-100" : "opacity-0")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate">{p.name}</span>
                          <span className="text-xs font-medium text-foreground/80 shrink-0">{formatCurrency(p.default_value)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {p.time_minutes && <span>{p.time_minutes}min</span>}
                          {p.observations && <span className="truncate">· {p.observations}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="p-0.5 ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite.mutate({ id: p.id, current: p.is_favorite });
                        }}
                      >
                        <Star className={cn("h-3.5 w-3.5", p.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}

              <CommandGroup>
                <CommandItem onSelect={() => { setShowCustom(true); setOpen(false); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar procedimento personalizado
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialog: Custom procedure */}
      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Procedimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nome</Label>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nome do procedimento" autoFocus />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Categoria</Label>
              <Select value={customCategory} onValueChange={setCustomCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_ORDER.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Valor padrão (R$)</Label>
              <Input type="number" value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustom(false)}>Cancelar</Button>
            <Button onClick={() => addCustom.mutate()} disabled={addCustom.isPending || !customName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
