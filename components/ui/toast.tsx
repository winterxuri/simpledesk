"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function ToastViewport() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }
    const timer = window.setTimeout(() => removeToast(toasts[0].id), 4200);
    return () => window.clearTimeout(timer);
  }, [removeToast, toasts]);

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border bg-card p-4 shadow-soft",
            toast.variant === "success" && "border-emerald-200",
            toast.variant === "warning" && "border-amber-200",
            toast.variant === "error" && "border-red-200"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => removeToast(toast.id)}
              aria-label="Закрыть уведомление"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
