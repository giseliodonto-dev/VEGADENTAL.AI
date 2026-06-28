import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserCircle2, Stethoscope } from "lucide-react";

interface ProcedureChip {
  label: string;
}

interface Props {
  createdAt: string;
  dentistName?: string | null;
  contentHtml: string;
  procedures?: ProcedureChip[];
}

export function HistoryEntryCard({
  createdAt,
  dentistName,
  contentHtml,
  procedures = [],
}: Props) {
  const date = new Date(createdAt);
  const isHtml = /<[a-z][\s\S]*>/i.test(contentHtml);

  return (
    <div className="relative pl-8">
      <span
        aria-hidden
        className="absolute left-0 top-6 grid h-3 w-3 place-items-center rounded-full bg-gold ring-4 ring-background"
      />
      <article className="rounded-xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-sm space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <time className="text-xs uppercase tracking-wider text-muted-foreground">
            {format(date, "dd/MM/yyyy · HH:mm", { locale: ptBR })}
          </time>
        </header>

        {procedures.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {procedures.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                {p.label}
              </span>
            ))}
          </div>
        )}

        {isHtml ? (
          <div
            className="prose prose-sm max-w-none leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {contentHtml}
          </p>
        )}

        {dentistName && (
          <footer className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <UserCircle2 className="h-3.5 w-3.5" />
            {dentistName}
          </footer>
        )}
      </article>
    </div>
  );
}
