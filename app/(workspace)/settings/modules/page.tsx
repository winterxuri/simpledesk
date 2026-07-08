"use client";

import { useMemo, useState } from "react";
import { MODULES, getModuleDefinition } from "@/config/modules";
import { getModuleTitle, normalizeCompanyModules } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/modules/page-header";
import { ModuleCard } from "@/components/modules/module-card";
import { ConfirmDialog } from "@/components/modules/confirm-dialog";
import { useAppStore } from "@/store/app-store";
import type { ModuleCode } from "@/types";

export default function SettingsModulesPage() {
  const company = useAppStore((state) => state.company);
  const modules = useAppStore((state) => state.companyModules);
  const toggleModule = useAppStore((state) => state.toggleModule);
  const setVisibility = useAppStore((state) => state.setModuleVisibility);
  const addToast = useAppStore((state) => state.addToast);
  const [pendingDisable, setPendingDisable] = useState<ModuleCode | null>(null);

  const enriched = useMemo(
    () =>
      normalizeCompanyModules(modules, company.businessTemplateId).map((module) => ({
        module,
        definition: getModuleDefinition(module.code) ?? MODULES[0],
        title: getModuleTitle(module.code, company.businessTemplateId)
      })),
    [company.businessTemplateId, modules]
  );

  return (
    <div>
      <PageHeader
        title="Настройки модулей"
        description="Каталог разделов с зависимостями, статусами и безопасным отключением."
      />
      <Card className="mb-6 border-border bg-card p-4 text-sm text-muted-foreground">
        Модуль «Помещения и оборудование» нужен только если вместе с записью требуется бронировать кабинет,
        пост, зал, технику или другое ограниченное место. Если бизнес работает только по сотрудникам,
        модуль лучше держать скрытым.
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {enriched.map(({ module, definition, title }) => (
          <ModuleCard
            key={module.code}
            module={module}
            definition={definition}
            title={title}
            onToggle={(enabled) => {
              if (!enabled) {
                setPendingDisable(module.code);
              } else {
                toggleModule(module.code, true);
              }
            }}
            onVisibility={(visible) => setVisibility(module.code, visible)}
            onSettings={() =>
              addToast({
                title: "Настройки модуля",
                description: `Включение и видимость модуля "${title}" сохраняются автоматически.`,
                variant: "info"
              })
            }
          />
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(pendingDisable)}
        onOpenChange={(open) => !open && setPendingDisable(null)}
        title="Отключить модуль?"
        description="Данные не будут удалены. Модуль можно будет включить позже."
        confirmLabel="Отключить"
        onConfirm={() => {
          if (pendingDisable) {
            toggleModule(pendingDisable, false);
          }
          setPendingDisable(null);
        }}
      />
      <div className="mt-6 flex justify-end">
        <span className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm text-muted-foreground">
          Сохранено автоматически
        </span>
      </div>
    </div>
  );
}
