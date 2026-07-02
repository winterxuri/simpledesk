"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";

export default function ResourcesPage() {
  const resources = useAppStore((state) => state.data.resources);

  return (
    <div>
      <PageHeader
        title="Ресурсы"
        description="Рабочие места, кабинеты, подъёмники, оборудование и будущие бронирования."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{resource.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{resource.type}</p>
              </div>
              <StatusBadge status={resource.status} />
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <Row label="Будущие бронирования" value={String(resource.futureBookings)} />
              <Row label="Техническое состояние" value={resource.condition} />
              <Row label="Комментарий" value={resource.comment} />
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Текущая загрузка</span>
                <span>{resource.loadPercent}%</span>
              </div>
              <Progress value={resource.loadPercent} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-48 text-right font-medium">{value}</span>
    </div>
  );
}
