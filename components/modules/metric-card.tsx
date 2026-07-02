import { AppIcon } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  hint,
  icon,
  delta,
  tone = "default"
}: {
  title: string;
  value: string;
  hint?: string;
  icon: string;
  delta?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            tone === "success" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            tone === "warning" && "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            tone === "danger" && "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
            tone === "default" && "bg-accent text-accent-foreground"
          )}
        >
          <AppIcon name={icon} className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 text-sm">
        {hint ? <span className="text-muted-foreground">{hint}</span> : <span />}
        {delta ? (
          <span className={cn("font-medium", delta.startsWith("-") ? "text-red-600" : "text-emerald-600")}>
            {delta}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
