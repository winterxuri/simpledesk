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
import type { ClientStatus } from "@/types";

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
  const addTask = useAppStore((state) => state.addTask);
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

  function runRecommendedAction(action: string) {
    if (!canManageClients) {
      addToast({
        title: "Недостаточно прав",
        description: "Эти действия доступны владельцу или администратору.",
        variant: "warning"
      });
      return;
    }

    if (action === "Напомнить о повторном визите") {
      updateClient(currentClient.id, { status: "attention" });
      addToast({
        title: "Клиент помечен",
        description: "Статус изменён на «требует внимания».",
        variant: "success"
      });
      return;
    }
    if (action === "Назначить задачу") {
      addTask({
        title: `Связаться с ${currentClient.name}`,
        description: "Уточнить повторный визит и предложить удобное время.",
        responsibleId: currentClient.responsibleId || data.employees[0]?.id || "employee-1",
        dueDate: getLocalDateKey(),
        priority: "medium",
        status: "new",
        clientId: currentClient.id,
        checklist: [{ title: "Позвонить или написать клиенту", done: false }]
      });
      addToast({
        title: "Задача создана",
        description: "Задача добавлена в раздел задач.",
        variant: "success"
      });
      return;
    }
    addToast({
      title: action,
      description: "Действие зафиксировано в текущем рабочем пространстве.",
      variant: "info"
    });
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
          {tab === "history" ? <Timeline clientName={client.name} /> : null}
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
          {canManageClients ? (
          <Card className="p-5">
            <h2 className="font-semibold">Рекомендуемое действие</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Клиенту можно напомнить о повторном визите и предложить персональную акцию.
            </p>
            <div className="mt-4 grid gap-2">
              {["Напомнить о повторном визите", "Предложить акцию", "Связаться", "Назначить задачу"].map((action) => (
                <Button key={action} type="button" variant="outline" onClick={() => runRecommendedAction(action)}>
                  {action}
                </Button>
              ))}
            </div>
          </Card>
          ) : null}
          <Card className="p-5">
            <h2 className="font-semibold">Временная шкала</h2>
            <Timeline clientName={client.name} compact showFinancial={canManageClients} />
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

function Timeline({
  clientName,
  compact = false,
  showFinancial = true
}: {
  clientName: string;
  compact?: boolean;
  showFinancial?: boolean;
}) {
  const items = showFinancial
    ? [
        `${clientName} подтвердил запись`,
        "Администратор добавил заметку",
        "Создана задача на повторный контакт",
        "Оплата за услугу получена"
      ]
    : [
        `${clientName} подтвердил запись`,
        "Добавлена рабочая заметка",
        "Создана задача по клиенту"
      ];

  return (
    <div className={compact ? "mt-4 space-y-3" : "mt-4 space-y-4"}>
      {items.map((item, index) => (
        <div key={item} className="flex gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
          <div>
            <p className="text-sm font-medium">{item}</p>
            <p className="text-xs text-muted-foreground">{index + 1} дня назад</p>
          </div>
        </div>
      ))}
    </div>
  );
}
