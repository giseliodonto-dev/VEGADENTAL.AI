import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserCircle2 } from "lucide-react";

interface Props {
  createdAt: string;
  dentistName?: string | null;
  contentHtml: string;
}

export function HistoryEntryCard({ createdAt, dentistName, contentHtml }: Props) {
  const date = new Date(createdAt);
  return (
    <div className="relative pl-8">
      <span
        aria-hidden
        className="absolute left-0 top-6 grid h-3 w-3 place-items-center rounded-full bg-gold ring-4 ring-background"
      />
      <article className="rounded-xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-sm">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <time className="text-xs uppercase tracking-wider text-muted-foreground">
            {format(date, "dd 'de' MMMM 'de' yyyy · HH:mm", { locale: ptBR })}
          </time>
          {dentistName && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <UserCircle2 className="h-4 w-4" />
              {dentistName}
            </span>
          )}
        </header>
        <div
          className="prose prose-sm max-w-none leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </div>
  );
}
