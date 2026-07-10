"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { EmptyState } from "@/components/modules/empty-state";
import { useAppStore } from "@/store/app-store";
import { getScopedWorkspaceData } from "@/lib/employee-scope";
import { canPerformAction } from "@/lib/permissions";
import { formatCurrency, formatDate, getLocalDateKey } from "@/lib/utils";
import type { Appointment, ClientStatus, FinancialOperation, Sale, Task } from "@/types";

const tabs = [
  { value: "overview", label: "Обзор" },
  { value: "history", label: "История" },
  { value: "appointments", label: "Записи" },
  { value: "payments", label: "Оплаты" },
  { value: "notes", label: "Заметки" },
  { value: "files", label: "Файлы" }
];

const statusOptions: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Активный" },
  { value: "new", label: "Новый" },
  { value: "loyal", label: "Постоянный" },
  { value: "inactive", label: "Давно не возвращался" },
  { value: "attention", label: "Требует внимания" }
];

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    status: "active" as ClientStatus,
    responsibleId: "",
    nextAppointment: "",
    totalSpent: "0",
    visits: "0",
    source: "",
    notes: ""
  });
  const data = useAppStore((state) => state.data);
  const company = useAppStore((state) => state.company);
  const user = useAppStore((state) => state.user);
  const role = useAppStore((state) => state.role);
  const updateClient = useAppStore((state) => state.updateClient);
  const addToast = useAppStore((state) => state.addToast);
  const canManageClients = canPerformAction(role, "manageClients");
  const scopedData = useMemo(() => getScopedWorkspaceData(data, user, role), [data, role, user]);
  const sourceClient = data.clients.find((item) => item.id === params.id);
  const client = role === "employee"
    ? scopedData.clients.find((item) => item.id === params.id)
    : sourceClient;
  const visibleTabs = useMemo(
    () =>
      canManageClients
        ? tabs
        : tabs.filter((item) => item.value !== "payments" && item.value !== "files"),
    [canManageClients]
  );

  useEffect(() => {
    if (!visibleTabs.some((item) => item.value === tab)) {
      setTab("overview");
    }
  }, [tab, visibleTabs]);

  if (!client) {
    return (
      <EmptyState
        title={sourceClient && role === "employee" ? "Клиент недоступен" : "Клиент не найден"}
        description={
          sourceClient && role === "employee"
            ? "Эта карточка не связана с вашими записями или задачами."
            : "Проверьте ссылку или вернитесь к списку клиентов."
        }
        actionLabel="К списку клиентов"
        onAction={() => window.location.assign("/clients")}
      />
    );
  }

  const currentClient = client;
  const visibleEmployees = canManageClients ? data.employees : scopedData.employees;
  const responsible = visibleEmployees.find((employee) => employee.id === currentClient.responsibleId);
  const appointments = scopedData.appointments.filter((appointment) => appointment.clientId === currentClient.id);
  const tasks = scopedData.tasks.filter((task) => task.clientId === currentClient.id);
  const sales = canManageClients
    ? (data.sales ?? []).filter((sale) => sale.clientId === currentClient.id)
    : [];
  const saleOperationIds = new Set(sales.flatMap((sale) => sale.financialOperationId ? [sale.financialOperationId] : []));
  const financialOperations = canManageClients
    ? data.financialOperations.filter(
        (operation) => operation.clientId === currentClient.id && !saleOperationIds.has(operation.id)
      )
    : [];
  const employeeNames = new Map(data.employees.map((employee) => [employee.id, employee.name]));
  const timelineEvents = buildClientTimeline({
    appointments,
    financialOperations,
    sales,
    tasks,
    employeeNames
  });
  const contactDescription = [client.phone, client.email].filter(Boolean).join(" · ") || "Контакты не указаны";

  function openEdit() {
    setEditForm({
      name: currentClient.name,
      phone: currentClient.phone,
      email: currentClient.email,
      status: currentClient.status,
      responsibleId: currentClient.responsibleId,
      nextAppointment: currentClient.nextAppointment ?? "",
      totalSpent: String(currentClient.totalSpent),
      visits: String(currentClient.visits),
      source: currentClient.source,
      notes: currentClient.notes
    });
    setEditOpen(true);
  }

  function saveEdit() {
    const name = editForm.name.trim();
    const phone = editForm.phone.trim();
    const email = editForm.email.trim();

    if (!name) {
      addToast({
        title: "Укажите ФИО клиента",
        description: "Карточка клиента не должна сохраняться без имени.",
        variant: "warning"
      });
      return;
    }

    if (!phone && !email) {
      addToast({
        title: "Добавьте контакт клиента",
        description: "Нужен телефон или email, чтобы связаться с клиентом.",
        variant: "warning"
      });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast({
        title: "Email выглядит некорректно",
        description: "Проверьте адрес или оставьте поле пустым.",
        variant: "warning"
      });
      return;
    }

    updateClient(currentClient.id, {
      name,
      phone,
      email,
      status: editForm.status,
      responsibleId: editForm.responsibleId,
      nextAppointment: editForm.nextAppointment || undefined,
      totalSpent: Number(editForm.totalSpent) || 0,
      visits: Number(editForm.visits) || 0,
      source: editForm.source,
      notes: editForm.notes
    });
    setEditOpen(false);
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        description={contactDescription}
        actions={
          <div className="flex gap-2">
            {canManageClients ? (
            <Button type="button" onClick={openEdit}>
              Редактировать
            </Button>
            ) : null}
            <Button type="button" variant="outline" asChild>
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Link>
            </Button>
          </div>
        }
      />

      <div className={`grid gap-4 ${canManageClients ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Статус</p>
          <div className="mt-2"><StatusBadge status={client.status} /></div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ответственный</p>
          <p className="mt-2 font-semibold">
            {responsible?.name ?? (role === "employee" ? "другой ответственный" : "не назначен")}
          </p>
        </Card>
        {canManageClients ? (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Общая сумма</p>
            <p className="mt-2 font-semibold">{formatCurrency(client.totalSpent)}</p>
          </Card>
        ) : null}
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Визитов</p>
          <p className="mt-2 font-semibold">{client.visits}</p>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs items={visibleTabs} value={tab} onValueChange={setTab} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          {tab === "overview" ? (
            <div>
              <h2 className="text-lg font-semibold">Сводка</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Дата последнего обращения" value={formatDate(client.lastVisit)} />
                <Info
                  label={`Следующая ${company.terminology.appointment}`}
                  value={client.nextAppointment ? formatDate(client.nextAppointment) : "не назначена"}
                />
                <Info label="Источник" value={client.source} />
                <Info label="Заметка" value={client.notes} />
              </div>
            </div>
          ) : null}
          {tab === "history" ? <Timeline events={timelineEvents} /> : null}
          {tab === "appointments" ? (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{appointment.title}</p>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(appointment.date)} · {appointment.time} · {formatCurrency(appointment.price)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {canManageClients && tab === "payments" ? (
            <div className="space-y-3">
              {appointments.slice(0, 4).map((appointment) => (
                <Info
                  key={appointment.id}
                  label={appointment.title}
                  value={`${formatCurrency(appointment.price)} · ${appointment.paid ? "оплачено" : "ожидает оплаты"}`}
                />
              ))}
            </div>
          ) : null}
          {tab === "notes" ? <p className="text-sm text-muted-foreground">{client.notes}</p> : null}
          {canManageClients && tab === "files" ? (
            <EmptyState
              icon="Download"
              title="Файлов пока нет"
              description="В реальном продукте здесь появятся договоры, фото и вложения."
            />
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold">Временная шкала</h2>
            <Timeline events={timelineEvents} compact />
          </Card>
        </div>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Редактировать клиента"
        description="Изменения сохраняются в текущем рабочем пространстве."
        className="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={saveEdit}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input type="tel" value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Источник</Label>
              <Input value={editForm.source} onChange={(event) => setEditForm({ ...editForm, source: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value as ClientStatus })}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ответственный</Label>
              <Select value={editForm.responsibleId} onChange={(event) => setEditForm({ ...editForm, responsibleId: event.target.value })}>
                {data.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Следующая {company.terminology.appointment}</Label>
              <Input type="date" min={getLocalDateKey()} value={editForm.nextAppointment} onChange={(event) => setEditForm({ ...editForm, nextAppointment: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Общая сумма</Label>
              <Input value={editForm.totalSpent} onChange={(event) => setEditForm({ ...editForm, totalSpent: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Визитов</Label>
              <Input value={editForm.visits} onChange={(event) => setEditForm({ ...editForm, visits: event.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Заметка</Label>
            <Textarea value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

type ClientTimelineEvent = {
  id: string;
  date: string;
  time?: string;
  title: string;
  description: string;
  amount?: number;
  status?: string;
  type: "appointment" | "sale" | "finance" | "task";
};

const timelineTypeLabels: Record<ClientTimelineEvent["type"], string> = {
  appointment: "Запись",
  sale: "Продажа",
  finance: "Финансы",
  task: "Задача"
};

const paymentMethodLabels = {
  cash: "наличные",
  card: "карта",
  transfer: "перевод",
  online: "онлайн",
  mixed: "смешанная оплата"
};

const paymentStatusLabels = {
  paid: "оплачено",
  partial: "частично оплачено",
  unpaid: "не оплачено",
  refunded: "возврат"
};

const priorityLabels = {
  low: "низкий приоритет",
  medium: "средний приоритет",
  high: "высокий приоритет"
};

function Timeline({ events, compact = false }: { events: ClientTimelineEvent[]; compact?: boolean }) {
  if (events.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        История пока пустая. Здесь появятся записи, продажи, оплаты и задачи, связанные с клиентом.
      </div>
    );
  }

  return (
    <div className={compact ? "mt-4 space-y-3" : "mt-4 space-y-4"}>
      {events.map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{event.title}</p>
              {!compact ? <span className="text-xs text-muted-foreground">{timelineTypeLabels[event.type]}</span> : null}
              {event.status ? <StatusBadge status={event.status} /> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{formatTimelineDate(event)}</span>
              {event.amount !== undefined ? <span>{formatCurrency(event.amount)}</span> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildClientTimeline({
  appointments,
  financialOperations,
  sales,
  tasks,
  employeeNames
}: {
  appointments: Appointment[];
  financialOperations: FinancialOperation[];
  sales: Sale[];
  tasks: Task[];
  employeeNames: Map<string, string>;
}): ClientTimelineEvent[] {
  const appointmentEvents = appointments.map((appointment): ClientTimelineEvent => {
    const employeeName = employeeNames.get(appointment.employeeId);
    const details = [
      appointment.time,
      `${appointment.duration} мин.`,
      employeeName,
      appointment.comment,
      appointment.cancellationReason ? `Причина отмены: ${appointment.cancellationReason}` : undefined
    ].filter(Boolean);

    return {
      id: `appointment-${appointment.id}`,
      type: "appointment",
      title: appointment.title,
      description: details.join(" · "),
      date: appointment.date,
      time: appointment.time,
      amount: appointment.price,
      status: appointment.status
    };
  });

  const saleEvents = sales.map((sale): ClientTimelineEvent => {
    const amount = getSaleNetAmount(sale);
    const paymentMethod = paymentMethodLabels[sale.paymentMethod] ?? "оплата не указана";
    const paymentStatus = paymentStatusLabels[sale.paymentStatus] ?? "";
    const quantity = sale.quantity ? `${formatQuantity(Math.max(0, sale.quantity - (sale.refundedQuantity ?? 0)))} шт.` : "ручная продажа";
    const details = [
      sale.category,
      quantity,
      paymentMethod,
      paymentStatus,
      sale.comment,
      sale.cancelReason ? `Причина: ${sale.cancelReason}` : undefined
    ].filter(Boolean);

    return {
      id: `sale-${sale.id}`,
      type: "sale",
      title: sale.productName || sale.category || "Продажа",
      description: details.join(" · "),
      date: sale.date,
      amount,
      status: sale.status
    };
  });

  const financeEvents = financialOperations.map((operation): ClientTimelineEvent => {
    const paymentMethod = operation.paymentMethod ? paymentMethodLabels[operation.paymentMethod] : undefined;
    const details = [
      operation.type === "income" ? "доход" : "расход",
      paymentMethod,
      operation.comment
    ].filter(Boolean);

    return {
      id: `finance-${operation.id}`,
      type: "finance",
      title: operation.category,
      description: details.join(" · "),
      date: operation.date,
      amount: operation.type === "income" ? operation.amount : -operation.amount
    };
  });

  const taskEvents = tasks.map((task): ClientTimelineEvent => {
    const employeeName = employeeNames.get(task.responsibleId);
    const checklistDone = task.checklist.filter((item) => item.done).length;
    const checklistSummary = task.checklist.length
      ? `чек-лист ${checklistDone}/${task.checklist.length}`
      : undefined;
    const details = [
      task.description,
      employeeName,
      priorityLabels[task.priority],
      checklistSummary
    ].filter(Boolean);

    return {
      id: `task-${task.id}`,
      type: "task",
      title: task.title,
      description: details.join(" · "),
      date: task.dueDate,
      status: task.status
    };
  });

  return [...appointmentEvents, ...saleEvents, ...financeEvents, ...taskEvents].sort(compareTimelineEvents);
}

function compareTimelineEvents(first: ClientTimelineEvent, second: ClientTimelineEvent) {
  return getTimelineSortKey(second).localeCompare(getTimelineSortKey(first));
}

function getTimelineSortKey(event: ClientTimelineEvent) {
  return `${event.date}T${event.time ?? "23:59"}`;
}

function formatTimelineDate(event: ClientTimelineEvent) {
  return event.time ? `${formatDate(event.date)} · ${event.time}` : formatDate(event.date);
}

function getSaleNetAmount(sale: Sale) {
  return Math.max(0, sale.amount - (sale.refundedAmount ?? 0));
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
