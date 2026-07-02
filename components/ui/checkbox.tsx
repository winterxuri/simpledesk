import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export function Checkbox({
  className,
  label,
  description,
  ...props
}: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40">
      <input
        type="checkbox"
        className={cn(
          "mt-0.5 h-4 w-4 rounded border-border accent-primary",
          className
        )}
        {...props}
      />
      <span className="min-w-0">
        {label ? <span className="block text-sm font-medium">{label}</span> : null}
        {description ? (
          <span className="mt-1 block text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
