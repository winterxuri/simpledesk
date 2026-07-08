"use client";

import { useEffect, useState } from "react";
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
import type { Employee, Priority, Product, ProductStatus, QuickCreateType } from "@/types";

const createItems: { type: QuickCreateType; label: string; icon: string; action: PermissionAction }[] = [
  { type: "client", label: "Клиент", icon: "UsersRound", action: "manageClients" },
  { type: "appointment", label: "Запись", icon: "CalendarDays", action: "manageAppointments" },
  { type: "task", label: "Задача", icon: "ListTodo", action: "manageTasks" },
  { type: "sale", label: "Продажа", icon: "CreditCard", action: "manageInventory" },
  { type: "product", label: "Товар", icon: "Boxes", action: "manageInventory" },
  { type: "material", label: "Расходник", icon: "PackagePlus", action: "manageInventory" },
  { type: "employee", label: "Сотрудник", icon: "UserRoundCog", action: "manageEmployees" }
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" }
];

const productTypeOptions: { value: Product["type"]; label: string }[] = [
  { value: "product", label: "Товар" },
  { value: "material", label: "Расходник" },
  { value: "part", label: "Запчасть" }
];

const roleOptions: { value: Employee["role"]; label: string }[] = [
  { value: "admin", label: "Администратор" },
  { value: "employee", label: "Сотрудник" }
];

const compensationOptions: { value: NonNullable<Employee["compensationType"]>; label: string }[] = [
  { value: "fixed", label: "Фикс" },
  { value: "commission", label: "Процент" },
  { value: "mixed", label: "Фикс + процент" }
];

type WorkspaceData = ReturnType<typeof useAppStore.getState>["data"];

type QuickCreateForm = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientResponsibleId: string;
  clientNextAppointment: string;
  clientNotes: string;
  appointmentClientId: string;
  appointmentEmployeeId: string;
  appointmentTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentDuration: string;
  appointmentPrice: string;
  appointmentPaid: boolean;
  appointmentComment: string;
  taskTitle: string;
  taskDescription: string;
  taskResponsibleId: string;
  taskDueDate: string;
  taskPriority: Priority;
  taskChecklist: string;
  saleAmount: string;
  saleCategory: string;
  saleDate: string;
  saleClientId: string;
  saleEmployeeId: string;
  saleComment: string;
  productName: string;
  productType: Product["type"];
  productCategory: string;
  productSupplier: string;
  productCurrentStock: string;
  productMinStock: string;
  productPurchasePrice: string;
  productSalePrice: string;
  employeeName: string;
  employeePhone: string;
  employeeEmail: string;
  employeePosition: string;
  employeeRole: Employee["role"];
  employeeSchedule: string;
  employeeCompensationType: NonNullable<Employee["compensationType"]>;
  employeeBaseSalary: string;
  employeeCommissionPercent: string;
};

function createInitialForm(data: WorkspaceData, type?: QuickCreateType): QuickCreateForm {
  const today = getLocalDateKey();
  const firstEmployeeId = data.employees[0]?.id ?? "";
  const firstClientId = data.clients[0]?.id ?? "";
  const productType: Product["type"] = type === "material" ? "material" : "product";

  return {
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientResponsibleId: firstEmployeeId,
    clientNextAppointment: "",
    clientNotes: "",
    appointmentClientId: firstClientId,
    appointmentEmployeeId: firstEmployeeId,
    appointmentTitle: "",
    appointmentDate: today,
    appointmentTime: "12:00",
    appointmentDuration: "60",
    appointmentPrice: "0",
    appointmentPaid: false,
    appointmentComment: "",
    taskTitle: "",
    taskDescription: "",
    taskResponsibleId: firstEmployeeId,
    taskDueDate: today,
    taskPriority: "medium",
    taskChecklist: "Проверить детали\nПодтвердить выполнение",
    saleAmount: "",
    saleCategory: "Продажа",
    saleDate: today,
    saleClientId: firstClientId,
    saleEmployeeId: firstEmployeeId,
    saleComment: "",
    productName: "",
    productType,
    productCategory: productType === "material" ? "Расходники" : "Товары",
    productSupplier: "",
    productCurrentStock: "0",
    productMinStock: "1",
    productPurchasePrice: "",
    productSalePrice: productType === "material" ? "0" : "",
    employeeName: "",
    employeePhone: "",
    employeeEmail: "",
    employeePosition: "",
    employeeRole: "employee",
    employeeSchedule: "09:00-18:00",
    employeeCompensationType: "fixed",
    employeeBaseSalary: "0",
    employeeCommissionPercent: "0"
  };
}

export function QuickCreateMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [form, setForm] = useState<QuickCreateForm>(() => createInitialForm(data));

  const item = createItems.find((entry) => entry.type === drawerType);
  const availableItems = createItems.filter((entry) => canPerformAction(role, entry.action));

  useEffect(() => {
    if (quickCreateOpen && drawerType) {
      setForm(createInitialForm(data, drawerType));
    }
  }, [data, drawerType, quickCreateOpen]);

  function openItem(type: QuickCreateType) {
    setForm(createInitialForm(data, type));
    openQuickCreate(type);
    setMenuOpen(false);
  }

  function reset() {
    setForm(createInitialForm(data, drawerType ?? undefined));
    setQuickCreateOpen(false);
  }

  function save() {
    if (!drawerType) {
      return;
    }

    if (drawerType === "client" && !saveClient()) {
      return;
    }
    if (drawerType === "appointment" && !saveAppointment()) {
      return;
    }
    if (drawerType === "task" && !saveTask()) {
      return;
    }
    if (drawerType === "sale" && !saveSale()) {
      return;
    }
    if ((drawerType === "product" || drawerType === "material") && !saveProduct()) {
      return;
    }
    if (drawerType === "employee" && !saveEmployee()) {
      return;
    }

    addToast({
      title: "Сохранено",
      description: `${item?.label ?? "Объект"} добавлен в рабочее пространство.`,
      variant: "success"
    });
    reset();
  }

  function saveClient() {
    const name = form.clientName.trim();
    const phone = form.clientPhone.trim();
    const email = form.clientEmail.trim();

    if (!name) {
      addToast({
        title: "Укажите ФИО клиента",
        description: "Имя нужно для поиска, записи и истории клиента.",
        variant: "warning"
      });
      return false;
    }

    if (!phone && !email) {
      addToast({
        title: "Добавьте контакт клиента",
        description: "Нужен телефон или email, чтобы связаться с клиентом.",
        variant: "warning"
      });
      return false;
    }

    if (email && !emailPattern.test(email)) {
      addToast({
        title: "Email выглядит некорректно",
        description: "Проверьте адрес или оставьте поле пустым.",
        variant: "warning"
      });
      return false;
    }

    addClient({
      name,
      phone,
      email,
      status: "new",
      responsibleId: form.clientResponsibleId || data.employees[0]?.id || "employee-1",
      nextAppointment: form.clientNextAppointment || undefined,
      source: "Быстрое создание",
      notes: form.clientNotes.trim()
    });
    return true;
  }

  function saveAppointment() {
    const title = form.appointmentTitle.trim();
    const duration = Number(form.appointmentDuration);
    const price = Number(form.appointmentPrice);

    if (!data.clients.length || !form.appointmentClientId) {
      addToast({
        title: "Выберите клиента",
        description: "Сначала добавьте клиента или выберите существующего.",
        variant: "warning"
      });
      return false;
    }

    if (!data.employees.length || !form.appointmentEmployeeId) {
      addToast({
        title: "Выберите сотрудника",
        description: "Запись должна быть назначена на конкретного сотрудника.",
        variant: "warning"
      });
      return false;
    }

    if (!title) {
      addToast({
        title: "Укажите услугу или работу",
        description: "Название нужно для календаря, карточки клиента и отчётов.",
        variant: "warning"
      });
      return false;
    }

    if (!form.appointmentDate || !form.appointmentTime) {
      addToast({
        title: "Укажите дату и время",
        description: "Без даты и времени запись нельзя поставить в расписание.",
        variant: "warning"
      });
      return false;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      addToast({
        title: "Длительность некорректна",
        description: "Введите длительность в минутах больше нуля.",
        variant: "warning"
      });
      return false;
    }

    if (!Number.isFinite(price) || price < 0) {
      addToast({
        title: "Стоимость некорректна",
        description: "Стоимость не может быть отрицательной.",
        variant: "warning"
      });
      return false;
    }

    addAppointment({
      clientId: form.appointmentClientId,
      employeeId: form.appointmentEmployeeId,
      resourceId: data.resources[0]?.id,
      title,
      date: form.appointmentDate,
      time: form.appointmentTime,
      duration,
      price,
      status: "planned",
      paid: form.appointmentPaid,
      comment: form.appointmentComment.trim()
    });
    return true;
  }

  function saveTask() {
    const title = form.taskTitle.trim();

    if (!title) {
      addToast({
        title: "Укажите название задачи",
        description: "Задача без названия не поможет ответственному понять, что нужно сделать.",
        variant: "warning"
      });
      return false;
    }

    if (!form.taskResponsibleId) {
      addToast({
        title: "Выберите ответственного",
        description: "У задачи должен быть конкретный исполнитель.",
        variant: "warning"
      });
      return false;
    }

    if (!form.taskDueDate) {
      addToast({
        title: "Укажите срок выполнения",
        description: "Срок нужен для контроля просрочек и рабочего дня сотрудника.",
        variant: "warning"
      });
      return false;
    }

    const checklist = form.taskChecklist
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((title) => ({ title, done: false }));

    addTask({
      title,
      description: form.taskDescription.trim(),
      responsibleId: form.taskResponsibleId,
      dueDate: form.taskDueDate,
      priority: form.taskPriority,
      status: "new",
      checklist: checklist.length ? checklist : [{ title: "Проверить детали", done: false }]
    });
    return true;
  }

  function saveSale() {
    const amount = Number(form.saleAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      addToast({
        title: "Укажите сумму продажи",
        description: "Сумма должна быть больше нуля.",
        variant: "warning"
      });
      return false;
    }

    if (!form.saleCategory.trim()) {
      addToast({
        title: "Укажите категорию продажи",
        description: "Категория нужна для отчетов и аналитики.",
        variant: "warning"
      });
      return false;
    }

    addFinancialOperation({
      type: "income",
      category: form.saleCategory.trim(),
      amount,
      date: form.saleDate || getLocalDateKey(),
      comment: form.saleComment.trim() || "Продажа через быстрое создание",
      clientId: form.saleClientId || undefined,
      employeeId: form.saleEmployeeId || undefined
    });
    return true;
  }

  function saveProduct() {
    const name = form.productName.trim();
    const category = form.productCategory.trim();
    const supplier = form.productSupplier.trim();
    const currentStock = Number(form.productCurrentStock);
    const minStock = Number(form.productMinStock);
    const purchasePrice = Number(form.productPurchasePrice);
    const salePrice = Number(form.productSalePrice);

    if (!name) {
      addToast({
        title: form.productType === "material" ? "Укажите расходник" : "Укажите товар",
        description: "Название обязательно для складского учета.",
        variant: "warning"
      });
      return false;
    }

    if (!category) {
      addToast({
        title: "Укажите категорию",
        description: "Категория нужна для фильтрации, отчетов и закупок.",
        variant: "warning"
      });
      return false;
    }

    if (!supplier) {
      addToast({
        title: "Укажите поставщика",
        description: "Поставщик обязателен, чтобы потом понимать, где закупать позицию.",
        variant: "warning"
      });
      return false;
    }

    if (!form.productPurchasePrice.trim() || !form.productSalePrice.trim()) {
      addToast({
        title: "Укажите закупку и продажу",
        description: "При создании позиции нужно сразу заполнить закупочную и продажную цену.",
        variant: "warning"
      });
      return false;
    }

    if (
      ![currentStock, minStock, purchasePrice, salePrice].every((value) =>
        Number.isFinite(value) && value >= 0
      )
    ) {
      addToast({
        title: "Проверьте числовые поля",
        description: "Остатки, закупка и продажа должны быть заполнены и не могут быть отрицательными.",
        variant: "warning"
      });
      return false;
    }

    addProduct({
      name,
      type: form.productType,
      category,
      currentStock,
      minStock,
      purchasePrice,
      salePrice,
      supplier,
      status: getProductStatus(currentStock, minStock)
    });
    return true;
  }

  function saveEmployee() {
    const name = form.employeeName.trim();
    const position = form.employeePosition.trim();
    const email = form.employeeEmail.trim().toLowerCase();
    const baseSalary = Number(form.employeeBaseSalary);
    const commissionPercent = Number(form.employeeCommissionPercent);

    if (!name || !position) {
      addToast({
        title: "Заполните карточку сотрудника",
        description: "Для карточки сотрудника нужны ФИО и должность.",
        variant: "warning"
      });
      return false;
    }

    if (email && !emailPattern.test(email)) {
      addToast({
        title: "Email сотрудника некорректен",
        description: "Проверьте адрес или оставьте поле пустым.",
        variant: "warning"
      });
      return false;
    }

    if (![baseSalary, commissionPercent].every((value) => Number.isFinite(value) && value >= 0)) {
      addToast({
        title: "Проверьте оплату",
        description: "Фикс и процент не могут быть пустыми или отрицательными.",
        variant: "warning"
      });
      return false;
    }

    addEmployee({
      name,
      phone: form.employeePhone.trim(),
      email,
      position,
      status: "working",
      schedule: form.employeeSchedule.trim() || "09:00-18:00",
      role: form.employeeRole,
      loadPercent: 0,
      revenue: 0,
      appointmentsCount: 0,
      rating: 0,
      compensationType: form.employeeCompensationType,
      baseSalary,
      commissionPercent
    });
    return true;
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
              onClick={() => openItem(entry.type)}
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
        description={getDrawerDescription(drawerType)}
        className="max-w-2xl"
      >
        <div className="space-y-5">
          {drawerType === "client" ? renderClientForm(form, setForm, data) : null}
          {drawerType === "appointment" ? renderAppointmentForm(form, setForm, data) : null}
          {drawerType === "task" ? renderTaskForm(form, setForm, data) : null}
          {drawerType === "sale" ? renderSaleForm(form, setForm, data) : null}
          {drawerType === "product" || drawerType === "material" ? renderProductForm(form, setForm) : null}
          {drawerType === "employee" ? renderEmployeeForm(form, setForm) : null}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
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

function renderClientForm(
  form: QuickCreateForm,
  setForm: (form: QuickCreateForm) => void,
  data: WorkspaceData
) {
  return (
    <div className="space-y-4">
      <Field id="quick-client-name" label="ФИО клиента" value={form.clientName} onChange={(clientName) => setForm({ ...form, clientName })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="quick-client-phone" label="Телефон" type="tel" value={form.clientPhone} onChange={(clientPhone) => setForm({ ...form, clientPhone })} />
        <Field id="quick-client-email" label="Email" type="email" value={form.clientEmail} onChange={(clientEmail) => setForm({ ...form, clientEmail })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="quick-client-responsible"
          label="Ответственный"
          value={form.clientResponsibleId}
          onChange={(clientResponsibleId) => setForm({ ...form, clientResponsibleId })}
          options={data.employees.map((employee) => ({ value: employee.id, label: employee.name }))}
        />
        <Field
          id="quick-client-next"
          label="Следующая запись"
          type="date"
          min={getLocalDateKey()}
          value={form.clientNextAppointment}
          onChange={(clientNextAppointment) => setForm({ ...form, clientNextAppointment })}
        />
      </div>
      <TextareaField id="quick-client-notes" label="Комментарий" value={form.clientNotes} onChange={(clientNotes) => setForm({ ...form, clientNotes })} />
    </div>
  );
}

function renderAppointmentForm(
  form: QuickCreateForm,
  setForm: (form: QuickCreateForm) => void,
  data: WorkspaceData
) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="quick-appointment-client"
          label="Клиент"
          value={form.appointmentClientId}
          onChange={(appointmentClientId) => setForm({ ...form, appointmentClientId })}
          options={data.clients.map((client) => ({ value: client.id, label: client.name }))}
          emptyLabel="Нет клиентов"
        />
        <SelectField
          id="quick-appointment-employee"
          label="Сотрудник"
          value={form.appointmentEmployeeId}
          onChange={(appointmentEmployeeId) => setForm({ ...form, appointmentEmployeeId })}
          options={data.employees.map((employee) => ({ value: employee.id, label: employee.name }))}
          emptyLabel="Нет сотрудников"
        />
      </div>
      <Field id="quick-appointment-title" label="Услуга / работа" value={form.appointmentTitle} onChange={(appointmentTitle) => setForm({ ...form, appointmentTitle })} />
      <div className="grid gap-4 sm:grid-cols-4">
        <Field id="quick-appointment-date" label="Дата" type="date" min={getLocalDateKey()} value={form.appointmentDate} onChange={(appointmentDate) => setForm({ ...form, appointmentDate })} />
        <Field id="quick-appointment-time" label="Время" type="time" value={form.appointmentTime} onChange={(appointmentTime) => setForm({ ...form, appointmentTime })} />
        <Field id="quick-appointment-duration" label="Минуты" type="number" min="1" value={form.appointmentDuration} onChange={(appointmentDuration) => setForm({ ...form, appointmentDuration })} />
        <Field id="quick-appointment-price" label="Стоимость" type="number" min="0" value={form.appointmentPrice} onChange={(appointmentPrice) => setForm({ ...form, appointmentPrice })} />
      </div>
      <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={form.appointmentPaid}
          onChange={(event) => setForm({ ...form, appointmentPaid: event.target.checked })}
        />
        Оплачено
      </label>
      <TextareaField id="quick-appointment-comment" label="Комментарий" value={form.appointmentComment} onChange={(appointmentComment) => setForm({ ...form, appointmentComment })} />
    </div>
  );
}

function renderTaskForm(
  form: QuickCreateForm,
  setForm: (form: QuickCreateForm) => void,
  data: WorkspaceData
) {
  return (
    <div className="space-y-4">
      <Field id="quick-task-title" label="Название задачи" value={form.taskTitle} onChange={(taskTitle) => setForm({ ...form, taskTitle })} />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          id="quick-task-responsible"
          label="Ответственный"
          value={form.taskResponsibleId}
          onChange={(taskResponsibleId) => setForm({ ...form, taskResponsibleId })}
          options={data.employees.map((employee) => ({ value: employee.id, label: employee.name }))}
          emptyLabel="Нет сотрудников"
        />
        <Field id="quick-task-date" label="Срок" type="date" min={getLocalDateKey()} value={form.taskDueDate} onChange={(taskDueDate) => setForm({ ...form, taskDueDate })} />
        <SelectField
          id="quick-task-priority"
          label="Приоритет"
          value={form.taskPriority}
          onChange={(taskPriority) => setForm({ ...form, taskPriority: taskPriority as Priority })}
          options={priorityOptions}
        />
      </div>
      <TextareaField id="quick-task-description" label="Описание" value={form.taskDescription} onChange={(taskDescription) => setForm({ ...form, taskDescription })} />
      <TextareaField
        id="quick-task-checklist"
        label="Чек-лист"
        value={form.taskChecklist}
        onChange={(taskChecklist) => setForm({ ...form, taskChecklist })}
        placeholder="Каждый пункт с новой строки"
      />
    </div>
  );
}

function renderSaleForm(
  form: QuickCreateForm,
  setForm: (form: QuickCreateForm) => void,
  data: WorkspaceData
) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="quick-sale-amount" label="Сумма" type="number" min="1" value={form.saleAmount} onChange={(saleAmount) => setForm({ ...form, saleAmount })} />
        <Field id="quick-sale-category" label="Категория" value={form.saleCategory} onChange={(saleCategory) => setForm({ ...form, saleCategory })} />
        <Field id="quick-sale-date" label="Дата" type="date" value={form.saleDate} onChange={(saleDate) => setForm({ ...form, saleDate })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="quick-sale-client"
          label="Клиент"
          value={form.saleClientId}
          onChange={(saleClientId) => setForm({ ...form, saleClientId })}
          options={data.clients.map((client) => ({ value: client.id, label: client.name }))}
          emptyLabel="Без клиента"
          allowEmpty
        />
        <SelectField
          id="quick-sale-employee"
          label="Сотрудник"
          value={form.saleEmployeeId}
          onChange={(saleEmployeeId) => setForm({ ...form, saleEmployeeId })}
          options={data.employees.map((employee) => ({ value: employee.id, label: employee.name }))}
          emptyLabel="Без сотрудника"
          allowEmpty
        />
      </div>
      <TextareaField id="quick-sale-comment" label="Комментарий" value={form.saleComment} onChange={(saleComment) => setForm({ ...form, saleComment })} />
    </div>
  );
}

function renderProductForm(form: QuickCreateForm, setForm: (form: QuickCreateForm) => void) {
  return (
    <div className="space-y-4">
      <Field id="quick-product-name" label="Название позиции" value={form.productName} onChange={(productName) => setForm({ ...form, productName })} />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          id="quick-product-type"
          label="Тип"
          value={form.productType}
          onChange={(value) => {
            const productType = value as Product["type"];
            setForm({
              ...form,
              productType,
              productCategory:
                !form.productCategory.trim() || form.productCategory === "Товары" || form.productCategory === "Расходники"
                  ? productType === "material"
                    ? "Расходники"
                    : "Товары"
                  : form.productCategory,
              productSalePrice:
                productType === "material" && !form.productSalePrice.trim()
                  ? "0"
                  : form.productSalePrice
            });
          }}
          options={productTypeOptions}
        />
        <Field id="quick-product-category" label="Категория" value={form.productCategory} onChange={(productCategory) => setForm({ ...form, productCategory })} />
        <Field id="quick-product-supplier" label="Поставщик" value={form.productSupplier} onChange={(productSupplier) => setForm({ ...form, productSupplier })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field id="quick-product-stock" label="Остаток" type="number" min="0" value={form.productCurrentStock} onChange={(productCurrentStock) => setForm({ ...form, productCurrentStock })} />
        <Field id="quick-product-min-stock" label="Мин. остаток" type="number" min="0" value={form.productMinStock} onChange={(productMinStock) => setForm({ ...form, productMinStock })} />
        <Field id="quick-product-purchase" label="Закупка" type="number" min="0" value={form.productPurchasePrice} onChange={(productPurchasePrice) => setForm({ ...form, productPurchasePrice })} />
        <Field id="quick-product-sale" label="Продажа" type="number" min="0" value={form.productSalePrice} onChange={(productSalePrice) => setForm({ ...form, productSalePrice })} />
      </div>
    </div>
  );
}

function renderEmployeeForm(form: QuickCreateForm, setForm: (form: QuickCreateForm) => void) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="quick-employee-name" label="ФИО" value={form.employeeName} onChange={(employeeName) => setForm({ ...form, employeeName })} />
        <Field id="quick-employee-position" label="Должность" value={form.employeePosition} onChange={(employeePosition) => setForm({ ...form, employeePosition })} />
        <Field id="quick-employee-phone" label="Телефон" type="tel" value={form.employeePhone} onChange={(employeePhone) => setForm({ ...form, employeePhone })} />
        <Field id="quick-employee-email" label="Email для входа" type="email" value={form.employeeEmail} onChange={(employeeEmail) => setForm({ ...form, employeeEmail })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          id="quick-employee-role"
          label="Роль"
          value={form.employeeRole}
          onChange={(employeeRole) => setForm({ ...form, employeeRole: employeeRole as Employee["role"] })}
          options={roleOptions}
        />
        <Field id="quick-employee-schedule" label="График" value={form.employeeSchedule} onChange={(employeeSchedule) => setForm({ ...form, employeeSchedule })} />
        <SelectField
          id="quick-employee-compensation"
          label="Оплата"
          value={form.employeeCompensationType}
          onChange={(employeeCompensationType) => setForm({ ...form, employeeCompensationType: employeeCompensationType as NonNullable<Employee["compensationType"]> })}
          options={compensationOptions}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="quick-employee-base" label="Фикс, ₽" type="number" min="0" value={form.employeeBaseSalary} onChange={(employeeBaseSalary) => setForm({ ...form, employeeBaseSalary })} />
        <Field id="quick-employee-percent" label="Процент, %" type="number" min="0" value={form.employeeCommissionPercent} onChange={(employeeCommissionPercent) => setForm({ ...form, employeeCommissionPercent })} />
      </div>
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Быстрое создание добавляет карточку сотрудника. Приглашение для входа можно создать в разделе «Сотрудники».
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  placeholder
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  max?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  emptyLabel,
  allowEmpty
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  emptyLabel?: string;
  allowEmpty?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {allowEmpty || !options.length ? <option value="">{emptyLabel ?? "Не выбрано"}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function getDrawerDescription(type: QuickCreateType | null) {
  if (type === "product" || type === "material") {
    return "Заполните тип, категорию, поставщика, остатки, закупочную и продажную цену.";
  }
  if (type === "appointment") {
    return "Заполните клиента, сотрудника, дату, время, работу и стоимость.";
  }
  if (type === "client") {
    return "Заполните ФИО и минимум один контакт: телефон или email.";
  }
  if (type === "employee") {
    return "Быстро создаётся карточка сотрудника без автоматического invite.";
  }
  return "Для зарегистрированной компании данные сохраняются в Supabase, в демо-режиме - локально.";
}

function getProductStatus(currentStock: number, minStock: number): ProductStatus {
  if (currentStock <= 0) {
    return "out";
  }
  if (currentStock <= minStock / 2) {
    return "critical";
  }
  if (currentStock <= minStock) {
    return "low";
  }
  return "ok";
}
