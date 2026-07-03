"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormDrawer } from "@/components/modules/form-drawer";
import { useAppStore } from "@/store/app-store";
import { AppIcon } from "@/lib/icons";
import { canPerformAction, type PermissionAction } from "@/lib/permissions";
import { getLocalDateKey } from "@/lib/utils";
import type { QuickCreateType } from "@/types";

const createItems: { type: QuickCreateType; label: string; icon: string; action: PermissionAction }[] = [
  { type: "client", label: "Клиент", icon: "UsersRound", action: "manageClients" },
  { type: "appointment", label: "Запись", icon: "CalendarDays", action: "manageAppointments" },
  { type: "task", label: "Задача", icon: "ListTodo", action: "manageTasks" },
  { type: "sale", label: "Продажа", icon: "CreditCard", action: "manageInventory" },
  { type: "product", label: "Товар", icon: "Boxes", action: "manageInventory" },
  { type: "material", label: "Расходник", icon: "PackagePlus", action: "manageInventory" },
  { type: "employee", label: "Сотрудник", icon: "UserRoundCog", action: "manageEmployees" }
];

export function QuickCreateMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState("");
  const [secondary, setSecondary] = useState("");
  const [comment, setComment] = useState("");
  const quickCreateOpen = useAppStore((state) => state.quickCreateOpen);
  const drawerType = useAppStore((state) => state.quickCreateType);
  const openQuickCreate = useAppStore((state) => state.openQuickCreate);
  const setQuickCreateOpen = useAppStore((state) => state.setQuickCreateOpen);
  const addClient = useAppStore((state) => state.addClient);
  const addTask = useAppStore((state) => state.addTask);
  const addAppointment = useAppStore((state) => state.addAppointment);
  const addEmployee = useAppStore((state) => state.addEmployee);
  const addProduct = useAppStore((state) => state.addProduct);
  const addFinancialOperation = useAppStore((state) => state.addFinancialOperation);
  const addToast = useAppStore((state) => state.addToast);
  const data = useAppStore((state) => state.data);
  const role = useAppStore((state) => state.role);

  const item = createItems.find((entry) => entry.type === drawerType);
  const availableItems = createItems.filter((entry) => canPerformAction(role, entry.action));

  function reset() {
    setName("");
    setSecondary("");
    setComment("");
    setQuickCreateOpen(false);
  }

  function save() {
    if (!drawerType) {
      return;
    }

    const title = name.trim();
    const secondaryValue = secondary.trim();
    const commentValue = comment.trim();

    if (drawerType === "client") {
      if (!title || !secondaryValue) {
        addToast({
          title: "Заполните клиента",
          description: "Для быстрого создания клиента нужны ФИО и телефон.",
          variant: "warning"
        });
        return;
      }

      addClient({
        name: title,
        phone: secondaryValue,
        email: "",
        status: "new",
        responsibleId: data.employees[0]?.id ?? "employee-1",
        nextAppointment: undefined,
        source: "Ручное добавление",
        notes: commentValue
      });
    } else if (drawerType === "task") {
      if (!title || !secondaryValue) {
        addToast({
          title: "Заполните задачу",
          description: "Для задачи нужны название и ответственный.",
          variant: "warning"
        });
        return;
      }

      addTask({
        title,
        description: commentValue,
        responsibleId: secondaryValue,
        dueDate: getLocalDateKey(),
        priority: "medium",
        status: "new",
        checklist: [{ title: "Уточнить детали", done: false }]
      });
    } else if (drawerType === "appointment") {
      if (!title || !secondaryValue || !data.clients.length || !data.employees.length) {
        addToast({
          title: "Запись нельзя создать быстро",
          description: "Нужны услуга, время, хотя бы один клиент и сотрудник.",
          variant: "warning"
        });
        return;
      }

      addAppointment({
        clientId: data.clients[0].id,
        employeeId: data.employees[0].id,
        resourceId: data.resources[0]?.id,
        title,
        date: getLocalDateKey(),
        time: secondaryValue,
        duration: 60,
        price: 0,
        status: "planned",
        paid: false,
        comment: commentValue
      });
    } else if (drawerType === "employee") {
      if (!title || !secondaryValue) {
        addToast({
          title: "Заполните сотрудника",
          description: "Для карточки сотрудника нужны ФИО и должность.",
          variant: "warning"
        });
        return;
      }

      addEmployee({
        name: title,
        position: secondaryValue,
        status: "working",
        schedule: "09:00-18:00",
        role: "employee",
        loadPercent: 0,
        revenue: 0,
        appointmentsCount: 0,
        rating: 0,
        compensationType: "fixed",
        baseSalary: 0,
        commissionPercent: 0
      });
    } else if (drawerType === "product" || drawerType === "material") {
      if (!title) {
        addToast({
          title: drawerType === "product" ? "Укажите товар" : "Укажите расходник",
          description: "Название обязательно для складского учета.",
          variant: "warning"
        });
        return;
      }

      addProduct({
        name: title,
        type: drawerType === "product" ? "product" : "material",
        category: drawerType === "product" ? "Товар" : "Расходники",
        currentStock: 0,
        minStock: 1,
        purchasePrice: Number(secondaryValue) || 0,
        salePrice: drawerType === "product" ? Number(secondaryValue) || 0 : 0,
        supplier: commentValue,
        status: "low"
      });
    } else if (drawerType === "sale") {
      const amount = Number(secondaryValue);
      if (!Number.isFinite(amount) || amount <= 0) {
        addToast({
          title: "Укажите сумму продажи",
          description: "Сумма должна быть больше нуля.",
          variant: "warning"
        });
        return;
      }

      addFinancialOperation({
        type: "income",
        category: "Продажа",
        amount,
        date: getLocalDateKey(),
        comment: commentValue || title || "Продажа через быстрое создание",
        clientId: data.clients[0]?.id,
        employeeId: data.employees[0]?.id
      });
    } else {
      addToast({
        title: "Действие не настроено",
        description: `${item?.label ?? "Объект"} пока не поддерживается быстрым созданием.`,
        variant: "success"
      });
    }

    addToast({
      title: "Сохранено",
      description: `${item?.label ?? "Объект"} добавлен в рабочее пространство.`,
      variant: "success"
    });
    reset();
  }

  if (!availableItems.length) {
    return null;
  }

  return (
    <div className="relative">
      <Button type="button" onClick={() => setMenuOpen((open) => !open)}>
        <Plus className="h-4 w-4" />
        Создать
      </Button>
      {menuOpen ? (
        <div className="absolute right-0 top-12 z-30 w-64 rounded-lg border border-border bg-card p-2 shadow-soft">
          {availableItems.map((entry) => (
            <button
              key={entry.type}
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                openQuickCreate(entry.type);
                setMenuOpen(false);
              }}
            >
              <AppIcon name={entry.icon} className="h-4 w-4 text-muted-foreground" />
              {entry.label}
            </button>
          ))}
        </div>
      ) : null}
      <FormDrawer
        open={quickCreateOpen && Boolean(drawerType)}
        onOpenChange={(open) => {
          if (!open) {
            reset();
          }
        }}
        title={item ? `Создать: ${item.label.toLowerCase()}` : "Создать"}
        description="Для зарегистрированной компании данные сохраняются в Supabase, в демо-режиме - локально."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название или имя</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Введите значение"
            />
          </div>
          <div className="space-y-2">
            <Label>
              {drawerType === "client"
                ? "Телефон"
                : drawerType === "appointment"
                  ? "Время"
                  : drawerType === "promotion"
                    ? "Период акции"
                    : drawerType === "employee"
                      ? "Должность"
                      : drawerType === "sale"
                        ? "Сумма"
                        : drawerType === "product" || drawerType === "material"
                          ? "Цена закупки"
                          : "Ответственный"}
            </Label>
            {drawerType === "task" ? (
              <Select value={secondary} onChange={(event) => setSecondary(event.target.value)}>
                <option value="">Выберите ответственного</option>
                {data.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={secondary}
                onChange={(event) => setSecondary(event.target.value)}
                placeholder={drawerType === "appointment" ? "12:00" : "Дополнительное поле"}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Короткая заметка"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={reset}>
              Отмена
            </Button>
            <Button type="button" onClick={save}>
              Сохранить
            </Button>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
