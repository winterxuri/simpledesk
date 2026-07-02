"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "justify-end bg-primary" : "justify-start bg-muted"
      )}
    >
      <span
        className="block h-5 w-5 rounded-full bg-white shadow transition-transform"
      />
    </button>
  );
}
