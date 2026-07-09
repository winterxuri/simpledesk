"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MetricCard } from "@/components/modules/metric-card";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { getEmployeeStatusForDate, getShiftLabel } from "@/lib/employee-status";
import { formatDate, getLocalDateKey } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { Employee, EmployeeShift, EmployeeShiftType } from "@/types";

const shiftTypeOptions: { value: EmployeeShiftType; label: string }[] = [
  { value: "work", label: "Рабочая смена" },
  { value: "dayOff", label: "Выходной" },
  { value: "vacation", label: "Отпуск" },
  { value: "sick", label: "Больничный" }
];

type ShiftForm = {
  id?: string;
  employeeId: string;
  date: string;
  type: EmployeeShiftType;
  startTime: string;
  endTime: string;
  comment: string;
};

export default function SchedulesPage() {
  const data = useAppStore((state) => state.data);
  const addEmployeeShift = useAppStore((state) => state.addEmployeeShift);
  const updateEmployeeShift = useAppStore((state) => state.updateEmployeeShift);
  const deleteEmployeeShift = useAppStore((state) => state.deleteEmployeeShift);
  const addToast = useAppStore((state) => state.addToast);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ShiftForm>(() => createShiftForm(data.employees[0]?.id ?? "", getLocalDateKey()));
  const today = getLocalDateKey();

  const employees = data.employees.filter((employee) => employee.status !== "dismissed");
  const visibleEmployees = employeeFilter === "all"
    ? employees
    : employees.filter((employee) => employee.id === employeeFilter);
  const weekDays = useMemo(() => getWeekDays(), []);
  const shiftByEmployeeAndDate = useMemo(() => {
    const map = new Map<string, EmployeeShift>();
    data.employeeShifts.forEach((shift) => {
      map.set(`${shift.employeeId}-${shift.date}`, shift);
    });
    return map;
  }, [data.employeeShifts]);

  const todayStatuses = employees.map((employee) =>
    getEmployeeStatusForDate(employee, data.employeeShifts, today)
  );
  const workToday = todayStatuses.filter((status) => status === "working").length;
  const dayOffToday = todayStatuses.filter((status) => status === "dayOff").length;
  const absentToday = todayStatuses.filter((status) => status === "vacation" || status === "sick").length;
  const shiftsThisWeek = data.employeeShifts.filter((shift) =>
    weekDays.some((day) => day.date === shift.date)
  ).length;

  function openShift(employee: Employee, date: string) {
    const existing = shiftByEmployeeAndDate.get(`${employee.id}-${date}`);
    setForm(existing ? shiftToForm(existing) : createShiftForm(employee.id, date, employee.schedule));
    setDialogOpen(true);
  }

  function saveShift() {
    if (!form.employeeId || !form.date) {
      addToast({
        title: "Выберите сотрудника и дату",
        description: "Смена должна быть привязана к конкретному дню.",
        variant: "warning"
      });
      return;
    }

    if (form.type === "work" && !isValidWorkTime(form.startTime, form.endTime)) {
      addToast({
        title: "Проверьте время смены",
        description: "Для рабочей смены начало и конец обязательны, конец должен быть позже начала.",
        variant: "warning"
      });
      return;
    }

    const payload: Omit<EmployeeShift, "id"> = {
      employeeId: form.employeeId,
      date: form.date,
      type: form.type,
      startTime: form.type === "work" ? form.startTime : "",
      endTime: form.type === "work" ? form.endTime : "",
      comment: form.comment.trim()
    };

    if (form.id) {
      updateEmployeeShift(form.id, payload);
    } else {
      const duplicate = data.employeeShifts.find(
        (shift) => shift.employeeId === form.employeeId && shift.date === form.date
      );
      if (duplicate) {
        updateEmployeeShift(duplicate.id, payload);
      } else {
        addEmployeeShift(payload);
      }
    }

    setDialogOpen(false);
    addToast({
      title: "График сохранён",
      description: "Статус сотрудника на выбранную дату обновится по смене.",
      variant: "success"
    });
  }

  function removeShift() {
    if (!form.id) {
      setDialogOpen(false);
      return;
    }
    const confirmed = window.confirm("Удалить смену сотрудника на этот день?");
    if (!confirmed) {
      return;
    }
    deleteEmployeeShift(form.id);
    setDialogOpen(false);
    addToast({
      title: "Смена удалена",
      description: "Для этого дня снова будет использоваться базовый статус из карточки сотрудника.",
      variant: "success"
    });
  }

  return (
    <div>
      <PageHeader
        title="Графики"
        description="Планируйте смены сотрудников, выходные, отпуска и больничные по дням."
        actions={
          <Button type="button" onClick={() => {
            setForm(createShiftForm(employees[0]?.id ?? "", today));
            setDialogOpen(true);
          }}>
            Добавить смену
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Работают сегодня" value={String(workToday)} hint="по сменам и статусам" icon="Clock3" tone="success" />
        <MetricCard title="Выходные" value={String(dayOffToday)} hint="на сегодня" icon="CalendarDays" tone={dayOffToday ? "warning" : "default"} />
        <MetricCard title="Отсутствуют" value={String(absentToday)} hint="отпуск или больничный" icon="UsersRound" tone={absentToday ? "warning" : "default"} />
        <MetricCard title="Смен на неделе" value={String(shiftsThisWeek)} hint="запланировано явно" icon="ClipboardList" />
      </div>

      <Card className="mt-6 p-3">
        <div className="max-w-xs space-y-2">
          <Label htmlFor="schedule-employee-filter">Сотрудник</Label>
          <Select
            id="schedule-employee-filter"
            value={employeeFilter}
            onChange={(event) => setEmployeeFilter(event.target.value)}
          >
            <option value="all">Все сотрудники</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="mt-4 space-y-4">
        {visibleEmployees.map((employee) => (
          <Card key={employee.id} className="overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
              <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
                <p className="font-semibold">{employee.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{employee.position}</p>
                <div className="mt-3">
                  <StatusBadge status={getEmployeeStatusForDate(employee, data.employeeShifts, today) === "working" ? "active" : getEmployeeStatusForDate(employee, data.employeeShifts, today)} />
                </div>
              </div>
              <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-7">
                {weekDays.map((day) => {
                  const shift = shiftByEmployeeAndDate.get(`${employee.id}-${day.date}`);
                  const status = getEmployeeStatusForDate(employee, data.employeeShifts, day.date);
                  return (
                    <button
                      key={day.date}
                      type="button"
                      className="min-h-28 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/40"
                      onClick={() => openShift(employee, day.date)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{day.weekday}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(day.date, "d MMMM")}</p>
                        </div>
                        <StatusBadge status={status === "working" ? "active" : status} />
                      </div>
                      <p className="mt-4 text-sm font-medium">{getShiftLabel(shift)}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {shift?.comment || (shift ? "Комментарий не указан" : employee.schedule)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={form.id ? "Редактировать смену" : "Добавить смену"}
        description={form.date ? formatDate(form.date, "d MMMM yyyy") : undefined}
        footer={
          <>
            {form.id ? (
              <Button type="button" variant="destructive" onClick={removeShift}>
                Удалить
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={saveShift}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="shift-employee">Сотрудник</Label>
            <Select
              id="shift-employee"
              value={form.employeeId}
              onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shift-date">Дата</Label>
            <Input
              id="shift-date"
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="shift-type">Тип дня</Label>
            <Select
              id="shift-type"
              value={form.type}
              onChange={(event) => {
                const type = event.target.value as EmployeeShiftType;
                setForm({
                  ...form,
                  type,
                  startTime: type === "work" ? form.startTime || "09:00" : "",
                  endTime: type === "work" ? form.endTime || "18:00" : ""
                });
              }}
            >
              {shiftTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          {form.type === "work" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="shift-start">Начало</Label>
                <Input id="shift-start" type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift-end">Конец</Label>
                <Input id="shift-end" type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} />
              </div>
            </>
          ) : null}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="shift-comment">Комментарий</Label>
            <Textarea id="shift-comment" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} placeholder="Причина, примечание или замена" />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function getWeekDays() {
  const formatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const key = getLocalDateKey(date);
    return {
      date: key,
      weekday: formatter.format(date)
    };
  });
}

function createShiftForm(employeeId: string, date: string, employeeSchedule = "09:00-18:00"): ShiftForm {
  const [startTime = "09:00", endTime = "18:00"] = employeeSchedule.split("-");
  return {
    employeeId,
    date,
    type: "work",
    startTime,
    endTime,
    comment: ""
  };
}

function shiftToForm(shift: EmployeeShift): ShiftForm {
  return {
    id: shift.id,
    employeeId: shift.employeeId,
    date: shift.date,
    type: shift.type,
    startTime: shift.startTime || "09:00",
    endTime: shift.endTime || "18:00",
    comment: shift.comment
  };
}

function isValidWorkTime(startTime: string, endTime: string) {
  return Boolean(startTime && endTime && startTime < endTime);
}
