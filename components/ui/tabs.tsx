"use client";

import { cn } from "@/lib/utils";

export function Tabs({
  items,
  value,
  onValueChange,
  className
}: {
  items: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted p-1",
        className
      )}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onValueChange(item.value)}
          className={cn(
            "h-8 rounded-md px-3 text-sm font-medium transition-colors",
            value === item.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
