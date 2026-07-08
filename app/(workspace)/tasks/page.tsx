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
import { EmptyState } from "@/components/modules/empty-state";
import { PageHeader } from "@/components/modules/page-header";
import { SearchAndFilters } from "@/components/modules/search-and-filters";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { getScopedWorkspaceData } from "@/lib/employee-scope";
import { canPerformAction } from "@/lib/permissions";
import { formatDate, getLocalDateKey } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

const views = [
  { value: "list", label: "Список" },
  { value: "kanban", label: "Канбан" }
];

const columns = [
  ["new", "Новая"],
  ["inProgress", "В работе"],
  ["waiting", "Ожидает"],
  ["done", "Выполнена"],
  ["overdue", "Просрочена"],
  ["cancelled", "Отменена"]
] as const;

const managerStatusActions: Partial<Record<TaskStatus, { label: string; status: TaskStatus }[]>> = {
  new: [
    { label: "Взять в работу", status: "inProgress" },
    { label: "Отменить", status: "cancelled" }
  ],
  inProgress: [
    { label: "Ожидание", status: "waiting" },
    { label: "Закрыть", status: "done" },
    { label: "Отменить", status: "cancelled" }
  ],
  waiting: [
    { label: "Вернуть в работу", status: "inProgress" },
    { label: "Закрыть", status: "done" },
    { label: "Отменить", status: "cancelled" }
  ],
  overdue: [
    { label: "В работу", status: "inProgress" },
    { label: "Закрыть", status: "done" },
    { label: "Отменить", status: "cancelled" }
  ],
  done: [{ label: "Переоткрыть", status: "inProgress" }],
  cancelled: [{ label: "Переоткрыть", status: "inProgress" }]
};

const employeeStatusActions: Partial<Record<TaskStatus, { label: string; status: TaskStatus }[]>> = {
  new: [{ label: "Взять в работу", status: "inProgress" }],
  inProgress: [
    { label: "Ожидание", status: "waiting" },
    { label: "Отметить выполненной", status: "done" }
  ],
  waiting: [{ label: "Вернуть в работу", status: "inProgress" }],
  overdue: [
    { label: "В работу", status: "inProgress" },
    { label: "Отметить выполненной", status: "done" }
  ]
};

export default function TasksPage() {
  const data = useAppStore((state) => state.data);
  const user = useAppStore((state) => state.user);
  const role = useAppStore((state) => state.role);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const toggleTaskChecklistItem = useAppStore((state) => state.toggleTaskChecklistItem);
  const addToast = useAppStore((state) => state.addToast);
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const canManageTasks = canPerformAction(role, "manageTasks");
  const canUpdateTaskProgress = canPerformAction(role, "updateTaskProgress");
  const scopedData = useMemo(() => getScopedWorkspaceData(data, user, role), [data, role, user]);
  const employees = canManageTasks ? data.employees : scopedData.employees;
  const [form, setForm] = useState({
    title: "",
    description: "",
    responsibleId: employees[0]?.id ?? "",
    priority: "medium",
    dueDate: getLocalDateKey(),
    checklist: "Проверить детали\nПодтвердить выполнение"
  });

  const tasks = useMemo(
    () =>
      scopedData.tasks.filter((task) => {
        const query = search.toLowerCase();
        return [task.title, task.description].some((value) => value.toLowerCase().includes(query));
      }),
    [scopedData.tasks, search]
  );
  const taskGuideCards = canManageTasks
    ? [
        {
          title: "1. Создать",
          description: "Задача получает ответственного, срок, приоритет и чек-лист."
        },
        {
          title: "2. Выполнить",
          description: "Ответственный переводит задачу в работу и отмечает пункты проверки."
        },
        {
          title: "3. Закрыть",
          description: "После проверки задача переводится в статус «выполнена»."
        }
      ]
    : [
        {
          title: "1. Взять в работу",
          description: "Переведите назначенную задачу в работу, когда начали выполнение."
        },
        {
          title: "2. Отметить чек-лист",
          description: "Закрывайте пункты проверки по мере выполнения задачи."
        },
        {
          title: "3. Закрыть",
          description: "После выполнения переведите задачу в статус «выполнена»."
        }
      ];

  function getTaskStatusActions(task: Task) {
    if (canManageTasks) {
      return managerStatusActions[task.status] ?? [];
    }

    if (!canUpdateTaskProgress) {
      return [];
    }

    return employeeStatusActions[task.status] ?? [];
  }

  function canEditTaskChecklist(task: Task) {
    return canManageTasks || (canUpdateTaskProgress && task.status !== "done" && task.status !== "cancelled");
  }

  function openCreateTask() {
    setSelectedTask(null);
    setForm({
      title: "",
      description: "",
      responsibleId: employees[0]?.id ?? "",
      priority: "medium",
      dueDate: getLocalDateKey(),
      checklist: "Проверить детали\nПодтвердить выполнение"
    });
    setOpen(true);
  }

  function openEditTask(task: Task) {
    if (!canManageTasks) {
      addToast({
        title: "Редактирование недоступно",
        description: "Сотрудник может менять только рабочий статус и чек-лист своих задач.",
        variant: "warning"
      });
      return;
    }

    setSelectedTask(task);
    setForm({
      title: task.title,
      description: task.description,
      responsibleId: task.responsibleId,
      priority: task.priority,
      dueDate: task.dueDate,
      checklist: task.checklist.map((item) => item.title).join("\n")
    });
    setOpen(true);
  }

  function changeTaskStatus(task: Task, status: TaskStatus) {
    const allowed = getTaskStatusActions(task).some((action) => action.status === status);

    if (!allowed) {
      addToast({
        title: "Статус нельзя изменить",
        description:
          task.status === "done"
            ? "Завершённую задачу может переоткрыть владелец или администратор."
            : "Для этой роли и текущего состояния задачи такой переход недоступен.",
        variant: "warning"
      });
      return;
    }

    updateTask(task.id, { status });
  }

  function updateChecklistItem(task: Task, itemIndex: number, done: boolean) {
    if (!canEditTaskChecklist(task)) {
      addToast({
        title: "Чек-лист заблокирован",
        description: "Завершённую задачу сначала должен переоткрыть владелец или администратор.",
        variant: "warning"
      });
      return;
    }

    toggleTaskChecklistItem(task.id, itemIndex, done);
  }

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

    const checklist = form.checklist
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((title, index) => ({
        title,
        done: selectedTask?.checklist[index]?.title === title ? selectedTask.checklist[index].done : false
      }));

    const payload = {
      title,
      description: form.description.trim(),
      responsibleId: form.responsibleId,
      dueDate: form.dueDate || getLocalDateKey(),
      priority: form.priority as "low" | "medium" | "high",
      checklist: checklist.length ? checklist : [{ title: "Проверить детали", done: false }]
    };

    if (selectedTask) {
      updateTask(selectedTask.id, payload);
      addToast({ title: "Задача обновлена", variant: "success" });
    } else {
      addTask({
        ...payload,
        status: "new"
      });
    }

    setForm({
      title: "",
      description: "",
      responsibleId: employees[0]?.id ?? "",
      priority: "medium",
      dueDate: getLocalDateKey(),
      checklist: "Проверить детали\nПодтвердить выполнение"
    });
    setSelectedTask(null);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Задачи"
        description={
          canManageTasks
            ? "Простой task manager: список, канбан, приоритеты, связи с клиентами и чек-листы."
            : "Ваши назначенные задачи, чек-листы и рабочие статусы."
        }
        actions={
          <div className="flex gap-2">
            <Tabs items={views} value={view} onValueChange={setView} />
            {canManageTasks ? (
            <Button type="button" onClick={openCreateTask}>
              <Plus className="h-4 w-4" />
              Создать задачу
            </Button>
            ) : null}
          </div>
        }
      />
      <SearchAndFilters search={search} onSearchChange={setSearch} />
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {taskGuideCards.map((card) => (
          <Card key={card.title} className="p-4">
            <p className="text-sm font-medium">{card.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
          </Card>
        ))}
      </div>
      {tasks.length === 0 ? (
        <EmptyState
          title={canManageTasks ? "Задачи не найдены" : "Нет назначенных задач"}
          description={
            canManageTasks
              ? "Измените поиск или создайте новую задачу."
              : "Задачи появятся здесь, когда владелец или администратор назначит их вам."
          }
        />
      ) : view === "list" ? (
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
                    {task.checklist.map((item, index) => {
                      const checklistEditable = canEditTaskChecklist(task);
                      return (
                        <label
                          key={`${task.id}-${item.title}-${index}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={item.done}
                            disabled={!checklistEditable}
                            onChange={(event) =>
                              updateChecklistItem(task, index, event.target.checked)
                            }
                          />
                          <span className={item.done ? "text-muted-foreground line-through" : ""}>
                            {item.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex min-w-48 flex-col gap-3 text-sm text-muted-foreground">
                  <span>{employees.find((employee) => employee.id === task.responsibleId)?.name}</span>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {canManageTasks ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditTask(task)}
                      >
                        Редактировать
                      </Button>
                    ) : null}
                    {getTaskStatusActions(task).map((action) => (
                      <Button
                        key={action.status}
                        type="button"
                        size="sm"
                        variant={action.status === "done" ? "default" : "outline"}
                        onClick={() => changeTaskStatus(task, action.status)}
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
                      {canManageTasks ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEditTask(task)}
                        >
                          Ред.
                        </Button>
                      ) : null}
                      {getTaskStatusActions(task).map((action) => (
                        <Button
                          key={action.status}
                          type="button"
                          size="sm"
                          variant={action.status === "done" ? "default" : "outline"}
                          onClick={() => changeTaskStatus(task, action.status)}
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

      <FormDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSelectedTask(null);
          }
        }}
        title={selectedTask ? "Редактировать задачу" : "Новая задача"}
      >
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
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
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
                min={selectedTask ? undefined : getLocalDateKey()}
                value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Чек-лист</Label>
            <Textarea
              value={form.checklist}
              onChange={(event) => setForm({ ...form, checklist: event.target.value })}
              placeholder="Каждый пункт с новой строки"
            />
          </div>
          <Button type="button" className="w-full" onClick={save}>Сохранить</Button>
        </div>
      </FormDrawer>
    </div>
  );
}
