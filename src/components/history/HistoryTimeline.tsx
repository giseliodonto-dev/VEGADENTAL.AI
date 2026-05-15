import { ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryEntryCard } from "./HistoryEntryCard";

interface Entry {
  id: string;
  created_at: string;
  content: string;
  dentist_user_id: string | null;
  treatment_id?: string | null;
  executed_value?: number | null;
}

interface Props {
  entries: Entry[];
  isLoading: boolean;
  dentistNameById: Record<string, string>;
  treatmentById: Record<string, any>;
}

export function HistoryTimeline({
  entries,
  isLoading,
  dentistNameById,
  treatmentById,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
        <ClipboardList className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">
          Nenhuma evolução registrada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 border-l border-gold/20 pl-2">
      {entries.map((e) => {
        const t = e.treatment_id ? treatmentById[e.treatment_id] : null;
        const procLabel = t
          ? `${t.procedure_type}${t.tooth_number ? ` · dente ${t.tooth_number}` : ""}`
          : null;
        return (
          <HistoryEntryCard
            key={e.id}
            createdAt={e.created_at}
            dentistName={e.dentist_user_id ? dentistNameById[e.dentist_user_id] : null}
            contentHtml={e.content}
            procedureLabel={procLabel}
            executedValue={Number(e.executed_value || 0)}
          />
        );
      })}
    </div>
  );
}
