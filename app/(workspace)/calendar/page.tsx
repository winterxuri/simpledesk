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
import { formatCurrency } from "@/lib/utils";
import type { Appointment } from "@/types";

const viewTabs = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" }
];

const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function CalendarPage() {
  const storeData = useAppStore((state) => state.data);
  const company = useAppStore((state) => state.company);
  const addAppointment = useAppStore((state) => state.addAppointment);
  const [view, setView] = useState("day");
  const [appointments, setAppointments] = useState(storeData.appointments);
  const [slot, setSlot] = useState<{ time: string; employeeId: string } | null>(null);
  const [form, setForm] = useState({
    clientId: storeData.clients[0]?.id ?? "",
    title: "",
    price: "2500",
    comment: ""
  });
  const today = new Date().toISOString().slice(0, 10);
  const employees = storeData.employees.slice(0, 5);

  const byEmployeeAndTime = useMemo(() => {
    const map = new Map<string, Appointment>();
    appointments
      .filter((appointment) => appointment.date === today)
      .forEach((appointment) => {
        map.set(`${appointment.employeeId}-${appointment.time.slice(0, 5)}`, appointment);
      });
    return map;
  }, [appointments, today]);

  function createAppointment() {
    if (!slot) {
      return;
    }
    const appointment = {
      clientId: form.clientId,
      employeeId: slot.employeeId,
      resourceId: storeData.resources[0]?.id,
      title: form.title || `Новая ${company.terminology.appointment}`,
      date: today,
      time: slot.time,
      duration: 60,
      price: Number(form.price) || 0,
      status: "planned" as const,
      paid: false,
      comment: form.comment
    };
    addAppointment(appointment);
    setAppointments((current) => [{ ...appointment, id: `local-${Date.now()}` }, ...current]);
    setSlot(null);
  }

  return (
    <div>
      <PageHeader
        title="Календарь и записи"
        description="Переключайте вид, создавайте записи по свободным слотам и переносите карточки между сотрудниками."
        actions={
          <div className="flex gap-2">
            <Tabs items={viewTabs} value={view} onValueChange={setView} />
            <Button type="button" onClick={() => setSlot({ time: "12:00", employeeId: employees[0]?.id ?? "employee-1" })}>
              <Plus className="h-4 w-4" />
              Создать запись
            </Button>
          </div>
        }
      />

      {view === "month" ? (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 30 }, (_, index) => (
            <div key={index} className="min-h-28 rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-medium">{index + 1} июля</p>
              <p className="mt-2 text-xs text-muted-foreground">{(index % 5) + 2} записей</p>
            </div>
          ))}
        </div>
      ) : (
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
                      onClick={() => !appointment && setSlot({ time, employeeId: employee.id })}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        const id = event.dataTransfer.getData("appointment-id");
                        setAppointments((current) =>
                          current.map((item) =>
                            item.id === id
                              ? { ...item, time, employeeId: employee.id }
                              : item
                          )
                        );
                      }}
                      className="min-h-24 border-l border-border p-2 text-left hover:bg-muted/40"
                    >
                      {appointment ? (
                        <div
                          draggable
                          onDragStart={(event) => event.dataTransfer.setData("appointment-id", appointment.id)}
                          className="rounded-lg border border-primary/20 bg-accent p-3 text-accent-foreground"
                        >
                          <p className="font-medium">{appointment.title}</p>
                          <p className="mt-1 text-xs">
                            {storeData.clients.find((client) => client.id === appointment.clientId)?.name}
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
      )}

      <Dialog
        open={Boolean(slot)}
        onOpenChange={(open) => !open && setSlot(null)}
        title={`Создать ${company.terminology.appointment}`}
        description={slot ? `${slot.time}, ${employees.find((employee) => employee.id === slot.employeeId)?.name}` : undefined}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSlot(null)}>
              Отмена
            </Button>
            <Button type="button" onClick={createAppointment}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Клиент</Label>
            <Select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
              {storeData.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{company.terminology.service}</Label>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input value={today} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Стоимость</Label>
              <Input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </div>
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
