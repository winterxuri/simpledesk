"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatCurrency, getLocalDateKey } from "@/lib/utils";
import type { Employee } from "@/types";

const profileTabs = [
  { value: "info", label: "Информация" },
  { value: "schedule", label: "График" },
  { value: "appointments", label: "Записи" },
  { value: "tasks", label: "Задачи" },
  { value: "metrics", label: "Показатели" },
  { value: "payroll", label: "Оплата" },
  { value: "access", label: "Права доступа" }
];

function employeeToForm(employee?: Employee) {
  return {
    name: employee?.name ?? "",
    position: employee?.position ?? "",
    status: employee?.status ?? "working" as Employee["status"],
    schedule: employee?.schedule ?? "09:00-18:00",
    role: employee?.role ?? "employee" as Employee["role"],
    loadPercent: String(employee?.loadPercent ?? 0),
    revenue: String(employee?.revenue ?? 0),
    appointmentsCount: String(employee?.appointmentsCount ?? 0),
    rating: String(employee?.rating ?? 0),
    compensationType: employee?.compensationType ?? "fixed" as NonNullable<Employee["compensationType"]>,
    baseSalary: String(employee?.baseSalary ?? 0),
    commissionPercent: String(employee?.commissionPercent ?? 0)
  };
}

export default function EmployeesPage() {
  const data = useAppStore((state) => state.data);
  const addEmployee = useAppStore((state) => state.addEmployee);
  const updateEmployee = useAppStore((state) => state.updateEmployee);
  const dismissEmployee = useAppStore((state) => state.dismissEmployee);
  const deleteDismissedEmployee = useAppStore((state) => state.deleteDismissedEmployee);
  const addToast = useAppStore((state) => state.addToast);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState(() => employeeToForm());

  function openEmployee(employee: Employee) {
    setSelected(employee);
    setCreateOpen(false);
    setForm(employeeToForm(employee));
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
      rating: Number(form.rating) || 0,
      compensationType: form.compensationType,
      baseSalary: Number(form.baseSalary) || 0,
      commissionPercent: Number(form.commissionPercent) || 0
    };
    updateEmployee(selected.id, patch);
    setSelected({ ...selected, ...patch });
  }

  function openCreate() {
    setSelected(null);
    setTab("info");
    setForm(employeeToForm());
    setCreateOpen(true);
  }

  function createEmployee() {
    addEmployee({
      name: form.name || "Новый сотрудник",
      position: form.position || "Сотрудник",
      status: form.status,
      schedule: form.schedule || "09:00-18:00",
      role: form.role,
      loadPercent: Number(form.loadPercent) || 0,
      revenue: Number(form.revenue) || 0,
      appointmentsCount: Number(form.appointmentsCount) || 0,
      rating: Number(form.rating) || 0,
      compensationType: form.compensationType,
      baseSalary: Number(form.baseSalary) || 0,
      commissionPercent: Number(form.commissionPercent) || 0
    });
    addToast({
      title: "Сотрудник добавлен",
      description: "Карточка создана владельцем. Личный вход сотрудника можно будет подключить приглашением.",
      variant: "success"
    });
    setCreateOpen(false);
    setForm(employeeToForm());
  }

  function fireEmployee() {
    if (!selected) {
      return;
    }
    if (selected.role === "owner") {
      addToast({
        title: "Владельца нельзя уволить",
        description: "Сначала назначьте другого владельца компании.",
        variant: "warning"
      });
      return;
    }
    dismissEmployee(selected.id);
    setSelected({
      ...selected,
      status: "dismissed",
      dismissedAt: getLocalDateKey()
    });
    addToast({
      title: "Сотрудник уволен",
      description: "Карточка осталась в истории, новые записи лучше назначать другим сотрудникам.",
      variant: "success"
    });
  }

  function deleteEmployeeCard() {
    if (!selected) {
      return;
    }
    if (selected.status !== "dismissed") {
      addToast({
        title: "Сначала увольте сотрудника",
        description: "Удаление доступно только после перевода сотрудника в статус «уволен».",
        variant: "warning"
      });
      return;
    }
    if (selected.role === "owner") {
      addToast({
        title: "Владельца нельзя удалить",
        description: "Сначала передайте роль владельца другому пользователю.",
        variant: "warning"
      });
      return;
    }

    const confirmed = window.confirm(
      `Удалить карточку сотрудника "${selected.name}"? История записей и продаж останется, но сотрудник исчезнет из списка.`
    );
    if (!confirmed) {
      return;
    }

    deleteDismissedEmployee(selected.id);
    addToast({
      title: "Сотрудник удалён",
      description: "Карточка удалена из команды. Связанные исторические данные сохранены.",
      variant: "success"
    });
    setSelected(null);
  }

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        description="Карточки команды, загрузка, расписание, выручка, права доступа и базовые условия оплаты."
        actions={
          <Button type="button" onClick={openCreate}>
            Добавить сотрудника
          </Button>
        }
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
                <StatusBadge status={employee.status === "working" ? "active" : employee.status} />
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Расписание" value={employee.schedule} />
                <Row label="Выручка" value={formatCurrency(employee.revenue)} />
                <Row label="Записей" value={String(employee.appointmentsCount)} />
                <Row label="Рейтинг" value={employee.rating.toFixed(1)} />
                <Row label="Оплата" value={getCompensationLabel(employee)} />
              </div>
            </Card>
          </button>
        ))}
      </div>

      <Drawer
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setForm(employeeToForm());
          }
        }}
        title="Добавить сотрудника"
        description="Владелец может завести карточку сотрудника без отдельной регистрации."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Должность</Label>
              <Input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Employee["role"] })}>
                <option value="admin">Администратор</option>
                <option value="employee">Сотрудник</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>График</Label>
              <Input value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Схема оплаты</Label>
              <Select value={form.compensationType} onChange={(event) => setForm({ ...form, compensationType: event.target.value as NonNullable<Employee["compensationType"]> })}>
                <option value="fixed">Фикс</option>
                <option value="commission">Процент</option>
                <option value="mixed">Фикс + процент</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Фикс, ₽</Label>
              <Input type="number" value={form.baseSalary} onChange={(event) => setForm({ ...form, baseSalary: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Процент, %</Label>
              <Input type="number" value={form.commissionPercent} onChange={(event) => setForm({ ...form, commissionPercent: event.target.value })} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Личный вход сотрудника лучше делать через приглашение по email. Пока карточка хранит расписание, роль, показатели и условия оплаты.
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={createEmployee}>
              Добавить
            </Button>
          </div>
        </div>
      </Drawer>

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
                        <option value="dismissed">Уволен</option>
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
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={saveEmployee}>
                      Сохранить профиль
                    </Button>
                    {selected.status !== "dismissed" ? (
                      <Button type="button" variant="outline" onClick={fireEmployee}>
                        Уволить
                      </Button>
                    ) : (
                      <Button type="button" variant="destructive" onClick={deleteEmployeeCard}>
                        Удалить карточку
                      </Button>
                    )}
                  </div>
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
              {tab === "payroll" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Схема оплаты</Label>
                      <Select value={form.compensationType} onChange={(event) => setForm({ ...form, compensationType: event.target.value as NonNullable<Employee["compensationType"]> })}>
                        <option value="fixed">Фикс</option>
                        <option value="commission">Процент</option>
                        <option value="mixed">Фикс + процент</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Фикс, ₽</Label>
                      <Input type="number" value={form.baseSalary} onChange={(event) => setForm({ ...form, baseSalary: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Процент, %</Label>
                      <Input type="number" value={form.commissionPercent} onChange={(event) => setForm({ ...form, commissionPercent: event.target.value })} />
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3 text-sm">
                      <p className="text-muted-foreground">Расчёт за месяц по текущей выручке</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(
                          (Number(form.baseSalary) || 0) +
                            (Number(form.revenue) || 0) * ((Number(form.commissionPercent) || 0) / 100)
                        )}
                      </p>
                    </div>
                  </div>
                  <Button type="button" onClick={saveEmployee}>Сохранить условия</Button>
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

function getCompensationLabel(employee: Employee) {
  if (employee.compensationType === "commission") {
    return `${employee.commissionPercent ?? 0}%`;
  }
  if (employee.compensationType === "mixed") {
    return `${formatCurrency(employee.baseSalary ?? 0)} + ${employee.commissionPercent ?? 0}%`;
  }
  return formatCurrency(employee.baseSalary ?? 0);
}
