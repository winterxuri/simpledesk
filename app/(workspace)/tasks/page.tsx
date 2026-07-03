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
import { canPerformAction } from "@/lib/permissions";
import { formatDate, getLocalDateKey } from "@/lib/utils";
import type { TaskStatus } from "@/types";

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

const statusActions: Partial<Record<TaskStatus, { label: string; status: TaskStatus }[]>> = {
  new: [{ label: "Взять в работу", status: "inProgress" }],
  inProgress: [
    { label: "Ожидание", status: "waiting" },
    { label: "Закрыть", status: "done" }
  ],
  waiting: [
    { label: "Вернуть в работу", status: "inProgress" },
    { label: "Закрыть", status: "done" }
  ],
  overdue: [
    { label: "В работу", status: "inProgress" },
    { label: "Закрыть", status: "done" }
  ],
  done: [{ label: "Переоткрыть", status: "inProgress" }]
};

export default function TasksPage() {
  const data = useAppStore((state) => state.data);
  const role = useAppStore((state) => state.role);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const toggleTaskChecklistItem = useAppStore((state) => state.toggleTaskChecklistItem);
  const addToast = useAppStore((state) => state.addToast);
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    responsibleId: data.employees[0]?.id ?? "",
    priority: "medium",
    dueDate: getLocalDateKey()
  });
  const canManageTasks = canPerformAction(role, "manageTasks");
  const canUpdateTaskProgress = canPerformAction(role, "updateTaskProgress");

  const tasks = useMemo(
    () => data.tasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase())),
    [data.tasks, search]
  );

  function save() {
    const title = form.title.trim();

    if (!title) {
      addToast({
        title: "Укажите название задачи",
        description: "Задача без названия не поможет ответственному понять, что нужно сделать.",
        variant: "warning"
      });
      return;
    }

    if (!form.responsibleId) {
      addToast({
        title: "Выберите ответственного",
        description: "У задачи должен быть конкретный исполнитель.",
        variant: "warning"
      });
      return;
    }

    if (!form.dueDate) {
      addToast({
        title: "Укажите срок выполнения",
        description: "Срок нужен для контроля просрочек и рабочего дня сотрудника.",
        variant: "warning"
      });
      return;
    }

    addTask({
      title,
      description: form.description.trim(),
      responsibleId: form.responsibleId,
      dueDate: form.dueDate || getLocalDateKey(),
      priority: form.priority as "low" | "medium" | "high",
      status: "new",
      checklist: [
        { title: "Проверить детали", done: false },
        { title: "Подтвердить выполнение", done: false }
      ]
    });
    setForm({
      title: "",
      description: "",
      responsibleId: data.employees[0]?.id ?? "",
      priority: "medium",
      dueDate: getLocalDateKey()
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
            {canManageTasks ? (
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Создать задачу
            </Button>
            ) : null}
          </div>
        }
      />
      <SearchAndFilters search={search} onSearchChange={setSearch} />
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-medium">1. Создать</p>
          <p className="mt-1 text-sm text-muted-foreground">Задача получает ответственного, срок, приоритет и чек-лист.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">2. Выполнить</p>
          <p className="mt-1 text-sm text-muted-foreground">Ответственный переводит задачу в работу и отмечает пункты проверки.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">3. Закрыть</p>
          <p className="mt-1 text-sm text-muted-foreground">После проверки задача переводится в статус «выполнена».</p>
        </Card>
      </div>
      {view === "list" ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{task.title}</p>
                    <StatusBadge status={task.status} />
                    <StatusBadge status={`priority-${task.priority}`} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Срок: {formatDate(task.dueDate)}</p>
                  <div className="mt-3 space-y-2">
                    {task.checklist.map((item, index) => (
                      <label key={`${task.id}-${item.title}-${index}`} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={item.done}
                          disabled={!canUpdateTaskProgress}
                          onChange={(event) =>
                            toggleTaskChecklistItem(task.id, index, event.target.checked)
                          }
                        />
                        <span className={item.done ? "text-muted-foreground line-through" : ""}>
                          {item.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex min-w-48 flex-col gap-3 text-sm text-muted-foreground">
                  <span>{data.employees.find((employee) => employee.id === task.responsibleId)?.name}</span>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {(statusActions[task.status] ?? []).map((action) => (
                      <Button
                        key={action.status}
                        type="button"
                        size="sm"
                        variant={action.status === "done" ? "default" : "outline"}
                        disabled={!canUpdateTaskProgress}
                        onClick={() => updateTask(task.id, { status: action.status })}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.checklist.filter((item) => item.done).length}/{task.checklist.length} проверок
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(statusActions[task.status] ?? []).slice(0, 2).map((action) => (
                        <Button
                          key={action.status}
                          type="button"
                          size="sm"
                          variant={action.status === "done" ? "default" : "outline"}
                          disabled={!canUpdateTaskProgress}
                          onClick={() => updateTask(task.id, { status: action.status })}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
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
          <div className="space-y-2">
            <Label>Срок выполнения</Label>
              <Input
                type="date"
                min={getLocalDateKey()}
                value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </div>
          <Button type="button" className="w-full" onClick={save}>Сохранить</Button>
        </div>
      </FormDrawer>
    </div>
  );
}
