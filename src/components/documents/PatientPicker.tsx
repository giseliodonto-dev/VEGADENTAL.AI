import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/hooks/useClinic";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PickerPatient {
  id: string;
  name: string;
  cpf?: string | null;
  rg?: string | null;
  phone?: string | null;
}

interface Props {
  value?: string;
  onChange: (p: PickerPatient | null) => void;
}

export function PatientPicker({ value, onChange }: Props) {
  const { clinicId } = useClinic();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["doc-patients", clinicId],
    queryFn: async (): Promise<PickerPatient[]> => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, cpf, rg, phone")
        .eq("clinic_id", clinicId!)
        .order("name");
      if (error) throw error;
      return (data ?? []) as PickerPatient[];
    },
    enabled: !!clinicId,
  });

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#103444]">Paciente</Label>
      <Select
        value={value}
        onValueChange={(id) => {
          const p = patients.find((x) => x.id === id) ?? null;
          onChange(p);
        }}
      >
        <SelectTrigger className="border-amber-400/30 focus:ring-[#103444]">
          <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione um paciente"} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {patients.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
              {p.cpf ? ` · CPF ${p.cpf}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
