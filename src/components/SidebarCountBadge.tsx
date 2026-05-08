import { cn } from "@/lib/utils";

interface Props {
  count?: number;
  variant?: "count" | "alert";
  collapsed?: boolean;
  className?: string;
}

export function SidebarCountBadge({ count = 0, variant = "count", collapsed, className }: Props) {
  if (count <= 0) return null;

  if (variant === "alert") {
    return (
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full bg-gold",
          collapsed && "absolute right-1.5 top-1.5",
          className,
        )}
        aria-label={`${count} alertas`}
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-gold/70" />
      </span>
    );
  }

  if (collapsed) return null;

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
