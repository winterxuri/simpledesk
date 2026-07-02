"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { getModuleDefinition } from "@/config/modules";
import { getModuleTitle } from "@/config/navigation";
import { useAppStore } from "@/store/app-store";
import { AppIcon } from "@/lib/icons";
import type { ModuleCode } from "@/types";

export default function SettingsNavigationPage() {
  const company = useAppStore((state) => state.company);
  const modules = useAppStore((state) => state.companyModules);
  const setVisibility = useAppStore((state) => state.setModuleVisibility);
  const moveItem = useAppStore((state) => state.moveNavigationItem);
  const reorderNavigation = useAppStore((state) => state.reorderNavigation);
  const restore = useAppStore((state) => state.restoreRecommendedNavigation);
  const [dragged, setDragged] = useState<ModuleCode | null>(null);

  const items = useMemo(
    () =>
      modules
        .filter((module) => module.status !== "disabled" && module.status !== "unavailable")
        .sort((a, b) => a.order - b.order),
    [modules]
  );

  function drop(target: ModuleCode) {
    if (!dragged || dragged === target) {
      return;
    }
    const current = items.map((item) => item.code);
    const from = current.indexOf(dragged);
    const to = current.indexOf(target);
    const next = [...current];
    next.splice(from, 1);
    next.splice(to, 0, dragged);
    reorderNavigation(next);
    setDragged(null);
  }

  return (
    <div>
      <PageHeader
        title="Настройка меню"
        description="Перетаскивайте пункты, скрывайте разделы из меню и возвращайте рекомендуемый порядок."
        actions={
          <Button type="button" variant="outline" onClick={restore}>
            <RotateCcw className="h-4 w-4" />
            Восстановить порядок
          </Button>
        }
      />
      <div className="grid gap-3">
        {items.map((module, index) => {
          const definition = getModuleDefinition(module.code);
          const title = getModuleTitle(module.code, company.businessTemplateId);
          return (
            <Card
              key={module.code}
              className="p-4"
              draggable
              onDragStart={() => setDragged(module.code)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => drop(module.code)}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <AppIcon name={definition?.icon ?? "Circle"} className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{title}</p>
                      <StatusBadge status={module.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">Позиция {index + 1}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => moveItem(module.code, "up")} disabled={index === 0}>
                    Выше
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => moveItem(module.code, "down")} disabled={index === items.length - 1}>
                    Ниже
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setVisibility(module.code, !module.visible)}>
                    {module.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {module.visible ? "Скрыть" : "Показать"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
