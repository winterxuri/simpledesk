"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
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
  const updateEmployee = useAppStore((state) => state.updateEmployee);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState({
    name: "",
    position: "",
    status: "working" as Employee["status"],
    schedule: "",
    role: "employee" as Employee["role"],
    loadPercent: "0",
    revenue: "0",
    appointmentsCount: "0",
    rating: "4.5"
  });

  function openEmployee(employee: Employee) {
    setSelected(employee);
    setForm({
      name: employee.name,
      position: employee.position,
      status: employee.status,
      schedule: employee.schedule,
      role: employee.role,
      loadPercent: String(employee.loadPercent),
      revenue: String(employee.revenue),
      appointmentsCount: String(employee.appointmentsCount),
      rating: String(employee.rating)
    });
  }

  function saveEmployee() {
    if (!selected) {
      return;
    }
    const patch: Partial<Employee> = {
      name: form.name,
      position: form.position,
      status: form.status,
      schedule: form.schedule,
      role: form.role,
      loadPercent: Number(form.loadPercent) || 0,
      revenue: Number(form.revenue) || 0,
      appointmentsCount: Number(form.appointmentsCount) || 0,
      rating: Number(form.rating) || 0
    };
    updateEmployee(selected.id, patch);
    setSelected({ ...selected, ...patch });
  }

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
            onClick={() => openEmployee(employee)}
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>ФИО</Label>
                      <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Должность</Label>
                      <Input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Статус</Label>
                      <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Employee["status"] })}>
                        <option value="working">Работает</option>
                        <option value="dayOff">Выходной</option>
                        <option value="vacation">Отпуск</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Роль</Label>
                      <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Employee["role"] })}>
                        <option value="owner">Владелец</option>
                        <option value="admin">Администратор</option>
                        <option value="employee">Сотрудник</option>
                      </Select>
                    </div>
                  </div>
                  <Button type="button" onClick={saveEmployee}>
                    Сохранить профиль
                  </Button>
                </>
              ) : null}
              {tab === "schedule" ? (
                <>
                  <div className="space-y-2">
                    <Label>График</Label>
                    <Input value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button type="button" variant="outline" onClick={() => setForm({ ...form, schedule: "09:00-18:00", status: "working" })}>Дневная смена</Button>
                    <Button type="button" variant="outline" onClick={() => setForm({ ...form, schedule: "11:00-20:00", status: "working" })}>Вечерняя смена</Button>
                    <Button type="button" variant="outline" onClick={() => setForm({ ...form, status: "dayOff" })}>Выходной</Button>
                  </div>
                  <Button type="button" onClick={saveEmployee}>Сохранить график</Button>
                </>
              ) : null}
              {tab === "appointments" ? (
                <>
                  <Row label="Записи" value={`${selected.appointmentsCount} за месяц`} />
                  <Row label="Ближайшая запись" value={data.appointments.find((appointment) => appointment.employeeId === selected.id)?.time ?? "не назначена"} />
                </>
              ) : null}
              {tab === "tasks" ? <Row label="Активные задачи" value="5 задач, 1 просрочена" /> : null}
              {tab === "metrics" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Выручка</Label>
                      <Input value={form.revenue} onChange={(event) => setForm({ ...form, revenue: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Загрузка, %</Label>
                      <Input value={form.loadPercent} onChange={(event) => setForm({ ...form, loadPercent: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Записей</Label>
                      <Input value={form.appointmentsCount} onChange={(event) => setForm({ ...form, appointmentsCount: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Рейтинг</Label>
                      <Input value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} />
                    </div>
                  </div>
                  <Button type="button" onClick={saveEmployee}>Сохранить показатели</Button>
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
