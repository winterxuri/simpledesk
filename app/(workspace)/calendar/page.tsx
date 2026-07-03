"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { canPerformAction } from "@/lib/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Appointment } from "@/types";

const viewTabs = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" }
];

const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const statusOptions: { value: Appointment["status"]; label: string }[] = [
  { value: "planned", label: "Запланирована" },
  { value: "confirmed", label: "Подтверждена" },
  { value: "inProgress", label: "В работе" },
  { value: "completed", label: "Завершена" },
  { value: "cancelled", label: "Отменена" },
  { value: "noShow", label: "Неявка" }
];

type AppointmentForm = {
  id?: string;
  clientId: string;
  employeeId: string;
  date: string;
  time: string;
  title: string;
  duration: string;
  price: string;
  status: Appointment["status"];
  paid: boolean;
  comment: string;
};

function isoDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toDateInput(date);
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pluralRecords(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} запись`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} записи`;
  }
  return `${count} записей`;
}

export default function CalendarPage() {
  const data = useAppStore((state) => state.data);
  const company = useAppStore((state) => state.company);
  const role = useAppStore((state) => state.role);
  const addAppointment = useAppStore((state) => state.addAppointment);
  const updateAppointment = useAppStore((state) => state.updateAppointment);
  const addToast = useAppStore((state) => state.addToast);
  const [view, setView] = useState("day");
  const [dialogOpen, setDialogOpen] = useState(false);
  const today = isoDate();
  const employees = data.employees.slice(0, 5);
  const [form, setForm] = useState<AppointmentForm>(() => createEmptyForm(data, today, employees[0]?.id));
  const canManageAppointments = canPerformAction(role, "manageAppointments");

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => isoDate(index)),
    []
  );

  const monthDays = useMemo(() => {
    const base = new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, index) =>
      toDateInput(new Date(year, month, index + 1))
    );
  }, []);

  const byEmployeeAndTime = useMemo(() => {
    const map = new Map<string, Appointment>();
    data.appointments
      .filter((appointment) => appointment.date === today)
      .forEach((appointment) => {
        map.set(`${appointment.employeeId}-${appointment.time.slice(0, 5)}`, appointment);
      });
    return map;
  }, [data.appointments, today]);

  function openCreate(slot?: { time: string; employeeId: string; date?: string }) {
    if (!canManageAppointments) {
      addToast({
        title: "Недостаточно прав",
        description: "Создание и перенос записей доступны владельцу или администратору.",
        variant: "warning"
      });
      return;
    }

    setForm(createEmptyForm(data, slot?.date ?? today, slot?.employeeId ?? employees[0]?.id, slot?.time));
    setDialogOpen(true);
  }

  function openEdit(appointment: Appointment) {
    if (!canManageAppointments) {
      return;
    }

    setForm({
      id: appointment.id,
      clientId: appointment.clientId,
      employeeId: appointment.employeeId,
      date: appointment.date,
      time: appointment.time.slice(0, 5),
      title: appointment.title,
      duration: String(appointment.duration),
      price: String(appointment.price),
      status: appointment.status,
      paid: appointment.paid,
      comment: appointment.comment ?? ""
    });
    setDialogOpen(true);
  }

  function saveAppointment() {
    const title = form.title.trim();
    const duration = Number(form.duration);
    const price = Number(form.price);

    if (!form.clientId) {
      addToast({
        title: "Выберите клиента",
        description: "Сначала добавьте клиента или выберите существующего из списка.",
        variant: "warning"
      });
      return;
    }

    if (!form.employeeId) {
      addToast({
        title: "Выберите сотрудника",
        description: "Запись должна быть назначена на конкретного сотрудника.",
        variant: "warning"
      });
      return;
    }

    if (!title) {
      addToast({
        title: "Укажите услугу или работу",
        description: "Название нужно для календаря, карточки клиента и отчётов.",
        variant: "warning"
      });
      return;
    }

    if (!form.date || !form.time) {
      addToast({
        title: "Укажите дату и время",
        description: "Без даты и времени запись нельзя поставить в расписание.",
        variant: "warning"
      });
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      addToast({
        title: "Длительность некорректна",
        description: "Введите длительность в минутах больше нуля.",
        variant: "warning"
      });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      addToast({
        title: "Стоимость некорректна",
        description: "Стоимость не может быть отрицательной.",
        variant: "warning"
      });
      return;
    }

    const payload = {
      clientId: form.clientId,
      employeeId: form.employeeId,
      resourceId: data.resources[0]?.id,
      title,
      date: form.date,
      time: form.time,
      duration,
      price,
      status: form.status,
      paid: form.paid,
      comment: form.comment
    };

    if (form.id) {
      updateAppointment(form.id, payload);
    } else {
      addAppointment(payload);
    }
    setDialogOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Календарь и записи"
        description="Создавайте записи, переносите их между временем и сотрудниками, редактируйте данные по клику."
        actions={
          <div className="flex gap-2">
            <Tabs items={viewTabs} value={view} onValueChange={setView} />
            {canManageAppointments ? (
            <Button type="button" onClick={() => openCreate({ time: "12:00", employeeId: employees[0]?.id ?? "employee-1" })}>
              <Plus className="h-4 w-4" />
              Создать запись
            </Button>
            ) : null}
          </div>
        }
      />

      {view === "month" ? (
        <div className="grid gap-3 md:grid-cols-7">
          {monthDays.map((date) => {
            const dayAppointments = data.appointments.filter((appointment) => appointment.date === date);
            return (
              <button
                key={date}
                type="button"
                disabled={!canManageAppointments}
                onClick={() => openCreate({ date, time: "12:00", employeeId: employees[0]?.id ?? "employee-1" })}
                className="min-h-28 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/35 disabled:cursor-default disabled:hover:bg-card"
              >
                <p className="text-sm font-medium">{formatDate(date, "d MMMM")}</p>
                <p className="mt-2 text-xs text-muted-foreground">{pluralRecords(dayAppointments.length)}</p>
                <div className="mt-3 space-y-1">
                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <span key={appointment.id} className="block truncate rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
                      {appointment.time} · {appointment.title}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {view === "week" ? (
        <div className="grid gap-3 lg:grid-cols-7">
          {weekDays.map((date) => {
            const dayAppointments = data.appointments.filter((appointment) => appointment.date === date);
            return (
              <div key={date} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{formatDate(date, "EEEEEE")}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(date, "d MMMM")}</p>
                  </div>
                  {canManageAppointments ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => openCreate({ date, time: "12:00", employeeId: employees[0]?.id ?? "employee-1" })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{pluralRecords(dayAppointments.length)}</p>
                <div className="mt-3 space-y-2">
                  {dayAppointments.slice(0, 5).map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => openEdit(appointment)}
                      className="w-full rounded-lg border border-border bg-background p-2 text-left text-xs transition-colors hover:bg-muted/50"
                    >
                      <p className="font-medium">{appointment.time} · {appointment.title}</p>
                      <p className="mt-1 truncate text-muted-foreground">
                        {data.clients.find((client) => client.id === appointment.clientId)?.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "day" ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid min-w-[900px] grid-cols-[96px_repeat(5,minmax(150px,1fr))] border-b border-border bg-muted/50">
            <div className="p-3 text-sm font-medium">Время</div>
            {employees.map((employee) => (
              <div key={employee.id} className="border-l border-border p-3">
                <p className="font-medium">{employee.name}</p>
                <p className="text-xs text-muted-foreground">{employee.position}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            {slots.map((time) => (
              <div key={time} className="grid min-w-[900px] grid-cols-[96px_repeat(5,minmax(150px,1fr))] border-b border-border last:border-b-0">
                <div className="bg-muted/30 p-3 text-sm text-muted-foreground">{time}</div>
                {employees.map((employee) => {
                  const appointment = byEmployeeAndTime.get(`${employee.id}-${time}`);
                  return (
                    <button
                      key={`${employee.id}-${time}`}
                      type="button"
                      onClick={() => appointment ? openEdit(appointment) : openCreate({ time, employeeId: employee.id })}
                      disabled={!canManageAppointments}
                      onDragOver={(event) => {
                        if (canManageAppointments) {
                          event.preventDefault();
                        }
                      }}
                      onDrop={(event) => {
                        if (!canManageAppointments) {
                          return;
                        }
                        const id = event.dataTransfer.getData("appointment-id");
                        if (id) {
                          updateAppointment(id, { time, employeeId: employee.id, date: today });
                        }
                      }}
                      className="min-h-24 border-l border-border p-2 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
                    >
                      {appointment ? (
                        <div
                          draggable
                          onDragStart={(event) => {
                            if (canManageAppointments) {
                              event.dataTransfer.setData("appointment-id", appointment.id);
                            }
                          }}
                          className="rounded-lg border border-primary/20 bg-accent p-3 text-accent-foreground"
                        >
                          <p className="font-medium">{appointment.title}</p>
                          <p className="mt-1 text-xs">
                            {data.clients.find((client) => client.id === appointment.clientId)?.name}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <StatusBadge status={appointment.status} />
                            <span className="text-xs">{formatCurrency(appointment.price)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Свободное окно</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={form.id ? `Редактировать ${company.terminology.appointment}` : `Создать ${company.terminology.appointment}`}
        description={`${formatDate(form.date)} · ${form.time}`}
        className="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={saveAppointment}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Клиент</Label>
              <Select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
                {data.clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Специалист</Label>
              <Select value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}>
                {data.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{company.terminology.service}</Label>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Время</Label>
              <Input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Длительность, мин</Label>
              <Input type="number" min="1" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Стоимость</Label>
              <Input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Appointment["status"] })}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
            <label className="flex items-end gap-2 rounded-lg border border-border p-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={form.paid}
                onChange={(event) => setForm({ ...form, paid: event.target.checked })}
              />
              Оплачено
            </label>
          </div>
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function createEmptyForm(
  data: ReturnType<typeof useAppStore.getState>["data"],
  date: string,
  employeeId = "employee-1",
  time = "12:00"
): AppointmentForm {
  return {
    clientId: data.clients[0]?.id ?? "",
    employeeId,
    date,
    time,
    title: "",
    duration: "60",
    price: "2500",
    status: "planned",
    paid: false,
    comment: ""
  };
}
