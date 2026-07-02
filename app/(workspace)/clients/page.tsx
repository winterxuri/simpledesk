"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Client } from "@/types";

export default function ClientsPage() {
  const clients = useAppStore((state) => state.data.clients);
  const employees = useAppStore((state) => state.data.employees);
  const addClient = useAppStore((state) => state.addClient);
  const company = useAppStore((state) => state.company);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("total");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: ""
  });

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return clients
      .filter((client) =>
        [client.name, client.phone, client.email].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
      .filter((client) => status === "all" || client.status === status)
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name, "ru")
          : sort === "last"
            ? b.lastVisit.localeCompare(a.lastVisit)
            : b.totalSpent - a.totalSpent
      );
  }, [clients, search, sort, status]);

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
    addClient({
      name: form.name || "Новый клиент",
      phone: form.phone || "+7 900 000-00-00",
      email: form.email || "client@example.ru",
      status: "new",
      responsibleId: employees[0]?.id ?? "employee-1",
      nextAppointment: undefined,
      source: "Ручное добавление",
      notes: form.notes
    });
    setOpen(false);
    setForm({ name: "", phone: "", email: "", notes: "" });
  }

  return (
    <div>
      <PageHeader
        title="Клиенты"
        description="Поиск, сегменты, история обращений и быстрые действия по базе клиентов."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Добавить клиента
          </Button>
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
              { value: "active", label: "Активные" },
              { value: "new", label: "Новые" },
              { value: "loyal", label: "Постоянные" },
              { value: "inactive", label: "Давно не возвращались" },
              { value: "attention", label: "Требуют внимания" }
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
        {["Все", "VIP", "Повторные", "Без визита 45 дней", "Из акции"].map((segment) => (
          <Button key={segment} type="button" variant="outline" size="sm">
            {segment}
          </Button>
        ))}
      </div>

      <div className="hidden md:block">
        <DataTable
          rows={filtered.slice(0, 12)}
          columns={columns}
          selectedIds={selected}
          onSelect={(id, checked) =>
            setSelected((current) =>
              checked ? [...current, id] : current.filter((item) => item !== id)
            )
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
        {filtered.slice(0, 12).map((client) => (
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
        <span>Показано {Math.min(12, filtered.length)} из {filtered.length}</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled>
            Назад
          </Button>
          <Button type="button" variant="outline" size="sm">
            Далее
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Добавить клиента"
        description="Клиент сохранится в localStorage как демонстрационная запись."
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
            <Label>Имя</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Телефон</Label>
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
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
