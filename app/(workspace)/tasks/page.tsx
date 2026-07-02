"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { FormDrawer } from "@/components/modules/form-drawer";
import { PageHeader } from "@/components/modules/page-header";
import { SearchAndFilters } from "@/components/modules/search-and-filters";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatDate } from "@/lib/utils";

const views = [
  { value: "list", label: "Список" },
  { value: "kanban", label: "Канбан" }
];

const columns = [
  ["new", "Новая"],
  ["inProgress", "В работе"],
  ["waiting", "Ожидает"],
  ["done", "Выполнена"],
  ["overdue", "Просрочена"]
] as const;

export default function TasksPage() {
  const data = useAppStore((state) => state.data);
  const addTask = useAppStore((state) => state.addTask);
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", responsibleId: data.employees[0]?.id ?? "", priority: "medium" });

  const tasks = useMemo(
    () => data.tasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase())),
    [data.tasks, search]
  );

  function save() {
    addTask({
      title: form.title || "Новая задача",
      description: form.description,
      responsibleId: form.responsibleId,
      dueDate: new Date().toISOString().slice(0, 10),
      priority: form.priority as "low" | "medium" | "high",
      status: "new",
      checklist: [{ title: "Проверить детали", done: false }]
    });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Задачи"
        description="Простой task manager: список, канбан, приоритеты, связи с клиентами и чек-листы."
        actions={
          <div className="flex gap-2">
            <Tabs items={views} value={view} onValueChange={setView} />
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Создать задачу
            </Button>
          </div>
        }
      />
      <SearchAndFilters search={search} onSearchChange={setSearch} />
      {view === "list" ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{task.title}</p>
                    <StatusBadge status={task.status} />
                    <StatusBadge status={task.priority === "high" ? "attention" : task.priority === "medium" ? "waiting" : "done"} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Срок: {formatDate(task.dueDate)}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.employees.find((employee) => employee.id === task.responsibleId)?.name}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {columns.map(([status, label]) => (
            <div key={status} className="rounded-lg border border-border bg-card p-3">
              <p className="mb-3 font-semibold">{label}</p>
              <div className="space-y-3">
                {tasks.filter((task) => task.status === status).map((task) => (
                  <div key={task.id} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(task.dueDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDrawer open={open} onOpenChange={setOpen} title="Новая задача">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ответственный</Label>
              <Select value={form.responsibleId} onChange={(event) => setForm({ ...form, responsibleId: event.target.value })}>
                {data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </Select>
            </div>
          </div>
          <Button type="button" className="w-full" onClick={save}>Сохранить</Button>
        </div>
      </FormDrawer>
    </div>
  );
}
