"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/modules/empty-state";
import { PageHeader } from "@/components/modules/page-header";
import { SearchAndFilters } from "@/components/modules/search-and-filters";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatDate, getLocalDateKey } from "@/lib/utils";
import type { Appointment, Resource, ResourceStatus } from "@/types";

const statusOptions: { value: ResourceStatus; label: string }[] = [
  { value: "free", label: "Свободен" },
  { value: "busy", label: "Занят" },
  { value: "maintenance", label: "Обслуживание" },
  { value: "unavailable", label: "Недоступен" }
];

const defaultResourceTypes = [
  "кабинет",
  "рабочее место",
  "пост",
  "зал",
  "оборудование",
  "складская зона"
];

function createEmptyResourceForm(type = "кабинет") {
  return {
    name: "",
    type,
    status: "free" as ResourceStatus,
    loadPercent: "0",
    condition: "исправно",
    comment: ""
  };
}

function resourceToForm(resource: Resource) {
  return {
    name: resource.name,
    type: resource.type,
    status: resource.status,
    loadPercent: String(resource.loadPercent),
    condition: resource.condition,
    comment: resource.comment
  };
}

export default function ResourcesPage() {
  const data = useAppStore((state) => state.data);
  const addResource = useAppStore((state) => state.addResource);
  const updateResource = useAppStore((state) => state.updateResource);
  const addToast = useAppStore((state) => state.addToast);
  const resources = data.resources;
  const today = getLocalDateKey();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState<Resource | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(() => createEmptyResourceForm());

  const resourceTypes = useMemo(
    () => Array.from(new Set([...defaultResourceTypes, ...resources.map((resource) => resource.type).filter(Boolean)])),
    [resources]
  );

  const bookingsByResource = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    data.appointments
      .filter((appointment) => appointment.resourceId)
      .forEach((appointment) => {
        map.set(appointment.resourceId ?? "", [
          ...(map.get(appointment.resourceId ?? "") ?? []),
          appointment
        ]);
      });
    return map;
  }, [data.appointments]);

  const filteredResources = useMemo(() => {
    const query = search.toLowerCase();
    return resources
      .filter((resource) =>
        [resource.name, resource.type, resource.condition, resource.comment].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
      .filter((resource) => status === "all" || resource.status === status)
      .filter((resource) => type === "all" || resource.type === type)
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [resources, search, status, type]);

  const summary = useMemo(() => {
    const averageLoad = resources.length
      ? Math.round(resources.reduce((sum, resource) => sum + resource.loadPercent, 0) / resources.length)
      : 0;

    return {
      total: resources.length,
      free: resources.filter((resource) => resource.status === "free").length,
      busy: resources.filter((resource) => resource.status === "busy").length,
      maintenance: resources.filter((resource) => resource.status === "maintenance").length,
      unavailable: resources.filter((resource) => resource.status === "unavailable").length,
      averageLoad
    };
  }, [resources]);

  const selectedBookings = selected
    ? getResourceBookings(selected, bookingsByResource, today)
    : [];

  function openCreate() {
    setSelected(null);
    setForm(createEmptyResourceForm(resourceTypes[0] ?? "кабинет"));
    setDialogOpen(true);
  }

  function openResource(resource: Resource) {
    setSelected(resource);
    setForm(resourceToForm(resource));
    setDialogOpen(true);
  }

  function saveResource() {
    const name = form.name.trim();
    const resourceType = form.type.trim();
    const loadPercent = Number(form.loadPercent);

    if (!name) {
      addToast({
        title: "Укажите название",
        description: "Название нужно для записи, расписания и поиска ресурса.",
        variant: "warning"
      });
      return;
    }

    if (!resourceType) {
      addToast({
        title: "Укажите тип",
        description: "Тип помогает отделить кабинеты, посты, залы и оборудование.",
        variant: "warning"
      });
      return;
    }

    if (!Number.isFinite(loadPercent) || loadPercent < 0 || loadPercent > 100) {
      addToast({
        title: "Проверьте загрузку",
        description: "Загрузка должна быть числом от 0 до 100.",
        variant: "warning"
      });
      return;
    }

    const payload: Omit<Resource, "id"> = {
      name,
      type: resourceType,
      status: form.status,
      loadPercent,
      futureBookings: selected ? selected.futureBookings : 0,
      condition: form.condition.trim() || "не указано",
      comment: form.comment.trim()
    };

    if (selected) {
      updateResource(selected.id, payload);
      setSelected({ ...selected, ...payload });
      addToast({ title: "Ресурс обновлён", variant: "success" });
    } else {
      addResource(payload);
      addToast({ title: "Ресурс добавлен", variant: "success" });
      setDialogOpen(false);
    }
  }

  function setResourceStatus(nextStatus: ResourceStatus) {
    setForm((current) => ({
      ...current,
      status: nextStatus,
      loadPercent:
        nextStatus === "free"
          ? "0"
          : nextStatus === "busy"
            ? current.loadPercent === "0" ? "100" : current.loadPercent
            : current.loadPercent
    }));
  }

  return (
    <div>
      <PageHeader
        title="Помещения и оборудование"
        description="Управляйте кабинетами, постами, залами и техникой, которые нужно бронировать вместе с записью."
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Добавить ресурс
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Всего" value={String(summary.total)} />
        <SummaryCard label="Свободно" value={String(summary.free)} />
        <SummaryCard label="Занято" value={String(summary.busy)} />
        <SummaryCard label="Обслуживание" value={String(summary.maintenance)} />
        <SummaryCard label="Недоступно" value={String(summary.unavailable)} />
        <SummaryCard label="Средняя загрузка" value={`${summary.averageLoad}%`} />
      </div>

      <SearchAndFilters
        search={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Статус",
            value: status,
            onChange: setStatus,
            options: [
              { value: "all", label: "Все статусы" },
              ...statusOptions
            ]
          },
          {
            label: "Тип",
            value: type,
            onChange: setType,
            options: [
              { value: "all", label: "Все типы" },
              ...resourceTypes.map((item) => ({ value: item, label: item }))
            ]
          }
        ]}
      />

      {filteredResources.length === 0 ? (
        <EmptyState
          icon="Wrench"
          title={resources.length ? "Ресурсы не найдены" : "Помещения и оборудование не добавлены"}
          description={
            resources.length
              ? "Измените поиск или фильтры, чтобы увидеть нужные ресурсы."
              : "Добавьте кабинеты, посты, залы, технику или оборудование, если записи зависят от ограниченного ресурса."
          }
          actionLabel="Добавить ресурс"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => {
            const bookings = getResourceBookings(resource, bookingsByResource, today);
            return (
              <button
                key={resource.id}
                type="button"
                className="text-left"
                onClick={() => openResource(resource)}
              >
                <Card className="h-full p-5 transition-colors hover:bg-muted/35">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{resource.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{resource.type}</p>
                    </div>
                    <StatusBadge status={resource.status} />
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <Row label="Ближайшие бронирования" value={String(bookings.length || resource.futureBookings)} />
                    <Row label="Состояние" value={resource.condition || "не указано"} />
                    <Row label="Комментарий" value={resource.comment || "нет комментария"} />
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Текущая загрузка</span>
                      <span>{resource.loadPercent}%</span>
                    </div>
                    <Progress value={resource.loadPercent} />
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <ResourceBookingOverview
        resources={resources}
        appointments={data.appointments}
        today={today}
        onOpenResource={openResource}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelected(null);
            setForm(createEmptyResourceForm(resourceTypes[0] ?? "кабинет"));
          }
        }}
        title={selected ? `Ресурс: ${selected.name}` : "Добавить ресурс"}
        description="Укажите, что можно бронировать вместе с записью: кабинет, пост, зал или оборудование."
        className="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={saveResource}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field
              label="Тип"
              value={form.type}
              onChange={(resourceType) => setForm({ ...form, type: resourceType })}
              list="resource-type-options"
            />
            <datalist id="resource-type-options">
              {resourceTypes.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <div className="space-y-2">
              <Label htmlFor="resource-status">Статус</Label>
              <Select
                id="resource-status"
                value={form.status}
                onChange={(event) => setResourceStatus(event.target.value as ResourceStatus)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
            <Field
              label="Загрузка, %"
              type="number"
              min="0"
              max="100"
              value={form.loadPercent}
              onChange={(loadPercent) => setForm({ ...form, loadPercent })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={form.status === option.value ? "default" : "outline"}
                onClick={() => setResourceStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <Field
            label="Техническое состояние"
            value={form.condition}
            onChange={(condition) => setForm({ ...form, condition })}
          />
          <div className="space-y-2">
            <Label htmlFor="resource-comment">Комментарий</Label>
            <Textarea
              id="resource-comment"
              value={form.comment}
              onChange={(event) => setForm({ ...form, comment: event.target.value })}
              placeholder="Например: требуется уборка после 18:00 или плановая проверка в пятницу"
            />
          </div>

          {selected ? (
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="font-medium">Ближайшие бронирования</p>
              {selectedBookings.length ? (
                <div className="mt-3 space-y-2">
                  {selectedBookings.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                      <p className="font-medium">{appointment.title}</p>
                      <p className="mt-1 text-muted-foreground">
                        {formatDate(appointment.date)} · {appointment.time} · {appointment.duration} мин.
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Ближайших записей на этот ресурс нет.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function ResourceBookingOverview({
  resources,
  appointments,
  today,
  onOpenResource
}: {
  resources: Resource[];
  appointments: Appointment[];
  today: string;
  onOpenResource: (resource: Resource) => void;
}) {
  const upcoming = appointments
    .filter((appointment) => appointment.resourceId && appointment.date >= today)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 6);

  if (!resources.length || !upcoming.length) {
    return null;
  }

  return (
    <Card className="mt-6 p-5">
      <h2 className="font-semibold">Ближайшие бронирования ресурсов</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {upcoming.map((appointment) => {
          const resource = resources.find((item) => item.id === appointment.resourceId);
          if (!resource) {
            return null;
          }

          return (
            <button
              key={appointment.id}
              type="button"
              className="rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/35"
              onClick={() => onOpenResource(resource)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{resource.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{appointment.title}</p>
                </div>
                <StatusBadge status={resource.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDate(appointment.date)} · {appointment.time} · {appointment.duration} мин.
              </p>
            </button>
          );
        })}
      </div>
    </Card>
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  list
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  max?: string;
  list?: string;
}) {
  const id = `resource-${label.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        min={min}
        max={max}
        list={list}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function getResourceBookings(
  resource: Resource,
  bookingsByResource: Map<string, Appointment[]>,
  today: string
) {
  return (bookingsByResource.get(resource.id) ?? [])
    .filter((appointment) => appointment.date >= today && appointment.status !== "cancelled" && appointment.status !== "noShow")
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}
