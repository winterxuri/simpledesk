"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormDrawer } from "@/components/modules/form-drawer";
import { useAppStore } from "@/store/app-store";
import { AppIcon } from "@/lib/icons";
import { getCurrentEmployee, getScopedWorkspaceData } from "@/lib/employee-scope";
import { canPerformAction, type PermissionAction } from "@/lib/permissions";
import { getSelectablePromotions, resolvePromotionStatus, type PromotionManualMode } from "@/lib/promotion-status";
import { getResourceSlotAvailability, hasResourceSlotConflict } from "@/lib/resource-availability";
import { formatCurrency, formatDate, getLocalDateKey } from "@/lib/utils";
import type { AppointmentStatus, ClientStatus, Employee, ModuleCode, Priority, Product, ProductStatus, QuickCreateType, ResourceStatus, SalePaymentMethod, SalePaymentStatus } from "@/types";

const createItems: { type: QuickCreateType; label: string; icon: string; action: PermissionAction; module: ModuleCode }[] = [
  { type: "client", label: "Клиент", icon: "UsersRound", action: "createClients", module: "clients" },
  { type: "appointment", label: "Запись", icon: "CalendarDays", action: "createAppointments", module: "calendar" },
  { type: "task", label: "Задача", icon: "ListTodo", action: "manageTasks", module: "tasks" },
  { type: "sale", label: "Продажа", icon: "CreditCard", action: "manageSales", module: "sales" },
  { type: "product", label: "Товар", icon: "Boxes", action: "manageInventory", module: "inventory" },
  { type: "material", label: "Расходник", icon: "PackagePlus", action: "manageInventory", module: "inventory" },
  { type: "resource", label: "Ресурс", icon: "Wrench", action: "manageResources", module: "resources" },
  { type: "promotion", label: "Акция", icon: "BadgePercent", action: "managePromotions", module: "promotions" },
  { type: "employee", label: "Сотрудник", icon: "UserRoundCog", action: "manageEmployees", module: "employees" }
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" }
];

const clientStatusOptions: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Активный" },
  { value: "new", label: "Новый" },
  { value: "loyal", label: "Постоянный" },
  { value: "inactive", label: "Давно не возвращался" },
  { value: "attention", label: "Требует внимания" }
];

const appointmentStatusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: "planned", label: "Запланирована" },
  { value: "confirmed", label: "Подтверждена" },
  { value: "inProgress", label: "В работе" },
  { value: "completed", label: "Завершена" },
  { value: "cancelled", label: "Отменена" },
  { value: "noShow", label: "Не пришёл" }
];

const productTypeOptions: { value: Product["type"]; label: string }[] = [
  { value: "product", label: "Товар" },
  { value: "material", label: "Расходник" },
  { value: "part", label: "Запчасть" }
];

const resourceStatusOptions: { value: ResourceStatus; label: string }[] = [
  { value: "free", label: "Свободен" },
  { value: "busy", label: "Занят" },
  { value: "maintenance", label: "Обслуживание" },
  { value: "unavailable", label: "Недоступен" }
];

const manualStatusOptions: { value: PromotionManualMode; label: string }[] = [
  { value: "auto", label: "Автоматически по датам" },
  { value: "draft", label: "Черновик" },
  { value: "paused", label: "На паузе" }
];

const roleOptions: { value: Employee["role"]; label: string }[] = [
  { value: "admin", label: "Администратор" },
  { value: "employee", label: "Сотрудник" }
];

const paymentMethodOptions: { value: SalePaymentMethod; label: string }[] = [
  { value: "cash", label: "Наличные" },
  { value: "card", label: "Карта" },
  { value: "transfer", label: "Перевод" },
  { value: "online", label: "Онлайн" },
  { value: "mixed", label: "Смешанная оплата" }
];

const paymentStatusOptions: { value: SalePaymentStatus; label: string }[] = [
  { value: "paid", label: "Оплачено" },
  { value: "partial", label: "Частично оплачено" },
  { value: "unpaid", label: "Не оплачено" }
];

const compensationOptions: { value: NonNullable<Employee["compensationType"]>; label: string }[] = [
  { value: "fixed", label: "Фикс" },
  { value: "commission", label: "Процент" },
  { value: "mixed", label: "Фикс + процент" }
];

type WorkspaceData = ReturnType<typeof useAppStore.getState>["data"];

type QuickCreateForm = {
  clientLastName: string;
  clientFirstName: string;
  clientMiddleName: string;
  clientPhone: string;
  clientEmail: string;
  clientStatus: ClientStatus;
  clientResponsibleId: string;
  clientNextAppointment: string;
  clientSource: string;
  clientNotes: string;
  appointmentClientId: string;
  appointmentEmployeeId: string;
  appointmentTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentResourceId: string;
  appointmentPromotionId: string;
  appointmentDuration: string;
  appointmentPrice: string;
  appointmentStatus: AppointmentStatus;
  appointmentPaid: boolean;
  appointmentComment: string;
  taskTitle: string;
  taskDescription: string;
  taskResponsibleId: string;
  taskDueDate: string;
  taskPriority: Priority;
  taskChecklist: string;
  saleAmount: string;
  saleProductId: string;
  saleItemName: string;
  saleQuantity: string;
  saleCategory: string;
  saleDate: string;
  salePaymentMethod: SalePaymentMethod;
  salePaymentStatus: SalePaymentStatus;
  saleDiscountPercent: string;
  saleDiscountAmount: string;
  salePromotionId: string;
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
  resourceName: string;
  resourceType: string;
  resourceStatus: ResourceStatus;
  resourceLoadPercent: string;
  resourceCondition: string;
  resourceComment: string;
  promotionName: string;
  promotionDescription: string;
  promotionDiscount: string;
  promotionAudience: string;
  promotionPromocode: string;
  promotionStartDate: string;
  promotionEndDate: string;
  promotionManualStatus: PromotionManualMode;
  employeeName: string;
  employeePhone: string;
  employeeEmail: string;
  employeePosition: string;
  employeeRole: Employee["role"];
  employeeScheduleStart: string;
  employeeScheduleEnd: string;
  employeeCompensationType: NonNullable<Employee["compensationType"]>;
  employeeBaseSalary: string;
  employeeCommissionPercent: string;
};

function createInitialForm(
  data: WorkspaceData,
  type?: QuickCreateType,
  currentEmployee?: Employee
): QuickCreateForm {
  const today = getLocalDateKey();
  const firstEmployeeId = currentEmployee?.id ?? data.employees[0]?.id ?? "";
  const firstClientId = data.clients[0]?.id ?? "";
  const firstSaleProduct = data.products.find((product) => product.currentStock > 0) ?? data.products[0];
  const productType: Product["type"] = type === "material" ? "material" : "product";

  return {
    clientLastName: "",
    clientFirstName: "",
    clientMiddleName: "",
    clientPhone: "",
    clientEmail: "",
    clientStatus: "new",
    clientResponsibleId: firstEmployeeId,
    clientNextAppointment: "",
    clientSource: "",
    clientNotes: "",
    appointmentClientId: firstClientId,
    appointmentEmployeeId: firstEmployeeId,
    appointmentTitle: "",
    appointmentDate: today,
    appointmentTime: "12:00",
    appointmentResourceId: "",
    appointmentPromotionId: "",
    appointmentDuration: "60",
    appointmentPrice: "0",
    appointmentStatus: "planned",
    appointmentPaid: false,
    appointmentComment: "",
    taskTitle: "",
    taskDescription: "",
    taskResponsibleId: firstEmployeeId,
    taskDueDate: today,
    taskPriority: "medium",
    taskChecklist: "Проверить детали\nПодтвердить выполнение",
    saleAmount: firstSaleProduct ? String(firstSaleProduct.salePrice) : "",
    saleProductId: firstSaleProduct?.id ?? "",
    saleItemName: "",
    saleQuantity: "1",
    saleCategory: "Продажа",
    saleDate: today,
    salePaymentMethod: "cash",
    salePaymentStatus: "paid",
    saleDiscountPercent: "0",
    saleDiscountAmount: "0",
    salePromotionId: "",
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
    resourceName: "",
    resourceType: "кабинет",
    resourceStatus: "free",
    resourceLoadPercent: "0",
    resourceCondition: "исправно",
    resourceComment: "",
    promotionName: "",
    promotionDescription: "",
    promotionDiscount: "10",
    promotionAudience: "",
    promotionPromocode: "",
    promotionStartDate: today,
    promotionEndDate: today,
    promotionManualStatus: "auto",
    employeeName: "",
    employeePhone: "",
    employeeEmail: "",
    employeePosition: "",
    employeeRole: "employee",
    employeeScheduleStart: "09:00",
    employeeScheduleEnd: "18:00",
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
  const addResource = useAppStore((state) => state.addResource);
  const addPromotion = useAppStore((state) => state.addPromotion);
  const addSale = useAppStore((state) => state.addSale);
  const addToast = useAppStore((state) => state.addToast);
  const data = useAppStore((state) => state.data);
  const user = useAppStore((state) => state.user);
  const role = useAppStore((state) => state.role);
  const companyModules = useAppStore((state) => state.companyModules);
  const [form, setForm] = useState<QuickCreateForm>(() => createInitialForm(data));
  const currentEmployee = useMemo(() => getCurrentEmployee(data, user, role), [data, role, user]);
  const creationData = useMemo(() => {
    if (role !== "employee") {
      return data;
    }
    const scoped = getScopedWorkspaceData(data, user, role);
    return {
      ...data,
      clients: scoped.clients,
      appointments: scoped.appointments,
      employees: scoped.employees
    };
  }, [data, role, user]);

  const item = createItems.find((entry) => entry.type === drawerType);
  const visibleModules = new Set(
    companyModules
      .filter((module) => module.visible && module.status === "enabled")
      .map((module) => module.code)
  );
  const availableItems = createItems.filter((entry) =>
    canPerformAction(role, entry.action) && visibleModules.has(entry.module)
  );
  const canUseDrawer =
    Boolean(item) &&
    canPerformAction(role, item?.action ?? "manageSettings") &&
    visibleModules.has(item?.module ?? "dashboard");

  useEffect(() => {
    if (quickCreateOpen && drawerType) {
      setForm(createInitialForm(creationData, drawerType, currentEmployee));
    }
  }, [creationData, currentEmployee, drawerType, quickCreateOpen]);

  function openItem(type: QuickCreateType) {
    setForm(createInitialForm(creationData, type, currentEmployee));
    openQuickCreate(type);
    setMenuOpen(false);
  }

  function reset() {
    setForm(createInitialForm(creationData, drawerType ?? undefined, currentEmployee));
    setQuickCreateOpen(false);
  }

  function save() {
    if (!drawerType) {
      return;
    }

    if (!canUseDrawer) {
      addToast({
        title: "Недостаточно прав",
        description: "Это действие недоступно для текущей роли.",
        variant: "warning"
      });
      reset();
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
    if (drawerType === "resource" && !saveResource()) {
      return;
    }
    if (drawerType === "promotion" && !savePromotion()) {
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
    const name = buildFullName(form.clientLastName, form.clientFirstName, form.clientMiddleName);
    const phone = form.clientPhone.trim();
    const email = form.clientEmail.trim();
    const responsibleId =
      role === "employee"
        ? currentEmployee?.id ?? ""
        : form.clientResponsibleId || creationData.employees[0]?.id || "employee-1";

    if (!name) {
      addToast({
        title: "Укажите имя клиента",
        description: "Минимум имя или фамилия нужны для поиска, записи и истории клиента.",
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

    if (!responsibleId) {
      addToast({
        title: "Не найден сотрудник",
        description: "Создание клиента доступно только сотруднику, привязанному к карточке команды.",
        variant: "warning"
      });
      return false;
    }

    if (
      form.clientSource &&
      !getSelectablePromotions(data.promotions, getLocalDateKey()).some((promotion) => promotion.name === form.clientSource)
    ) {
      addToast({
        title: "Акция недоступна",
        description: "Выберите активную акцию или оставьте поле пустым.",
        variant: "warning"
      });
      return false;
    }

    addClient({
      name,
      phone,
      email,
      status: role === "employee" ? "new" : form.clientStatus,
      responsibleId,
      nextAppointment: form.clientNextAppointment || undefined,
      source: form.clientSource || (role === "employee" ? "Создал сотрудник" : "Быстрое создание"),
      notes: form.clientNotes.trim()
    });
    return true;
  }

  function saveAppointment() {
    const title = form.appointmentTitle.trim();
    const duration = Number(form.appointmentDuration);
    const price = role === "employee" ? 0 : Number(form.appointmentPrice);
    const employeeId =
      role === "employee"
        ? currentEmployee?.id ?? ""
        : form.appointmentEmployeeId;

    if (!creationData.clients.length || !form.appointmentClientId) {
      addToast({
        title: "Выберите клиента",
        description: "Сначала добавьте клиента или выберите существующего.",
        variant: "warning"
      });
      return false;
    }

    if (!creationData.clients.some((client) => client.id === form.appointmentClientId)) {
      addToast({
        title: "Клиент недоступен",
        description: "Сотрудник может создавать запись только для клиента из своей рабочей зоны.",
        variant: "warning"
      });
      return false;
    }

    if (!creationData.employees.length || !employeeId) {
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

    if (
      form.appointmentPromotionId &&
      !getSelectablePromotions(data.promotions, getLocalDateKey()).some((promotion) => promotion.id === form.appointmentPromotionId)
    ) {
      addToast({
        title: "Акция недоступна",
        description: "Для записи можно выбрать только активную текущую акцию.",
        variant: "warning"
      });
      return false;
    }

    if (form.appointmentResourceId) {
      const resource = data.resources.find((item) => item.id === form.appointmentResourceId);
      if (resource) {
        const availability = getResourceSlotAvailability({
          resource,
          appointments: data.appointments,
          date: form.appointmentDate,
          time: form.appointmentTime,
          duration
        });
        if (hasResourceSlotConflict(availability)) {
          addToast({
            title: "Ресурс недоступен",
            description: availability.detail,
            variant: "warning"
          });
          return false;
        }
      }
    }

    addAppointment({
      clientId: form.appointmentClientId,
      employeeId,
      resourceId: form.appointmentResourceId || undefined,
      title,
      date: form.appointmentDate,
      time: form.appointmentTime,
      duration,
      price,
      status: role === "employee" ? "planned" : form.appointmentStatus,
      paid: role === "employee" ? false : form.appointmentPaid,
      promotionId: form.appointmentPromotionId || undefined,
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
    const quantity = Number(form.saleQuantity);
    const product = data.products.find((item) => item.id === form.saleProductId);
    const itemName = product?.name ?? form.saleItemName.trim();
    const subtotal = getSaleSubtotal(form, product);
    const discountPercent = Number(form.saleDiscountPercent);
    const manualDiscountAmount = Number(form.saleDiscountAmount);
    const discountAmount = getSaleDiscountAmount(subtotal, discountPercent, manualDiscountAmount);
    const amount = Math.max(0, subtotal - discountAmount);

    if (!form.saleDate) {
      addToast({
        title: "Укажите дату продажи",
        description: "Дата нужна для отчётов, выручки и истории клиента.",
        variant: "warning"
      });
      return false;
    }

    if (!product && !itemName) {
      addToast({
        title: "Укажите, что продаёте",
        description: "Для ручной продажи нужно название услуги, работы или позиции.",
        variant: "warning"
      });
      return false;
    }

    if (product) {
      if (!Number.isFinite(quantity) || quantity <= 0) {
        addToast({
          title: "Укажите количество",
          description: "Количество товара должно быть больше нуля.",
          variant: "warning"
        });
        return false;
      }

      if (quantity > product.currentStock) {
        addToast({
          title: "Недостаточно остатка",
          description: `Сейчас доступно ${product.currentStock}. Уменьшите количество или скорректируйте склад.`,
          variant: "warning"
        });
        return false;
      }
    }

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      addToast({
        title: "Укажите сумму продажи",
        description: "Сумма до скидки должна быть больше нуля.",
        variant: "warning"
      });
      return false;
    }

    if (
      !Number.isFinite(discountPercent) ||
      !Number.isFinite(manualDiscountAmount) ||
      discountPercent < 0 ||
      discountPercent > 100 ||
      manualDiscountAmount < 0 ||
      discountAmount >= subtotal
    ) {
      addToast({
        title: "Проверьте скидку",
        description: "Скидка должна быть от 0 до 100% и меньше суммы продажи.",
        variant: "warning"
      });
      return false;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      addToast({
        title: "Укажите сумму продажи",
        description: "Итог к оплате после скидки должен быть больше нуля.",
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

    if (
      form.salePromotionId &&
      !getSelectablePromotions(data.promotions, getLocalDateKey()).some((promotion) => promotion.id === form.salePromotionId)
    ) {
      addToast({
        title: "Акция недоступна",
        description: "Для новой продажи можно выбрать только активную текущую акцию.",
        variant: "warning"
      });
      return false;
    }

    addSale({
      category: form.saleCategory.trim(),
      amount,
      date: form.saleDate,
      productId: product?.id,
      productName: itemName,
      quantity: product ? quantity : 0,
      unitPrice: product && quantity > 0 ? subtotal / quantity : subtotal,
      paymentMethod: form.salePaymentMethod,
      paymentStatus: form.salePaymentStatus,
      discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
      discountAmount,
      promotionId: form.salePromotionId || undefined,
      comment: form.saleComment.trim() || (product ? `Продажа: ${product.name} x ${quantity}` : `Продажа: ${itemName}`),
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

  function saveResource() {
    const name = form.resourceName.trim();
    const type = form.resourceType.trim();
    const loadPercent = Number(form.resourceLoadPercent);

    if (!name) {
      addToast({
        title: "Укажите название ресурса",
        description: "Название нужно для расписания, бронирования и поиска.",
        variant: "warning"
      });
      return false;
    }

    if (!type) {
      addToast({
        title: "Укажите тип ресурса",
        description: "Тип помогает отделять кабинеты, посты, залы и оборудование.",
        variant: "warning"
      });
      return false;
    }

    if (!Number.isFinite(loadPercent) || loadPercent < 0 || loadPercent > 100) {
      addToast({
        title: "Проверьте загрузку",
        description: "Загрузка должна быть числом от 0 до 100.",
        variant: "warning"
      });
      return false;
    }

    addResource({
      name,
      type,
      status: form.resourceStatus,
      loadPercent,
      futureBookings: 0,
      condition: form.resourceCondition.trim() || "не указано",
      comment: form.resourceComment.trim()
    });
    return true;
  }

  function savePromotion() {
    const name = form.promotionName.trim();
    const discount = Number(form.promotionDiscount);
    const today = getLocalDateKey();

    if (!name) {
      addToast({
        title: "Укажите название акции",
        description: "Название нужно для списка акций, карточки клиента и отчётов.",
        variant: "warning"
      });
      return false;
    }

    if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
      addToast({
        title: "Проверьте скидку",
        description: "Скидка должна быть числом от 1 до 100%.",
        variant: "warning"
      });
      return false;
    }

    if (!form.promotionStartDate || !form.promotionEndDate) {
      addToast({
        title: "Укажите период акции",
        description: "Дата начала и дата окончания обязательны для автоматического статуса.",
        variant: "warning"
      });
      return false;
    }

    if (form.promotionStartDate < today || form.promotionEndDate < today) {
      addToast({
        title: "Нельзя выбрать прошедший период",
        description: "Создавайте акцию на сегодня или будущие даты.",
        variant: "warning"
      });
      return false;
    }

    if (form.promotionEndDate < form.promotionStartDate) {
      addToast({
        title: "Период акции некорректный",
        description: "Дата окончания не может быть раньше даты начала.",
        variant: "warning"
      });
      return false;
    }

    addPromotion({
      name,
      period: buildPromotionPeriod(form.promotionStartDate, form.promotionEndDate),
      startDate: form.promotionStartDate,
      endDate: form.promotionEndDate,
      status: resolvePromotionStatus({
        startDate: form.promotionStartDate,
        endDate: form.promotionEndDate,
        manualMode: form.promotionManualStatus,
        today
      }),
      conditions: buildPromotionConditions(form.promotionDiscount, form.promotionAudience, form.promotionPromocode),
      description: form.promotionDescription.trim()
    });
    return true;
  }

  function saveEmployee() {
    const name = form.employeeName.trim();
    const position = form.employeePosition.trim();
    const email = form.employeeEmail.trim().toLowerCase();
    const schedule = buildScheduleFromTimes(form.employeeScheduleStart, form.employeeScheduleEnd);
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

    if (!isValidTimeRange(form.employeeScheduleStart, form.employeeScheduleEnd)) {
      addToast({
        title: "Проверьте график",
        description: "Время начала и окончания нужно указать в 24-часовом формате, окончание должно быть позже начала.",
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
      schedule,
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
        open={quickCreateOpen && Boolean(drawerType) && canUseDrawer}
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
          {drawerType === "client" ? renderClientForm(form, setForm, creationData, role, currentEmployee) : null}
          {drawerType === "appointment" ? renderAppointmentForm(form, setForm, creationData, role, currentEmployee) : null}
          {drawerType === "task" ? renderTaskForm(form, setForm, creationData) : null}
          {drawerType === "sale" ? renderSaleForm(form, setForm, data) : null}
          {drawerType === "product" || drawerType === "material" ? renderProductForm(form, setForm) : null}
          {drawerType === "resource" ? renderResourceForm(form, setForm) : null}
          {drawerType === "promotion" ? renderPromotionForm(form, setForm) : null}
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
  data: WorkspaceData,
  role: Employee["role"],
  currentEmployee?: Employee
) {
  const promotionOptions = getSelectablePromotions(data.promotions, getLocalDateKey()).map((promotion) => ({
    value: promotion.name,
    label: promotion.name
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="quick-client-last-name" label="Фамилия" value={form.clientLastName} onChange={(clientLastName) => setForm({ ...form, clientLastName })} />
        <Field id="quick-client-first-name" label="Имя" value={form.clientFirstName} onChange={(clientFirstName) => setForm({ ...form, clientFirstName })} />
        <Field id="quick-client-middle-name" label="Отчество" value={form.clientMiddleName} onChange={(clientMiddleName) => setForm({ ...form, clientMiddleName })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="quick-client-phone" label="Телефон" type="tel" value={form.clientPhone} onChange={(clientPhone) => setForm({ ...form, clientPhone })} />
        <Field id="quick-client-email" label="Email" type="email" value={form.clientEmail} onChange={(clientEmail) => setForm({ ...form, clientEmail })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {role === "employee" ? (
          <div className="space-y-2 sm:col-span-2">
            <Label>Ответственный</Label>
            <Input value={currentEmployee?.name ?? "Текущий сотрудник"} disabled />
          </div>
        ) : (
          <>
            <SelectField
              id="quick-client-status"
              label="Статус"
              value={form.clientStatus}
              onChange={(clientStatus) => setForm({ ...form, clientStatus: clientStatus as ClientStatus })}
              options={clientStatusOptions}
            />
            <SelectField
              id="quick-client-responsible"
              label="Ответственный"
              value={form.clientResponsibleId}
              onChange={(clientResponsibleId) => setForm({ ...form, clientResponsibleId })}
              options={data.employees.map((employee) => ({ value: employee.id, label: employee.name }))}
            />
          </>
        )}
        <Field
          id="quick-client-next"
          label="Следующая запись"
          type="date"
          min={getLocalDateKey()}
          value={form.clientNextAppointment}
          onChange={(clientNextAppointment) => setForm({ ...form, clientNextAppointment })}
        />
      </div>
      <SelectField
        id="quick-client-source"
        label="Акция / источник привлечения"
        value={form.clientSource}
        onChange={(clientSource) => setForm({ ...form, clientSource })}
        options={promotionOptions}
        emptyLabel="Без акции"
        allowEmpty
      />
      <p className="text-sm text-muted-foreground">
        В списке только активные акции. Ручной источник можно указать в комментарии.
      </p>
      <TextareaField id="quick-client-notes" label="Комментарий" value={form.clientNotes} onChange={(clientNotes) => setForm({ ...form, clientNotes })} />
    </div>
  );
}

function renderAppointmentForm(
  form: QuickCreateForm,
  setForm: (form: QuickCreateForm) => void,
  data: WorkspaceData,
  role: Employee["role"],
  currentEmployee?: Employee
) {
  const duration = Number(form.appointmentDuration) || 60;
  const resourceOptions = data.resources.map((resource) => {
    const availability = getResourceSlotAvailability({
      resource,
      appointments: data.appointments,
      date: form.appointmentDate,
      time: form.appointmentTime,
      duration
    });
    return {
      value: resource.id,
      label: `${resource.name} · ${resource.type} · ${availability.label}`
    };
  });
  const promotionOptions = getSelectablePromotions(data.promotions, getLocalDateKey()).map((promotion) => ({
    value: promotion.id,
    label: promotion.name
  }));
  const selectedResource = data.resources.find((resource) => resource.id === form.appointmentResourceId);
  const selectedAvailability = selectedResource
    ? getResourceSlotAvailability({
        resource: selectedResource,
        appointments: data.appointments,
        date: form.appointmentDate,
        time: form.appointmentTime,
        duration
      })
    : null;

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
        {role === "employee" ? (
          <div className="space-y-2">
            <Label>Сотрудник</Label>
            <Input value={currentEmployee?.name ?? "Текущий сотрудник"} disabled />
          </div>
        ) : (
          <SelectField
            id="quick-appointment-employee"
            label="Сотрудник"
            value={form.appointmentEmployeeId}
            onChange={(appointmentEmployeeId) => setForm({ ...form, appointmentEmployeeId })}
            options={data.employees.map((employee) => ({ value: employee.id, label: employee.name }))}
            emptyLabel="Нет сотрудников"
          />
        )}
      </div>
      <Field id="quick-appointment-title" label="Услуга / работа" value={form.appointmentTitle} onChange={(appointmentTitle) => setForm({ ...form, appointmentTitle })} />
      <SelectField
        id="quick-appointment-promotion"
        label="Акция"
        value={form.appointmentPromotionId}
        onChange={(appointmentPromotionId) => setForm({ ...form, appointmentPromotionId })}
        options={promotionOptions}
        emptyLabel="Без акции"
        allowEmpty
      />
      <div className={`grid gap-4 ${role === "employee" ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        <Field id="quick-appointment-date" label="Дата" type="date" min={getLocalDateKey()} value={form.appointmentDate} onChange={(appointmentDate) => setForm({ ...form, appointmentDate })} />
        <Field id="quick-appointment-time" label="Время" type="time" value={form.appointmentTime} onChange={(appointmentTime) => setForm({ ...form, appointmentTime })} />
        <Field id="quick-appointment-duration" label="Минуты" type="number" min="1" value={form.appointmentDuration} onChange={(appointmentDuration) => setForm({ ...form, appointmentDuration })} />
        {role !== "employee" ? (
          <Field id="quick-appointment-price" label="Стоимость" type="number" min="0" value={form.appointmentPrice} onChange={(appointmentPrice) => setForm({ ...form, appointmentPrice })} />
        ) : null}
      </div>
      <div className="space-y-2">
        <SelectField
          id="quick-appointment-resource"
          label="Помещение или оборудование"
          value={form.appointmentResourceId}
          onChange={(appointmentResourceId) => setForm({ ...form, appointmentResourceId })}
          options={resourceOptions}
          emptyLabel="Не требуется"
          allowEmpty
        />
        {selectedAvailability ? (
          <p className={selectedAvailability.state === "available" ? "text-sm text-emerald-600" : "text-sm text-amber-600"}>
            {selectedAvailability.detail}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Выбирайте ресурс только если запись занимает кабинет, пост, зал или оборудование.
          </p>
        )}
      </div>
      {role !== "employee" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="quick-appointment-status"
            label="Статус"
            value={form.appointmentStatus}
            onChange={(appointmentStatus) => setForm({ ...form, appointmentStatus: appointmentStatus as AppointmentStatus })}
            options={appointmentStatusOptions}
          />
          <label className="flex items-end gap-2 rounded-lg border border-border p-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={form.appointmentPaid}
              onChange={(event) => setForm({ ...form, appointmentPaid: event.target.checked })}
            />
            Оплачено
          </label>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Запись будет создана в статусе «Запланирована». Стоимость и оплату сможет указать администратор или владелец.
        </div>
      )}
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
  const product = data.products.find((item) => item.id === form.saleProductId);
  const quantity = Number(form.saleQuantity);
  const subtotal = getSaleSubtotal(form, product);
  const discountPercent = Number(form.saleDiscountPercent);
  const manualDiscountAmount = Number(form.saleDiscountAmount);
  const discountAmount = getSaleDiscountAmount(subtotal, discountPercent, manualDiscountAmount);
  const total = Math.max(0, subtotal - discountAmount);
  const productOptions = data.products.map((item) => ({
    value: item.id,
    label: `${item.name} · остаток ${item.currentStock}`
  }));
  const promotionOptions = getSelectablePromotions(data.promotions, getLocalDateKey()).map((promotion) => ({
    value: promotion.id,
    label: promotion.name
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="quick-sale-product"
          label="Товар"
          value={form.saleProductId}
          onChange={(saleProductId) => {
            const nextProduct = data.products.find((item) => item.id === saleProductId);
            setForm({
              ...form,
              saleProductId,
              saleItemName: nextProduct ? "" : form.saleItemName,
              saleCategory: nextProduct?.category ?? form.saleCategory,
              saleAmount:
                nextProduct && Number.isFinite(quantity) && quantity > 0
                  ? String(nextProduct.salePrice * quantity)
                  : form.saleAmount
            });
          }}
          options={productOptions}
          emptyLabel={data.products.length ? "Ручная продажа без товара" : "Товаров нет"}
          allowEmpty
        />
        <Field
          id="quick-sale-item-name"
          label="Услуга / ручная позиция"
          value={form.saleItemName}
          onChange={(saleItemName) => setForm({ ...form, saleItemName })}
          placeholder={product ? "Заполнится товаром" : "Например: консультация"}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="quick-sale-quantity"
          label="Количество"
          type="number"
          min="1"
          value={form.saleQuantity}
          onChange={(saleQuantity) => {
            const nextQuantity = Number(saleQuantity);
            setForm({
              ...form,
              saleQuantity,
              saleAmount:
                product && Number.isFinite(nextQuantity) && nextQuantity > 0
                  ? String(product.salePrice * nextQuantity)
                  : form.saleAmount
            });
          }}
        />
        <Field
          id="quick-sale-amount"
          label={product ? "Сумма до скидки" : "Сумма до скидки"}
          type="number"
          min="1"
          value={form.saleAmount}
          onChange={(saleAmount) => setForm({ ...form, saleAmount })}
        />
        <Field id="quick-sale-date" label="Дата" type="date" value={form.saleDate} onChange={(saleDate) => setForm({ ...form, saleDate })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="quick-sale-category" label="Категория дохода" value={form.saleCategory} onChange={(saleCategory) => setForm({ ...form, saleCategory })} />
        <SelectField
          id="quick-sale-payment-method"
          label="Способ оплаты"
          value={form.salePaymentMethod}
          onChange={(salePaymentMethod) => setForm({ ...form, salePaymentMethod: salePaymentMethod as SalePaymentMethod })}
          options={paymentMethodOptions}
        />
        <SelectField
          id="quick-sale-payment-status"
          label="Статус оплаты"
          value={form.salePaymentStatus}
          onChange={(salePaymentStatus) => setForm({ ...form, salePaymentStatus: salePaymentStatus as SalePaymentStatus })}
          options={paymentStatusOptions}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="quick-sale-discount-percent"
          label="Скидка, %"
          type="number"
          min="0"
          max="100"
          value={form.saleDiscountPercent}
          onChange={(saleDiscountPercent) => setForm({ ...form, saleDiscountPercent })}
        />
        <Field
          id="quick-sale-discount-amount"
          label="Скидка суммой"
          type="number"
          min="0"
          value={form.saleDiscountAmount}
          onChange={(saleDiscountAmount) => setForm({ ...form, saleDiscountAmount })}
        />
        <SelectField
          id="quick-sale-promotion"
          label="Акция"
          value={form.salePromotionId}
          onChange={(salePromotionId) => setForm({ ...form, salePromotionId })}
          options={promotionOptions}
          emptyLabel="Без акции"
          allowEmpty
        />
      </div>
      {product ? (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          После сохранения продажа появится в разделе «Продажи», будет создан доход и списано {Number.isFinite(quantity) && quantity > 0 ? quantity : 0} шт. со склада.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Ручная продажа попадёт в журнал продаж и финансы, но остатки склада не изменит.
        </div>
      )}
      <div className="rounded-lg border border-border bg-card p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">До скидки</span>
          <span className="font-medium">{Number.isFinite(subtotal) ? formatCurrency(subtotal) : "—"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Скидка</span>
          <span className="font-medium">{Number.isFinite(discountAmount) ? formatCurrency(discountAmount) : "—"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2">
          <span className="font-medium">К оплате</span>
          <span className="text-base font-semibold">{Number.isFinite(total) ? formatCurrency(total) : "—"}</span>
        </div>
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

function renderResourceForm(form: QuickCreateForm, setForm: (form: QuickCreateForm) => void) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="quick-resource-name" label="Название" value={form.resourceName} onChange={(resourceName) => setForm({ ...form, resourceName })} />
        <Field id="quick-resource-type" label="Тип" value={form.resourceType} onChange={(resourceType) => setForm({ ...form, resourceType })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="quick-resource-status"
          label="Статус"
          value={form.resourceStatus}
          onChange={(resourceStatus) => {
            const nextStatus = resourceStatus as ResourceStatus;
            setForm({
              ...form,
              resourceStatus: nextStatus,
              resourceLoadPercent:
                nextStatus === "free"
                  ? "0"
                  : nextStatus === "busy" && form.resourceLoadPercent === "0"
                    ? "100"
                    : form.resourceLoadPercent
            });
          }}
          options={resourceStatusOptions}
        />
        <Field
          id="quick-resource-load"
          label="Загрузка, %"
          type="number"
          min="0"
          max="100"
          value={form.resourceLoadPercent}
          onChange={(resourceLoadPercent) => setForm({ ...form, resourceLoadPercent })}
        />
      </div>
      <Field id="quick-resource-condition" label="Техническое состояние" value={form.resourceCondition} onChange={(resourceCondition) => setForm({ ...form, resourceCondition })} />
      <TextareaField id="quick-resource-comment" label="Комментарий" value={form.resourceComment} onChange={(resourceComment) => setForm({ ...form, resourceComment })} />
    </div>
  );
}

function renderPromotionForm(form: QuickCreateForm, setForm: (form: QuickCreateForm) => void) {
  const today = getLocalDateKey();
  const status = resolvePromotionStatus({
    startDate: form.promotionStartDate,
    endDate: form.promotionEndDate,
    manualMode: form.promotionManualStatus,
    today
  });

  return (
    <div className="space-y-4">
      <Field id="quick-promotion-name" label="Название" value={form.promotionName} onChange={(promotionName) => setForm({ ...form, promotionName })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="quick-promotion-discount"
          label="Скидка, %"
          type="number"
          min="1"
          max="100"
          value={form.promotionDiscount}
          onChange={(promotionDiscount) => setForm({ ...form, promotionDiscount })}
        />
        <SelectField
          id="quick-promotion-mode"
          label="Режим"
          value={form.promotionManualStatus}
          onChange={(promotionManualStatus) => setForm({ ...form, promotionManualStatus: promotionManualStatus as PromotionManualMode })}
          options={manualStatusOptions}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="quick-promotion-start"
          label="Дата начала"
          type="date"
          min={today}
          value={form.promotionStartDate}
          onChange={(promotionStartDate) => {
            setForm({
              ...form,
              promotionStartDate,
              promotionEndDate:
                form.promotionEndDate && form.promotionEndDate < promotionStartDate
                  ? promotionStartDate
                  : form.promotionEndDate
            });
          }}
        />
        <Field
          id="quick-promotion-end"
          label="Дата окончания"
          type="date"
          min={form.promotionStartDate || today}
          value={form.promotionEndDate}
          onChange={(promotionEndDate) => setForm({ ...form, promotionEndDate })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="quick-promotion-audience" label="Целевая аудитория" value={form.promotionAudience} onChange={(promotionAudience) => setForm({ ...form, promotionAudience })} />
        <Field id="quick-promotion-promocode" label="Промокод" value={form.promotionPromocode} onChange={(promotionPromocode) => setForm({ ...form, promotionPromocode })} />
      </div>
      <TextareaField id="quick-promotion-description" label="Описание и каналы продвижения" value={form.promotionDescription} onChange={(promotionDescription) => setForm({ ...form, promotionDescription })} />
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Итоговый статус после сохранения: <span className="font-medium text-foreground">{getPromotionStatusLabel(status)}</span>
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
        <SelectField
          id="quick-employee-compensation"
          label="Оплата"
          value={form.employeeCompensationType}
          onChange={(employeeCompensationType) => setForm({ ...form, employeeCompensationType: employeeCompensationType as NonNullable<Employee["compensationType"]> })}
          options={compensationOptions}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="quick-employee-schedule-start"
          label="Начало смены"
          type="time"
          value={form.employeeScheduleStart}
          onChange={(employeeScheduleStart) => setForm({ ...form, employeeScheduleStart })}
        />
        <Field
          id="quick-employee-schedule-end"
          label="Конец смены"
          type="time"
          value={form.employeeScheduleEnd}
          onChange={(employeeScheduleEnd) => setForm({ ...form, employeeScheduleEnd })}
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
    return "Заполните имя клиента, контакт и при необходимости укажите акцию или источник обращения.";
  }
  if (type === "task") {
    return "Опишите задачу, назначьте ответственного и срок выполнения.";
  }
  if (type === "sale") {
    return "Создаёт запись в журнале продаж, доход в финансах и списание товара со склада, если выбран товар.";
  }
  if (type === "resource") {
    return "Добавьте помещение, пост, зал или оборудование, которое можно бронировать вместе с записью.";
  }
  if (type === "promotion") {
    return "Заполните условия, период и режим статуса акции.";
  }
  if (type === "employee") {
    return "Создайте карточку сотрудника с ролью, графиком и базовыми условиями оплаты.";
  }
  return "Заполните обязательные поля и сохраните объект в рабочем пространстве.";
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

function getSaleSubtotal(form: QuickCreateForm, product?: Product) {
  const quantity = Number(form.saleQuantity);
  if (product && Number.isFinite(quantity) && quantity > 0) {
    return product.salePrice * quantity;
  }
  return Number(form.saleAmount);
}

function getSaleDiscountAmount(subtotal: number, discountPercent: number, manualDiscountAmount: number) {
  const percentDiscount =
    Number.isFinite(discountPercent) && discountPercent > 0
      ? subtotal * discountPercent / 100
      : 0;
  const fixedDiscount =
    Number.isFinite(manualDiscountAmount) && manualDiscountAmount > 0
      ? manualDiscountAmount
      : 0;
  return Math.min(subtotal, Math.round(percentDiscount + fixedDiscount));
}

function buildFullName(lastName: string, firstName: string, middleName: string) {
  return [lastName, firstName, middleName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function buildPromotionPeriod(startDate: string, endDate: string) {
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `с ${formatDate(startDate)}`;
  }
  if (endDate) {
    return `до ${formatDate(endDate)}`;
  }
  return "период не указан";
}

function buildPromotionConditions(discount: string, audience: string, promocode: string) {
  return [
    `${Number(discount)}%`,
    `аудитория: ${audience.trim() || "все клиенты"}`,
    promocode.trim() ? `промокод ${promocode.trim()}` : null
  ].filter(Boolean).join(", ");
}

function getPromotionStatusLabel(status: ReturnType<typeof resolvePromotionStatus>) {
  if (status === "draft") return "Черновик";
  if (status === "paused") return "На паузе";
  if (status === "scheduled") return "Запланирована";
  if (status === "ending") return "Скоро завершится";
  if (status === "finished") return "Завершена";
  return "Активна";
}

function buildScheduleFromTimes(start: string, end: string) {
  return `${start}-${end}`;
}

function isValidTimeRange(start: string, end: string) {
  return /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && end > start;
}
