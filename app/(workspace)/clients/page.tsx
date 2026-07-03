"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type DataTableColumn } from "@/components/modules/data-table";
import { EmptyState } from "@/components/modules/empty-state";
import { PageHeader } from "@/components/modules/page-header";
import { SearchAndFilters } from "@/components/modules/search-and-filters";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { canPerformAction } from "@/lib/permissions";
import { formatCurrency, formatDate, getLocalDateKey } from "@/lib/utils";
import type { Client, ClientStatus } from "@/types";

const pageSize = 12;

const statusOptions: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Активный" },
  { value: "new", label: "Новый" },
  { value: "loyal", label: "Постоянный" },
  { value: "inactive", label: "Давно не возвращался" },
  { value: "attention", label: "Требует внимания" }
];

export default function ClientsPage() {
  const clients = useAppStore((state) => state.data.clients);
  const employees = useAppStore((state) => state.data.employees);
  const addClient = useAppStore((state) => state.addClient);
  const bulkUpdateClients = useAppStore((state) => state.bulkUpdateClients);
  const company = useAppStore((state) => state.company);
  const role = useAppStore((state) => state.role);
  const addToast = useAppStore((state) => state.addToast);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [segment, setSegment] = useState("Все");
  const [sort, setSort] = useState("total");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    status: "new" as ClientStatus,
    responsibleId: employees[0]?.id ?? "",
    nextAppointment: "",
    notes: ""
  });
  const [bulk, setBulk] = useState({
    status: "",
    responsibleId: "",
    nextAppointment: ""
  });
  const canManageClients = canPerformAction(role, "manageClients");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return clients
      .filter((client) =>
        [client.name, client.phone, client.email].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
      .filter((client) => status === "all" || client.status === status)
      .filter((client) => {
        if (segment === "VIP") {
          return client.totalSpent >= 50000 || client.status === "loyal";
        }
        if (segment === "Повторные") {
          return client.visits > 1 || client.status === "active" || client.status === "loyal";
        }
        if (segment === "Без визита 45 дней") {
          return client.status === "inactive";
        }
        if (segment === "Из акции") {
          return client.source.toLowerCase().includes("акц");
        }
        return true;
      })
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name, "ru")
          : sort === "last"
            ? b.lastVisit.localeCompare(a.lastVisit)
            : b.totalSpent - a.totalSpent
      );
  }, [clients, search, segment, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, segment, sort, status]);

  const columns: DataTableColumn<Client>[] = [
    {
      key: "client",
      header: "Клиент",
      cell: (client) => (
        <Link href={`/clients/${client.id}`} className="font-medium text-primary hover:underline">
          {client.name}
        </Link>
      )
    },
    { key: "phone", header: "Телефон", cell: (client) => client.phone },
    {
      key: "last",
      header: "Последний визит",
      cell: (client) => formatDate(client.lastVisit)
    },
    {
      key: "next",
      header: `Следующая ${company.terminology.appointment}`,
      cell: (client) => client.nextAppointment ? formatDate(client.nextAppointment) : "не назначена"
    },
    {
      key: "total",
      header: "Общая сумма",
      cell: (client) => formatCurrency(client.totalSpent)
    },
    {
      key: "status",
      header: "Статус",
      cell: (client) => <StatusBadge status={client.status} />
    },
    {
      key: "responsible",
      header: "Ответственный",
      cell: (client) =>
        employees.find((employee) => employee.id === client.responsibleId)?.name ?? "не назначен"
    }
  ];

  function saveClient() {
    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();

    if (!name) {
      addToast({
        title: "Укажите ФИО клиента",
        description: "Без имени карточка клиента будет бесполезна в поиске, записи и отчётах.",
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

    addClient({
      name,
      phone,
      email,
      status: form.status,
      responsibleId: form.responsibleId || employees[0]?.id || "employee-1",
      nextAppointment: form.nextAppointment || undefined,
      source: "Ручное добавление",
      notes: form.notes
    });
    setOpen(false);
    setForm({
      name: "",
      phone: "",
      email: "",
      status: "new",
      responsibleId: employees[0]?.id ?? "",
      nextAppointment: "",
      notes: ""
    });
  }

  function applyBulkAction() {
    const patch: Partial<Client> = {};
    if (bulk.status) {
      patch.status = bulk.status as ClientStatus;
    }
    if (bulk.responsibleId) {
      patch.responsibleId = bulk.responsibleId;
    }
    if (bulk.nextAppointment) {
      patch.nextAppointment = bulk.nextAppointment;
    }
    if (Object.keys(patch).length) {
      bulkUpdateClients(selected, patch);
      setSelected([]);
      setBulk({ status: "", responsibleId: "", nextAppointment: "" });
    }
  }

  return (
    <div>
      <PageHeader
        title="Клиенты"
        description="Поиск, сегменты, история обращений и быстрые действия по базе клиентов."
        actions={
          canManageClients ? (
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Добавить клиента
          </Button>
          ) : null
        }
      />
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
              ...statusOptions.map((option) => ({ value: option.value, label: option.label }))
            ]
          },
          {
            label: "Сортировка",
            value: sort,
            onChange: setSort,
            options: [
              { value: "total", label: "По сумме" },
              { value: "last", label: "По последнему визиту" },
              { value: "name", label: "По имени" }
            ]
          }
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["Все", "VIP", "Повторные", "Без визита 45 дней", "Из акции"].map((segmentName) => (
          <Button
            key={segmentName}
            type="button"
            variant={segment === segmentName ? "default" : "outline"}
            size="sm"
            onClick={() => setSegment(segmentName)}
          >
            {segmentName}
          </Button>
        ))}
      </div>

      {canManageClients && selected.length ? (
        <div className="mb-4 grid gap-3 rounded-lg border border-border bg-card p-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <p className="text-sm font-medium">Выбрано клиентов: {selected.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Измените статус, ответственного или дату следующей записи.</p>
          </div>
          <Select value={bulk.status} onChange={(event) => setBulk({ ...bulk, status: event.target.value })}>
            <option value="">Статус не менять</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Select value={bulk.responsibleId} onChange={(event) => setBulk({ ...bulk, responsibleId: event.target.value })}>
            <option value="">Ответственного не менять</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Input
              type="date"
              value={bulk.nextAppointment}
              onChange={(event) => setBulk({ ...bulk, nextAppointment: event.target.value })}
              aria-label="Следующая запись"
            />
            <Button type="button" onClick={applyBulkAction}>
              Применить
            </Button>
          </div>
        </div>
      ) : null}

      <div className="hidden md:block">
        <DataTable
          rows={pageRows}
          columns={columns}
          selectedIds={selected}
          onSelect={
            canManageClients
              ? (id, checked) =>
                  setSelected((current) =>
                    checked ? [...current, id] : current.filter((item) => item !== id)
                  )
              : undefined
          }
          empty={
            <EmptyState
              title="Клиенты не найдены"
              description="Измените поиск или фильтры, чтобы увидеть результаты."
            />
          }
        />
      </div>

      <div className="grid gap-3 md:hidden">
        {pageRows.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{client.phone}</p>
              </div>
              <StatusBadge status={client.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Сумма</span>
              <span className="text-right">{formatCurrency(client.totalSpent)}</span>
              <span className="text-muted-foreground">Последний визит</span>
              <span className="text-right">{formatDate(client.lastVisit)}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Страница {page} из {totalPages} · показано {pageRows.length} из {filtered.length}</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Назад
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Далее
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Добавить клиента"
        description="Клиент сохранится в рабочем пространстве и синхронизируется с Supabase для зарегистрированных компаний."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={saveClient}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ФИО</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Телефон</Label>
            <Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ответственный</Label>
              <Select value={form.responsibleId} onChange={(event) => setForm({ ...form, responsibleId: event.target.value })}>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Следующая {company.terminology.appointment}</Label>
            <Input type="date" min={getLocalDateKey()} value={form.nextAppointment} onChange={(event) => setForm({ ...form, nextAppointment: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Заметка</Label>
            <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
