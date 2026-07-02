"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/modules/status-badge";
import { AppIcon } from "@/lib/icons";
import type { CompanyModule, ModuleDefinition } from "@/types";

export function ModuleCard({
  definition,
  module,
  title,
  onToggle,
  onVisibility,
  onSettings
}: {
  definition: ModuleDefinition;
  module: CompanyModule;
  title: string;
  onToggle: (enabled: boolean) => void;
  onVisibility: (visible: boolean) => void;
  onSettings: () => void;
}) {
  const enabled = module.status === "enabled" || module.status === "hidden";
  const unavailable = module.status === "unavailable";

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <AppIcon name={definition.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <StatusBadge status={module.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {definition.description}
          </p>
          {definition.dependencies.length > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Зависимости: {definition.dependencies.join(", ")}
            </p>
          ) : null}
          {module.status === "hidden" ? (
            <p className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Данные не удалены. Модуль скрыт только из меню.
            </p>
          ) : null}
        </div>
        <Switch
          checked={enabled && !unavailable}
          disabled={unavailable}
          onCheckedChange={onToggle}
          label={`Включить модуль ${title}`}
        />
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!enabled || unavailable}
          onClick={() => onVisibility(!module.visible)}
        >
          {module.visible ? "Скрыть из меню" : "Показать в меню"}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onSettings}>
          Настроить
        </Button>
      </div>
    </Card>
  );
}
