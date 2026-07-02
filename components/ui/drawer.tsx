"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  className
}: DrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-slate-950/40"
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "absolute top-0 h-full w-full max-w-xl overflow-auto border-border bg-card shadow-2xl",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card p-5">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}
