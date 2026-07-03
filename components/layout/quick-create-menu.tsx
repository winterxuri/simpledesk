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
import { getLocalDateKey } from "@/lib/utils";
import type { QuickCreateType, Role } from "@/types";

const createItems: { type: QuickCreateType; label: string; icon: string; roles: Role[] }[] = [
  { type: "client", label: "Клиент", icon: "UsersRound", roles: ["owner", "admin", "employee"] },
  { type: "appointment", label: "Запись", icon: "CalendarDays", roles: ["owner", "admin", "employee"] },
  { type: "task", label: "Задача", icon: "ListTodo", roles: ["owner", "admin", "employee"] },
  { type: "sale", label: "Продажа", icon: "CreditCard", roles: ["owner", "admin"] },
  { type: "product", label: "Товар", icon: "Boxes", roles: ["owner", "admin"] },
  { type: "material", label: "Расходник", icon: "PackagePlus", roles: ["owner", "admin"] },
  { type: "promotion", label: "Акция", icon: "BadgePercent", roles: ["owner", "admin"] },
  { type: "employee", label: "Сотрудник", icon: "UserRoundCog", roles: ["owner", "admin"] }
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
  const addPromotion = useAppStore((state) => state.addPromotion);
  const addEmployee = useAppStore((state) => state.addEmployee);
  const addProduct = useAppStore((state) => state.addProduct);
  const addFinancialOperation = useAppStore((state) => state.addFinancialOperation);
  const addToast = useAppStore((state) => state.addToast);
  const data = useAppStore((state) => state.data);
  const role = useAppStore((state) => state.role);

  const item = createItems.find((entry) => entry.type === drawerType);
  const availableItems = createItems.filter((entry) => entry.roles.includes(role));

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

    if (drawerType === "client") {
      addClient({
        name: name || "Новый клиент",
        phone: secondary || "+7 900 000-00-00",
        email: "client@example.ru",
        status: "new",
        responsibleId: data.employees[0]?.id ?? "employee-1",
        nextAppointment: undefined,
        source: "Ручное добавление",
        notes: comment || "Клиент добавлен через быстрое создание."
      });
    } else if (drawerType === "task") {
      addTask({
        title: name || "Новая задача",
        description: comment || "Задача создана через быстрое меню.",
        responsibleId: secondary || data.employees[0]?.id || "employee-1",
        dueDate: getLocalDateKey(),
        priority: "medium",
        status: "new",
        checklist: [{ title: "Уточнить детали", done: false }]
      });
    } else if (drawerType === "appointment") {
      addAppointment({
        clientId: data.clients[0]?.id ?? "client-1",
        employeeId: data.employees[0]?.id ?? "employee-1",
        resourceId: data.resources[0]?.id,
        title: name || "Новая запись",
        date: getLocalDateKey(),
        time: secondary || "12:00",
        duration: 60,
        price: 2500,
        status: "planned",
        paid: false,
        comment
      });
    } else if (drawerType === "promotion") {
      addPromotion({
        name: name || "Новая акция",
        period: secondary || "период нужно уточнить",
        status: "draft",
        conditions: comment || "Условия нужно заполнить",
        description: comment || "Черновик акции."
      });
    } else if (drawerType === "employee") {
      addEmployee({
        name: name || "Новый сотрудник",
        position: secondary || "Сотрудник",
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
      addProduct({
        name: name || (drawerType === "product" ? "Новый товар" : "Новый расходник"),
        type: drawerType === "product" ? "product" : "material",
        category: drawerType === "product" ? "Товар" : "Расходники",
        currentStock: 0,
        minStock: 1,
        purchasePrice: Number(secondary) || 0,
        salePrice: drawerType === "product" ? Number(secondary) || 0 : 0,
        supplier: comment || "Поставщик не указан",
        status: "low"
      });
    } else if (drawerType === "sale") {
      addFinancialOperation({
        type: "income",
        category: "Продажа",
        amount: Number(secondary) || 0,
        date: getLocalDateKey(),
        comment: comment || name || "Продажа через быстрое создание",
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
      description: `${item?.label ?? "Объект"} добавлен в локальные данные.`,
      variant: "success"
    });
    reset();
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
