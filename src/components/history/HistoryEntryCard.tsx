import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserCircle2, Stethoscope, Wallet } from "lucide-react";

interface Props {
  createdAt: string;
  dentistName?: string | null;
  contentHtml: string;
  procedureLabel?: string | null;
  executedValue?: number;
}

const fmtBRL = (v: number) =>
  `R$ ${(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function HistoryEntryCard({
  createdAt,
  dentistName,
  contentHtml,
  procedureLabel,
  executedValue = 0,
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <time className="text-xs uppercase tracking-wider text-muted-foreground">
              {format(date, "dd/MM/yyyy · HH:mm", { locale: ptBR })}
            </time>
            {procedureLabel && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <Stethoscope className="h-4 w-4" />
                {procedureLabel}
              </span>
            )}
          </div>
          {executedValue > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              <Wallet className="h-3.5 w-3.5" />
              Saldo abatido: {fmtBRL(executedValue)}
            </span>
          )}
        </header>

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
