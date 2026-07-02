"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatCurrency } from "@/lib/utils";
import type { Employee } from "@/types";

const profileTabs = [
  { value: "info", label: "Информация" },
  { value: "schedule", label: "График" },
  { value: "appointments", label: "Записи" },
  { value: "tasks", label: "Задачи" },
  { value: "metrics", label: "Показатели" },
  { value: "access", label: "Права доступа" }
];

export default function EmployeesPage() {
  const data = useAppStore((state) => state.data);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [tab, setTab] = useState("info");

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        description="Карточки команды, загрузка, расписание, выручка и демонстрационные права доступа."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.employees.map((employee) => (
          <button
            key={employee.id}
            type="button"
            onClick={() => setSelected(employee)}
            className="text-left"
          >
            <Card className="h-full p-5 transition-colors hover:bg-muted/35">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{employee.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{employee.position}</p>
                </div>
                <StatusBadge status={employee.status === "working" ? "active" : employee.status === "dayOff" ? "waiting" : "paused"} />
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Расписание" value={employee.schedule} />
                <Row label="Выручка" value={formatCurrency(employee.revenue)} />
                <Row label="Записей" value={String(employee.appointmentsCount)} />
                <Row label="Рейтинг" value={employee.rating.toFixed(1)} />
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Загрузка</span>
                  <span>{employee.loadPercent}%</span>
                </div>
                <Progress value={employee.loadPercent} />
              </div>
            </Card>
          </button>
        ))}
      </div>

      <Drawer
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.name ?? "Профиль сотрудника"}
        description={selected?.position}
      >
        {selected ? (
          <div>
            <Tabs items={profileTabs} value={tab} onValueChange={setTab} />
            <div className="mt-5 space-y-3">
              {tab === "info" ? (
                <>
                  <Row label="Роль" value={selected.role === "owner" ? "владелец" : selected.role === "admin" ? "администратор" : "сотрудник"} />
                  <Row label="Рабочий статус" value={selected.status} />
                  <Row label="Средний рейтинг" value={selected.rating.toFixed(1)} />
                </>
              ) : null}
              {tab === "schedule" ? <Row label="График" value={`${selected.schedule}, Пн-Сб`} /> : null}
              {tab === "appointments" ? <Row label="Записи" value={`${selected.appointmentsCount} за месяц`} /> : null}
              {tab === "tasks" ? <Row label="Активные задачи" value="5 задач, 1 просрочена" /> : null}
              {tab === "metrics" ? (
                <>
                  <Row label="Выручка" value={formatCurrency(selected.revenue)} />
                  <Row label="Загрузка" value={`${selected.loadPercent}%`} />
                </>
              ) : null}
              {tab === "access" ? (
                <>
                  <Row label="Финансы" value={selected.role === "employee" ? "ограничено" : "доступно"} />
                  <Row label="Настройки" value={selected.role === "owner" ? "полный доступ" : "ограничено"} />
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
