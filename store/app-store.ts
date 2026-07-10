"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  buildDefaultCompanyModules,
  isRequiredModule,
  normalizeCompanyModules,
  withRequiredModules
} from "@/config/navigation";
import { PRODUCT_NAME, STORAGE_KEY } from "@/config/product";
import { getBusinessTemplate } from "@/config/templates";
import { createDemoData } from "@/data/demo-data";
import { createInitialBusinessData } from "@/data/initial-data";
import {
  deleteEmployee,
  deleteEmployeeShift,
  insertAppointment,
  insertClient,
  syncAppointment,
  syncClient,
  syncCompany,
  syncCompanyModules,
  syncEmployee,
  syncEmployeeShift,
  syncFinancialOperation,
  syncInventoryMovement,
  syncNotification,
  syncProduct,
  syncPromotion,
  syncReportSnapshot,
  syncResource,
  syncSale,
  deleteReportSnapshot,
  syncTask
} from "@/lib/backend/sync";
import { createId, getLocalDateKey } from "@/lib/utils";
import type {
  Appointment,
  Client,
  Company,
  CompanyModule,
  DemoData,
  Employee,
  EmployeeShift,
  FinancialOperation,
  InventoryMovement,
  ModuleCode,
  Notification,
  Product,
  Promotion,
  QuickCreateType,
  ReportSnapshot,
  Resource,
  Role,
  Sale,
  Task,
  ThemeMode,
  ToastMessage,
  User
} from "@/types";

const defaultTemplateId = "beauty";

const defaultUser: User = {
  id: "user-1",
  name: "Алексей",
  email: "alexey@example.ru",
  role: "owner"
};

const defaultCompany: Company = {
  id: "company-1",
  name: "Студия на Петровке",
  businessTemplateId: defaultTemplateId,
  industry: "Салон красоты",
  address: "Москва, Петровка, 18",
  phone: "+7 495 120-45-80",
  email: "hello@simpledesk.demo",
  timezone: "Asia/Yekaterinburg",
  currency: "RUB",
  workDays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  workHours: {
    start: "09:00",
    end: "20:00"
  },
  terminology: getBusinessTemplate(defaultTemplateId).terminology
};

type AddSaleInput = Omit<
  Sale,
  | "id"
  | "financialOperationId"
  | "inventoryMovementId"
  | "status"
  | "paymentStatus"
  | "refundedAmount"
  | "refundedQuantity"
  | "cancelReason"
  | "cancelledAt"
> & {
  status?: Sale["status"];
  paymentStatus?: Sale["paymentStatus"];
  refundedAmount?: number;
  refundedQuantity?: number;
};

type RefundSaleInput = {
  amount: number;
  quantity?: number;
  reason?: string;
};

function createBlankRegisteredCompany(name: string, id?: string): Company {
  const template = getBusinessTemplate("universal");
  return {
    id: id ?? createId("company"),
    name,
    businessTemplateId: template.id,
    industry: template.title,
    address: "",
    phone: "",
    email: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow",
    currency: "RUB",
    workDays: ["Пн", "Вт", "Ср", "Чт", "Пт"],
    workHours: {
      start: "09:00",
      end: "18:00"
    },
    terminology: template.terminology
  };
}

interface AppStore {
  hasHydrated: boolean;
  user: User | null;
  company: Company;
  theme: ThemeMode;
  role: Role;
  sessionMode: "none" | "demo" | "registered";
  onboardingComplete: boolean;
  companyModules: CompanyModule[];
  data: DemoData;
  toasts: ToastMessage[];
  quickCreateOpen: boolean;
  quickCreateType: QuickCreateType | null;
  notificationPanelOpen: boolean;
  sidebarCollapsed: boolean;
  setTheme: (theme: ThemeMode) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setRole: (role: Role) => void;
  startDemoSession: () => void;
  registerUser: (payload: { name: string; email: string; companyName: string; companyId?: string; ownerEmployeeId?: string }) => void;
  hydrateBackendWorkspace: (payload: {
    user: User;
    company: Partial<Company> & { id: string; name: string };
    onboardingComplete: boolean;
    ownerEmployeeId?: string;
    companyModules?: CompanyModule[];
    data?: DemoData;
  }) => void;
  completeOnboarding: (templateId: string, selectedModules: ModuleCode[]) => void;
  updateCompany: (company: Partial<Company>) => void;
  updateTerminology: (key: string, value: string) => void;
  toggleModule: (code: ModuleCode, enabled: boolean) => void;
  setModuleVisibility: (code: ModuleCode, visible: boolean) => void;
  moveNavigationItem: (code: ModuleCode, direction: "up" | "down") => void;
  reorderNavigation: (orderedCodes: ModuleCode[]) => void;
  restoreRecommendedNavigation: () => void;
  addClient: (client: Omit<Client, "id" | "totalSpent" | "visits" | "lastVisit">) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  bulkUpdateClients: (ids: string[], client: Partial<Client>) => void;
  addAppointment: (appointment: Omit<Appointment, "id">) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  addEmployee: (employee: Omit<Employee, "id">) => string;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  addEmployeeShift: (shift: Omit<EmployeeShift, "id">) => void;
  updateEmployeeShift: (id: string, shift: Partial<EmployeeShift>) => void;
  deleteEmployeeShift: (id: string) => void;
  dismissEmployee: (id: string) => void;
  deleteDismissedEmployee: (id: string) => void;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  addInventoryMovement: (movement: Omit<InventoryMovement, "id">) => void;
  addFinancialOperation: (operation: Omit<FinancialOperation, "id">) => void;
  addSale: (sale: AddSaleInput) => void;
  refundSale: (id: string, refund: RefundSaleInput) => void;
  cancelSale: (id: string, reason?: string) => void;
  addResource: (resource: Omit<Resource, "id">) => void;
  updateResource: (id: string, resource: Partial<Resource>) => void;
  saveReportSnapshot: (snapshot: ReportSnapshot) => void;
  deleteReportSnapshot: (id: string) => void;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  toggleTaskChecklistItem: (taskId: string, itemIndex: number, done: boolean) => void;
  addPromotion: (promotion: Omit<Promotion, "id" | "usageCount" | "revenue" | "newClients" | "efficiency">) => void;
  updatePromotion: (id: string, promotion: Partial<Promotion>) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  logout: () => void;
  openQuickCreate: (type: QuickCreateType) => void;
  setQuickCreateOpen: (open: boolean) => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  markAllNotificationsRead: (ids?: string[]) => void;
}

function runBackendSync(get: () => AppStore, action: () => Promise<void>) {
  if (get().sessionMode !== "registered") {
    return;
  }

  void action().catch((error) => {
    console.error("Supabase sync failed", error);
    get().addToast({
      title: "Не удалось сохранить в Supabase",
      description:
        error instanceof Error
          ? `Изменение осталось локально. ${error.message}`
          : "Изменение осталось локально. Проверьте соединение и повторите действие.",
      variant: "error"
    });
  });
}

function getProductStatus(currentStock: number, minStock: number): Product["status"] {
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

const resourceStatusLabels: Record<Resource["status"], string> = {
  free: "Свободен",
  busy: "Занят",
  maintenance: "Обслуживание",
  unavailable: "Недоступен"
};

function createResourceNotification(previous: Resource, next: Resource): Omit<Notification, "id"> | null {
  const statusChanged = previous.status !== next.status;
  const conditionChanged = previous.condition !== next.condition;

  if (!statusChanged && !conditionChanged) {
    return null;
  }

  const issueDetected = /неисправ|слом|ремонт|полом/i.test(next.condition);
  const important = next.status !== "free" || issueDetected;
  const details = [
    statusChanged
      ? `Статус: ${resourceStatusLabels[previous.status]} → ${resourceStatusLabels[next.status]}.`
      : "",
    conditionChanged
      ? `Состояние: ${previous.condition || "не указано"} → ${next.condition || "не указано"}.`
      : "",
    next.comment ? `Комментарий: ${next.comment}` : ""
  ].filter(Boolean);

  return {
    title: `Ресурс: ${next.name}`,
    description: details.join(" "),
    category: "resources",
    important,
    date: getLocalDateKey(),
    read: false
  };
}

function createNewResourceNotification(resource: Resource): Omit<Notification, "id"> | null {
  const issueDetected = /неисправ|слом|ремонт|полом/i.test(resource.condition);
  if (resource.status === "free" && !issueDetected) {
    return null;
  }

  return {
    title: `Ресурс: ${resource.name}`,
    description: `Добавлен ресурс со статусом «${resourceStatusLabels[resource.status]}». ${resource.condition ? `Состояние: ${resource.condition}.` : ""}${resource.comment ? ` Комментарий: ${resource.comment}` : ""}`,
    category: "resources",
    important: resource.status !== "free" || issueDetected,
    date: getLocalDateKey(),
    read: false
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      user: null,
      company: defaultCompany,
      theme: "light",
      role: "owner",
      sessionMode: "none",
      onboardingComplete: false,
      companyModules: buildDefaultCompanyModules(defaultTemplateId),
      data: createInitialBusinessData(null),
      toasts: [],
      quickCreateOpen: false,
      quickCreateType: null,
      notificationPanelOpen: false,
      sidebarCollapsed: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setTheme: (theme) => set({ theme }),
      setRole: (role) =>
        set((state) => ({
          role,
          user: state.user ? { ...state.user, role } : state.user
        })),
      startDemoSession: () =>
        set(() => ({
          user: defaultUser,
          company: defaultCompany,
          companyModules: buildDefaultCompanyModules(defaultTemplateId),
          data: createDemoData(defaultTemplateId),
          onboardingComplete: true,
          role: "owner",
          sessionMode: "demo"
        })),
      registerUser: ({ name, email, companyName, companyId, ownerEmployeeId }) =>
        set(() => ({
          user: {
            id: createId("user"),
            name,
            email,
            role: "owner"
          },
          role: "owner",
          sessionMode: "registered",
          company: createBlankRegisteredCompany(companyName, companyId),
          companyModules: buildDefaultCompanyModules("universal"),
          data: createInitialBusinessData({ id: "owner", name, email, role: "owner" }, ownerEmployeeId),
          onboardingComplete: false
        })),
      hydrateBackendWorkspace: ({ user, company, onboardingComplete, ownerEmployeeId, companyModules, data }) =>
        set((state) => {
          const nextCompany = {
            ...state.company,
            ...company,
            businessTemplateId: company.businessTemplateId ?? state.company.businessTemplateId,
            industry: company.industry ?? state.company.industry,
            address: company.address ?? "",
            phone: company.phone ?? "",
            email: company.email ?? "",
            timezone: company.timezone ?? state.company.timezone,
            currency: company.currency ?? state.company.currency,
            workDays: company.workDays ?? state.company.workDays,
            workHours: company.workHours ?? state.company.workHours,
            terminology:
              company.terminology ??
              getBusinessTemplate(company.businessTemplateId ?? state.company.businessTemplateId).terminology
          };

          return {
            user,
            role: user.role,
            sessionMode: "registered",
            company: nextCompany,
            companyModules: normalizeCompanyModules(
              companyModules?.length ? companyModules : buildDefaultCompanyModules(nextCompany.businessTemplateId),
              nextCompany.businessTemplateId
            ),
            data: data ?? createInitialBusinessData(user, ownerEmployeeId),
            onboardingComplete
          };
        }),
      completeOnboarding: (templateId, selectedModules) => {
        const template = getBusinessTemplate(templateId);
        set((state) => ({
          company: {
            ...state.company,
            businessTemplateId: template.id,
            industry: template.title,
            terminology: template.terminology
          },
          companyModules: buildDefaultCompanyModules(template.id, withRequiredModules(selectedModules)),
          data:
            state.sessionMode === "registered"
              ? createInitialBusinessData(state.user, state.data.employees[0]?.id)
              : createDemoData(template.id),
          onboardingComplete: true
        }));
        const sessionMode = get().sessionMode;
        get().addToast({
          title: "Рабочее пространство настроено",
          description:
            sessionMode === "demo"
              ? "Шаблон применен, демонстрационные данные созданы."
              : "Шаблон применен, настройки компании сохранены.",
          variant: "success"
        });
      },
      updateCompany: (company) =>
        set((state) => {
          const nextCompany = {
            ...state.company,
            ...company
          };
          runBackendSync(get, () => syncCompany(nextCompany));
          return { company: nextCompany };
        }),
      updateTerminology: (key, value) =>
        set((state) => {
          const nextCompany = {
            ...state.company,
            terminology: {
              ...state.company.terminology,
              [key]: value
            }
          };
          runBackendSync(get, () => syncCompany(nextCompany));
          return { company: nextCompany };
        }),
      toggleModule: (code, enabled) =>
        set((state) => {
          if (isRequiredModule(code) && !enabled) {
            return state;
          }

          const companyModules = normalizeCompanyModules(state.companyModules, state.company.businessTemplateId).map((module) => {
            if (module.code !== code || !module.availableOnTariff) {
              return module;
            }
            return {
              ...module,
              status: enabled ? "enabled" as const : "disabled" as const,
              visible: enabled
            };
          });
          runBackendSync(get, () => syncCompanyModules(state.company.id, companyModules));
          return { companyModules };
        }),
      setModuleVisibility: (code, visible) =>
        set((state) => {
          if (isRequiredModule(code) && !visible) {
            return state;
          }

          const companyModules = normalizeCompanyModules(state.companyModules, state.company.businessTemplateId).map((module) => {
            if (module.code !== code || !module.availableOnTariff) {
              return module;
            }
            return {
              ...module,
              status: visible ? "enabled" as const : "hidden" as const,
              visible
            };
          });
          runBackendSync(get, () => syncCompanyModules(state.company.id, companyModules));
          return { companyModules };
        }),
      moveNavigationItem: (code, direction) =>
        set((state) => {
          if (isRequiredModule(code)) {
            return state;
          }

          const normalizedModules = normalizeCompanyModules(state.companyModules, state.company.businessTemplateId);
          const visible = normalizedModules
            .filter((module) => module.status !== "disabled" && module.status !== "unavailable")
            .sort((a, b) => a.order - b.order);
          const index = visible.findIndex((module) => module.code === code);
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (index < 0 || targetIndex < 0 || targetIndex >= visible.length) {
            return state;
          }
          if (isRequiredModule(visible[targetIndex].code)) {
            return state;
          }
          const swapped = [...visible];
          [swapped[index], swapped[targetIndex]] = [swapped[targetIndex], swapped[index]];
          const orderMap = new Map(swapped.map((module, orderIndex) => [module.code, orderIndex + 1]));

          const companyModules = normalizedModules.map((module) => ({
              ...module,
              order: orderMap.get(module.code) ?? module.order
            }));
          runBackendSync(get, () => syncCompanyModules(state.company.id, companyModules));
          return { companyModules };
        }),
      reorderNavigation: (orderedCodes) =>
        set((state) => {
          const safeOrderedCodes = [
            ...orderedCodes.filter((code) => isRequiredModule(code)),
            ...orderedCodes.filter((code) => !isRequiredModule(code))
          ];
          const companyModules = normalizeCompanyModules(state.companyModules, state.company.businessTemplateId).map((module) => ({
            ...module,
            order:
              safeOrderedCodes.indexOf(module.code) >= 0
                ? safeOrderedCodes.indexOf(module.code) + 1
                : module.order
          }));
          runBackendSync(get, () => syncCompanyModules(state.company.id, companyModules));
          return { companyModules };
        }),
      restoreRecommendedNavigation: () =>
        set((state) => {
          const companyModules = buildDefaultCompanyModules(
            state.company.businessTemplateId,
            state.companyModules
              .filter((module) => module.status !== "disabled" && module.status !== "unavailable")
              .map((module) => module.code)
          );
          runBackendSync(get, () => syncCompanyModules(state.company.id, companyModules));
          return { companyModules };
        }),
      addClient: (client) =>
        set((state) => {
          const nextClient = {
            ...client,
            id: createId("client"),
            totalSpent: 0,
            visits: 0,
            lastVisit: getLocalDateKey()
          };
          runBackendSync(get, () => insertClient(state.company.id, nextClient));
          return {
            data: {
              ...state.data,
              clients: [nextClient, ...state.data.clients]
            }
          };
        }),
      updateClient: (id, client) =>
        set((state) => {
          let changedClient: Client | undefined;
          const clients = state.data.clients.map((item) => {
            if (item.id !== id) {
              return item;
            }
            changedClient = { ...item, ...client };
            return changedClient;
          });
          if (changedClient) {
            const clientToSync = changedClient;
            runBackendSync(get, () => syncClient(state.company.id, clientToSync));
          }
          return {
            data: {
              ...state.data,
              clients
            }
          };
        }),
      bulkUpdateClients: (ids, client) =>
        set((state) => {
          const changedClients: Client[] = [];
          const clients = state.data.clients.map((item) => {
            if (!ids.includes(item.id)) {
              return item;
            }
            const changedClient = { ...item, ...client };
            changedClients.push(changedClient);
            return changedClient;
          });
          changedClients.forEach((changedClient) => {
            runBackendSync(get, () => syncClient(state.company.id, changedClient));
          });
          return {
            data: {
              ...state.data,
              clients
            }
          };
        }),
      addAppointment: (appointment) =>
        set((state) => {
          const nextAppointment = { ...appointment, id: createId("appointment") };
          runBackendSync(get, () => insertAppointment(state.company.id, nextAppointment));
          return {
            data: {
              ...state.data,
              appointments: [nextAppointment, ...state.data.appointments]
            }
          };
        }),
      updateAppointment: (id, appointment) =>
        set((state) => {
          let changedAppointment: Appointment | undefined;
          const appointments = state.data.appointments.map((item) => {
            if (item.id !== id) {
              return item;
            }
            changedAppointment = { ...item, ...appointment };
            return changedAppointment;
          });
          if (changedAppointment) {
            const appointmentToSync = changedAppointment;
            runBackendSync(get, () => syncAppointment(state.company.id, appointmentToSync));
          }
          return {
            data: {
              ...state.data,
              appointments
            }
          };
        }),
      addEmployee: (employee) => {
        const employeeId = createId("employee");
        set((state) => {
          const nextEmployee = { ...employee, id: employeeId };
          runBackendSync(get, () => syncEmployee(state.company.id, nextEmployee));
          return {
            data: {
              ...state.data,
              employees: [nextEmployee, ...state.data.employees]
            }
          };
        });
        return employeeId;
      },
      updateEmployee: (id, employee) =>
        set((state) => {
          let changedEmployee: Employee | undefined;
          const employees = state.data.employees.map((item) => {
            if (item.id !== id) {
              return item;
            }
            const patch =
              item.role === "owner"
                ? {
                    ...employee,
                    role: "owner" as const,
                    status: employee.status === "dismissed" ? item.status : employee.status
                  }
                : employee;
            changedEmployee = { ...item, ...patch };
            return changedEmployee;
          });
          if (changedEmployee) {
            const employeeToSync = changedEmployee;
            runBackendSync(get, () => syncEmployee(state.company.id, employeeToSync));
          }
          return {
            data: {
              ...state.data,
              employees
            }
          };
        }),
      addEmployeeShift: (shift) =>
        set((state) => {
          const existingShift = state.data.employeeShifts.find(
            (item) => item.employeeId === shift.employeeId && item.date === shift.date
          );
          if (existingShift) {
            const updatedShift: EmployeeShift = { ...existingShift, ...shift };
            runBackendSync(get, () => syncEmployeeShift(state.company.id, updatedShift));
            return {
              data: {
                ...state.data,
                employeeShifts: state.data.employeeShifts.map((item) =>
                  item.id === existingShift.id ? updatedShift : item
                )
              }
            };
          }
          const nextShift: EmployeeShift = { ...shift, id: createId("shift") };
          runBackendSync(get, () => syncEmployeeShift(state.company.id, nextShift));
          return {
            data: {
              ...state.data,
              employeeShifts: [nextShift, ...state.data.employeeShifts]
            }
          };
        }),
      updateEmployeeShift: (id, shift) =>
        set((state) => {
          let changedShift: EmployeeShift | undefined;
          const employeeShifts = state.data.employeeShifts.map((item) => {
            if (item.id !== id) {
              return item;
            }
            changedShift = { ...item, ...shift };
            return changedShift;
          });
          if (changedShift) {
            const shiftToSync = changedShift;
            runBackendSync(get, () => syncEmployeeShift(state.company.id, shiftToSync));
          }
          return {
            data: {
              ...state.data,
              employeeShifts
            }
          };
        }),
      deleteEmployeeShift: (id) =>
        set((state) => {
          const shift = state.data.employeeShifts.find((item) => item.id === id);
          if (shift) {
            runBackendSync(get, () => deleteEmployeeShift(state.company.id, id));
          }
          return {
            data: {
              ...state.data,
              employeeShifts: state.data.employeeShifts.filter((item) => item.id !== id)
            }
          };
        }),
      dismissEmployee: (id) =>
        set((state) => {
          let changedEmployee: Employee | undefined;
          const employees = state.data.employees.map((item) => {
            if (item.id !== id) {
              return item;
            }
            if (item.role === "owner") {
              return item;
            }
            changedEmployee = {
              ...item,
              status: "dismissed",
              dismissedAt: getLocalDateKey()
            };
            return changedEmployee;
          });
          if (changedEmployee) {
            const employeeToSync = changedEmployee;
            runBackendSync(get, () => syncEmployee(state.company.id, employeeToSync));
          }
          return {
            data: {
              ...state.data,
              employees
            }
          };
        }),
      deleteDismissedEmployee: (id) =>
        set((state) => {
          const target = state.data.employees.find((employee) => employee.id === id);
          if (!target || target.status !== "dismissed" || target.role === "owner") {
            return state;
          }

          const employees = state.data.employees.filter((employee) => employee.id !== id);
          const fallbackEmployeeId = employees[0]?.id ?? "";
          runBackendSync(get, () => deleteEmployee(state.company.id, id));

          return {
            data: {
              ...state.data,
              employees,
              clients: state.data.clients.map((client) =>
                client.responsibleId === id
                  ? { ...client, responsibleId: fallbackEmployeeId }
                  : client
              ),
              appointments: state.data.appointments.map((appointment) =>
                appointment.employeeId === id
                  ? { ...appointment, employeeId: fallbackEmployeeId }
                  : appointment
              ),
              tasks: state.data.tasks.map((task) =>
                task.responsibleId === id
                  ? { ...task, responsibleId: fallbackEmployeeId }
                  : task
              ),
              financialOperations: state.data.financialOperations.map((operation) =>
                operation.employeeId === id
                  ? { ...operation, employeeId: undefined }
                  : operation
              ),
              sales: (state.data.sales ?? []).map((sale) =>
                sale.employeeId === id
                  ? { ...sale, employeeId: undefined }
                  : sale
              )
            }
          };
        }),
      addProduct: (product) =>
        set((state) => {
          const nextProduct = { ...product, id: createId("product") };
          runBackendSync(get, () => syncProduct(state.company.id, nextProduct));
          return {
            data: {
              ...state.data,
              products: [nextProduct, ...state.data.products]
            }
          };
        }),
      updateProduct: (id, product) =>
        set((state) => {
          let changedProduct: Product | undefined;
          const products = state.data.products.map((item) => {
            if (item.id !== id) {
              return item;
            }
            changedProduct = { ...item, ...product };
            return changedProduct;
          });
          if (changedProduct) {
            const productToSync = changedProduct;
            runBackendSync(get, () => syncProduct(state.company.id, productToSync));
          }
          return {
            data: {
              ...state.data,
              products
            }
          };
        }),
      addInventoryMovement: (movement) =>
        set((state) => {
          const nextMovement = { ...movement, id: createId("movement") };
          runBackendSync(get, () => syncInventoryMovement(state.company.id, nextMovement));
          return {
            data: {
              ...state.data,
              inventoryMovements: [
                nextMovement,
                ...state.data.inventoryMovements
              ]
            }
          };
        }),
      addTask: (task) =>
        set((state) => {
          const nextTask = { ...task, id: createId("task") };
          runBackendSync(get, () => syncTask(state.company.id, nextTask));
          return {
            data: {
              ...state.data,
              tasks: [nextTask, ...state.data.tasks]
            }
          };
        }),
      updateTask: (id, task) =>
        set((state) => {
          let changedTask: Task | undefined;
          const tasks = state.data.tasks.map((item) => {
            if (item.id !== id) {
              return item;
            }
            changedTask = { ...item, ...task };
            return changedTask;
          });
          if (changedTask) {
            const taskToSync = changedTask;
            runBackendSync(get, () => syncTask(state.company.id, taskToSync));
          }
          return {
            data: {
              ...state.data,
              tasks
            }
          };
        }),
      addFinancialOperation: (operation) =>
        set((state) => {
          const nextOperation: FinancialOperation = {
            ...operation,
            id: createId("operation"),
            paymentMethod: operation.paymentMethod ?? "cash",
            source: operation.source ?? "manual"
          };
          runBackendSync(get, () => syncFinancialOperation(state.company.id, nextOperation));
          return {
            data: {
              ...state.data,
              financialOperations: [
                nextOperation,
                ...state.data.financialOperations
              ],
              clients:
                operation.type === "income" && operation.clientId
                  ? state.data.clients.map((client) =>
                      client.id === operation.clientId
                        ? {
                            ...client,
                            totalSpent: client.totalSpent + operation.amount,
                            visits: client.visits + 1,
                            lastVisit: operation.date
                          }
                        : client
                    )
                  : state.data.clients,
              employees:
                operation.type === "income" && operation.employeeId
                  ? state.data.employees.map((employee) =>
                      employee.id === operation.employeeId
                        ? {
                            ...employee,
                            revenue: employee.revenue + operation.amount
                          }
                        : employee
                    )
              : state.data.employees
            }
          };
        }),
      addSale: (sale) =>
        set((state) => {
          const product = sale.productId
            ? state.data.products.find((item) => item.id === sale.productId)
            : undefined;
          const status = sale.status ?? "completed";
          const discountPercent = Math.max(0, sale.discountPercent ?? 0);
          const discountAmount = Math.max(0, sale.discountAmount ?? 0);

          if (!Number.isFinite(sale.amount) || sale.amount <= 0) {
            get().addToast({
              title: "Укажите сумму продажи",
              description: "Сумма должна быть больше нуля.",
              variant: "warning"
            });
            return state;
          }

          if (discountPercent > 100 || discountAmount > sale.amount + discountAmount) {
            get().addToast({
              title: "Проверьте скидку",
              description: "Скидка не может быть больше суммы продажи.",
              variant: "warning"
            });
            return state;
          }

          if (product && (!Number.isFinite(sale.quantity) || sale.quantity <= 0)) {
            get().addToast({
              title: "Укажите количество",
              description: "Количество товара должно быть больше нуля.",
              variant: "warning"
            });
            return state;
          }

          if (status === "completed" && product && sale.quantity > product.currentStock) {
            get().addToast({
              title: "Недостаточно остатка",
              description: `Сейчас по позиции "${product.name}" доступно ${product.currentStock} шт.`,
              variant: "warning"
            });
            return state;
          }

          const saleId = createId("sale");
          const financialOperationId = status === "completed" ? createId("operation") : undefined;
          const inventoryMovementId = status === "completed" && product ? createId("movement") : undefined;
          const productName = sale.productName.trim() || product?.name || sale.category;
          const quantity = product ? sale.quantity : 0;
          const unitPrice =
            sale.unitPrice > 0
              ? sale.unitPrice
              : quantity > 0
                ? Math.round(sale.amount / quantity)
                : sale.amount;
          const nextSale: Sale = {
            ...sale,
            id: saleId,
            productId: product?.id,
            productName,
            quantity,
            unitPrice,
            paymentMethod: sale.paymentMethod ?? "cash",
            paymentStatus: sale.paymentStatus ?? "paid",
            discountPercent,
            discountAmount,
            status,
            financialOperationId,
            inventoryMovementId,
            comment: sale.comment.trim(),
            refundedAmount: sale.refundedAmount ?? 0,
            refundedQuantity: sale.refundedQuantity ?? 0
          };
          const nextOperation: FinancialOperation | undefined = financialOperationId
            ? {
                id: financialOperationId,
                type: "income",
                category: sale.category,
                amount: sale.amount,
                date: sale.date,
                comment: nextSale.comment || `Продажа: ${productName}`,
                paymentMethod: nextSale.paymentMethod,
                source: sale.appointmentId ? "appointment" : "sale",
                clientId: sale.clientId,
                employeeId: sale.employeeId,
                appointmentId: sale.appointmentId
              }
            : undefined;
          const nextMovement: InventoryMovement | undefined = inventoryMovementId && product
            ? {
                id: inventoryMovementId,
                productId: product.id,
                type: "writeOff",
                quantity,
                date: sale.date,
                comment: `Продажа: ${productName}${sale.clientId ? " клиенту" : ""}`
              }
            : undefined;
          let changedProduct: Product | undefined;
          let changedClient: Client | undefined;
          let changedEmployee: Employee | undefined;
          let changedAppointment: Appointment | undefined;
          let changedPromotion: Promotion | undefined;

          const products =
            status === "completed" && product
              ? state.data.products.map((item) => {
                  if (item.id !== product.id) {
                    return item;
                  }
                  const nextStock = Math.max(0, item.currentStock - quantity);
                  changedProduct = {
                    ...item,
                    currentStock: nextStock,
                    status: getProductStatus(nextStock, item.minStock)
                  };
                  return changedProduct;
                })
              : state.data.products;
          const clients =
            status === "completed" && sale.clientId
              ? state.data.clients.map((client) => {
                  if (client.id !== sale.clientId) {
                    return client;
                  }
                  changedClient = {
                    ...client,
                    totalSpent: client.totalSpent + sale.amount,
                    visits: client.visits + 1,
                    lastVisit: sale.date
                  };
                  return changedClient;
                })
              : state.data.clients;
          const employees =
            status === "completed" && sale.employeeId
              ? state.data.employees.map((employee) => {
                  if (employee.id !== sale.employeeId) {
                    return employee;
                  }
                  changedEmployee = {
                    ...employee,
                    revenue: employee.revenue + sale.amount
                  };
                  return changedEmployee;
                })
              : state.data.employees;
          const appointments =
            status === "completed" && sale.appointmentId
              ? state.data.appointments.map((appointment) => {
                  if (appointment.id !== sale.appointmentId) {
                    return appointment;
                  }
                  changedAppointment = {
                    ...appointment,
                    price: sale.amount,
                    status: "completed",
                    paid: true,
                    promotionId: sale.promotionId ?? appointment.promotionId
                  };
                  return changedAppointment;
                })
              : state.data.appointments;
          const promotions =
            status === "completed" && sale.promotionId
              ? state.data.promotions.map((promotion) => {
                  if (promotion.id !== sale.promotionId) {
                    return promotion;
                  }
                  changedPromotion = {
                    ...promotion,
                    usageCount: promotion.usageCount + 1,
                    revenue: promotion.revenue + sale.amount,
                    newClients:
                      sale.clientId &&
                      state.data.clients.find((client) => client.id === sale.clientId)?.visits === 0
                        ? promotion.newClients + 1
                        : promotion.newClients
                  };
                  return changedPromotion;
                })
              : state.data.promotions;

          const companyId = state.company.id;
          const productToSync = changedProduct;
          const clientToSync = changedClient;
          const employeeToSync = changedEmployee;
          const appointmentToSync = changedAppointment;
          const promotionToSync = changedPromotion;
          runBackendSync(get, async () => {
            if (nextOperation) {
              await syncFinancialOperation(companyId, nextOperation);
            }
            if (nextMovement) {
              await syncInventoryMovement(companyId, nextMovement);
            }
            await syncSale(companyId, nextSale);
            if (productToSync) {
              await syncProduct(companyId, productToSync);
            }
            if (clientToSync) {
              await syncClient(companyId, clientToSync);
            }
            if (employeeToSync) {
              await syncEmployee(companyId, employeeToSync);
            }
            if (appointmentToSync) {
              await syncAppointment(companyId, appointmentToSync);
            }
            if (promotionToSync) {
              await syncPromotion(companyId, promotionToSync);
            }
          });

          return {
            data: {
              ...state.data,
              sales: [nextSale, ...(state.data.sales ?? [])],
              financialOperations: nextOperation
                ? [nextOperation, ...state.data.financialOperations]
                : state.data.financialOperations,
              inventoryMovements: nextMovement
                ? [nextMovement, ...state.data.inventoryMovements]
                : state.data.inventoryMovements,
              products,
              clients,
              employees,
              appointments,
              promotions
            }
          };
        }),
      refundSale: (id, refund) =>
        set((state) => {
          const currentSale = (state.data.sales ?? []).find((sale) => sale.id === id);
          if (
            !currentSale ||
            currentSale.status === "cancelled" ||
            currentSale.status === "refunded"
          ) {
            return state;
          }

          const alreadyRefundedAmount = currentSale.refundedAmount ?? 0;
          const alreadyRefundedQuantity = currentSale.refundedQuantity ?? 0;
          const remainingAmount = Math.max(0, currentSale.amount - alreadyRefundedAmount);
          const remainingQuantity = Math.max(0, currentSale.quantity - alreadyRefundedQuantity);
          const refundAmount = Math.round(refund.amount);
          const refundQuantity = currentSale.productId
            ? Number(refund.quantity ?? remainingQuantity)
            : 0;

          if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > remainingAmount) {
            get().addToast({
              title: "Проверьте сумму возврата",
              description: `Можно вернуть от 1 до ${remainingAmount}.`,
              variant: "warning"
            });
            return state;
          }

          if (
            currentSale.productId &&
            (!Number.isFinite(refundQuantity) || refundQuantity <= 0 || refundQuantity > remainingQuantity)
          ) {
            get().addToast({
              title: "Проверьте количество возврата",
              description: `Можно вернуть от 1 до ${remainingQuantity} шт.`,
              variant: "warning"
            });
            return state;
          }

          const refundDate = getLocalDateKey();
          const nextRefundedAmount = alreadyRefundedAmount + refundAmount;
          const nextRefundedQuantity = alreadyRefundedQuantity + refundQuantity;
          const fullAmountRefunded = nextRefundedAmount >= currentSale.amount;
          const fullQuantityRefunded = currentSale.productId
            ? nextRefundedQuantity >= currentSale.quantity
            : true;
          const nextStatus: Sale["status"] = fullAmountRefunded && fullQuantityRefunded
            ? "refunded"
            : "partiallyRefunded";
          const refundOperation: FinancialOperation = {
            id: createId("operation"),
            type: "expense",
            category: "Возврат продажи",
            amount: refundAmount,
            date: refundDate,
            comment: refund.reason?.trim()
              ? `Возврат продажи: ${refund.reason?.trim()}`
              : `Возврат продажи: ${currentSale.productName}`,
            paymentMethod: currentSale.paymentMethod,
            source: "refund",
            clientId: currentSale.clientId,
            employeeId: currentSale.employeeId
          };
          const product = currentSale.productId
            ? state.data.products.find((item) => item.id === currentSale.productId)
            : undefined;
          const returnMovement: InventoryMovement | undefined = product
            ? {
                id: createId("movement"),
                productId: product.id,
                type: "income",
                quantity: refundQuantity,
                date: refundDate,
                comment: `Возврат продажи: ${currentSale.productName}`
              }
            : undefined;
          let changedProduct: Product | undefined;
          let changedClient: Client | undefined;
          let changedEmployee: Employee | undefined;
          let changedSale: Sale | undefined;

          const sales = (state.data.sales ?? []).map((sale) => {
            if (sale.id !== id) {
              return sale;
            }
            changedSale = {
              ...sale,
              status: nextStatus,
              paymentStatus: nextStatus === "refunded" ? "refunded" : "partial",
              refundedAmount: nextRefundedAmount,
              refundedQuantity: nextRefundedQuantity,
              cancelReason: refund.reason?.trim() || "Возврат продажи",
              cancelledAt: refundDate
            };
            return changedSale;
          });
          const products =
            product && returnMovement
              ? state.data.products.map((item) => {
                  if (item.id !== product.id) {
                    return item;
                  }
                  const nextStock = item.currentStock + refundQuantity;
                  changedProduct = {
                    ...item,
                    currentStock: nextStock,
                    status: getProductStatus(nextStock, item.minStock)
                  };
                  return changedProduct;
                })
              : state.data.products;
          const clients = currentSale.clientId
            ? state.data.clients.map((client) => {
                if (client.id !== currentSale.clientId) {
                  return client;
                }
                changedClient = {
                  ...client,
                  totalSpent: Math.max(0, client.totalSpent - refundAmount),
                  visits: nextStatus === "refunded" ? Math.max(0, client.visits - 1) : client.visits
                };
                return changedClient;
              })
            : state.data.clients;
          const employees = currentSale.employeeId
            ? state.data.employees.map((employee) => {
                if (employee.id !== currentSale.employeeId) {
                  return employee;
                }
                changedEmployee = {
                  ...employee,
                  revenue: Math.max(0, employee.revenue - refundAmount)
                };
                return changedEmployee;
              })
            : state.data.employees;

          const companyId = state.company.id;
          const saleToSync = changedSale;
          const productToSync = changedProduct;
          const clientToSync = changedClient;
          const employeeToSync = changedEmployee;
          runBackendSync(get, async () => {
            await syncFinancialOperation(companyId, refundOperation);
            if (returnMovement) {
              await syncInventoryMovement(companyId, returnMovement);
            }
            if (saleToSync) {
              await syncSale(companyId, saleToSync);
            }
            if (productToSync) {
              await syncProduct(companyId, productToSync);
            }
            if (clientToSync) {
              await syncClient(companyId, clientToSync);
            }
            if (employeeToSync) {
              await syncEmployee(companyId, employeeToSync);
            }
          });

          return {
            data: {
              ...state.data,
              sales,
              financialOperations: [refundOperation, ...state.data.financialOperations],
              inventoryMovements: returnMovement
                ? [returnMovement, ...state.data.inventoryMovements]
                : state.data.inventoryMovements,
              products,
              clients,
              employees
            }
          };
        }),
      cancelSale: (id, reason) => {
        const sale = get().data.sales.find((item) => item.id === id);
        if (!sale) {
          return;
        }
        get().refundSale(id, {
          amount: Math.max(0, sale.amount - (sale.refundedAmount ?? 0)),
          quantity: Math.max(0, sale.quantity - (sale.refundedQuantity ?? 0)),
          reason
        });
      },
      addResource: (resource) =>
        set((state) => {
          const nextResource = { ...resource, id: createId("resource") };
          const notification = createNewResourceNotification(nextResource);
          const nextNotification: Notification | null = notification
            ? { ...notification, id: createId("notification") }
            : null;
          runBackendSync(get, async () => {
            await syncResource(state.company.id, nextResource);
            if (nextNotification) {
              await syncNotification(state.company.id, nextNotification);
            }
          });
          return {
            data: {
              ...state.data,
              resources: [nextResource, ...state.data.resources],
              notifications: nextNotification
                ? [nextNotification, ...state.data.notifications]
                : state.data.notifications
            }
          };
        }),
      updateResource: (id, resource) =>
        set((state) => {
          let previousResource: Resource | undefined;
          let changedResource: Resource | undefined;
          const resources = state.data.resources.map((item) => {
            if (item.id !== id) {
              return item;
            }
            previousResource = item;
            changedResource = { ...item, ...resource };
            return changedResource;
          });
          const notification =
            previousResource && changedResource
              ? createResourceNotification(previousResource, changedResource)
              : null;
          const nextNotification: Notification | null = notification
            ? { ...notification, id: createId("notification") }
            : null;
          if (changedResource) {
            const resourceToSync = changedResource;
            runBackendSync(get, async () => {
              await syncResource(state.company.id, resourceToSync);
              if (nextNotification) {
                await syncNotification(state.company.id, nextNotification);
              }
            });
          }
          return {
            data: {
              ...state.data,
              resources,
              notifications: nextNotification
                ? [nextNotification, ...state.data.notifications]
                : state.data.notifications
            }
          };
        }),
      saveReportSnapshot: (snapshot) =>
        set((state) => {
          runBackendSync(get, () => syncReportSnapshot(state.company.id, snapshot));
          const currentReports = state.data.reportSnapshots ?? [];
          const existing = currentReports.some((report) => report.id === snapshot.id);

          return {
            data: {
              ...state.data,
              reportSnapshots: existing
                ? currentReports.map((report) => report.id === snapshot.id ? snapshot : report)
                : [snapshot, ...currentReports]
            }
          };
        }),
      deleteReportSnapshot: (id) =>
        set((state) => {
          runBackendSync(get, () => deleteReportSnapshot(state.company.id, id));
          return {
            data: {
              ...state.data,
              reportSnapshots: (state.data.reportSnapshots ?? []).filter((report) => report.id !== id)
            }
          };
        }),
      toggleTaskChecklistItem: (taskId, itemIndex, done) =>
        set((state) => {
          let changedTask: Task | undefined;
          const tasks = state.data.tasks.map((task) => {
            if (task.id !== taskId) {
              return task;
            }

            changedTask = {
              ...task,
              checklist: task.checklist.map((item, index) =>
                index === itemIndex ? { ...item, done } : item
              )
            };
            return changedTask;
          });

          if (changedTask) {
            const taskToSync = changedTask;
            runBackendSync(get, () => syncTask(state.company.id, taskToSync));
          }

          return {
            data: {
              ...state.data,
              tasks
            }
          };
        }),
      addPromotion: (promotion) =>
        set((state) => {
          const nextPromotion = {
            ...promotion,
            id: createId("promotion"),
            usageCount: 0,
            revenue: 0,
            newClients: 0,
            efficiency: 0
          };
          runBackendSync(get, () => syncPromotion(state.company.id, nextPromotion));
          return {
            data: {
              ...state.data,
              promotions: [nextPromotion, ...state.data.promotions]
            }
          };
        }),
      updatePromotion: (id, promotion) =>
        set((state) => {
          let changedPromotion: Promotion | undefined;
          const promotions = state.data.promotions.map((item) => {
            if (item.id !== id) {
              return item;
            }
            changedPromotion = { ...item, ...promotion };
            return changedPromotion;
          });
          if (changedPromotion) {
            const promotionToSync = changedPromotion;
            runBackendSync(get, () => syncPromotion(state.company.id, promotionToSync));
          }
          return {
            data: {
              ...state.data,
              promotions
            }
          };
        }),
      markNotificationRead: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            notifications: state.data.notifications.map((notification) =>
              notification.id === id ? { ...notification, read: true } : notification
            )
          }
        })),
      addNotification: (notification) =>
        set((state) => {
          const nextNotification: Notification = {
            ...notification,
            id: createId("notification")
          };
          runBackendSync(get, () => syncNotification(state.company.id, nextNotification));
          return {
            data: {
              ...state.data,
              notifications: [nextNotification, ...state.data.notifications]
            }
          };
        }),
      logout: () =>
        set({
          user: null,
          role: "owner",
          sessionMode: "none",
          onboardingComplete: false,
          company: defaultCompany,
          companyModules: buildDefaultCompanyModules(defaultTemplateId),
          data: createInitialBusinessData(null),
          quickCreateOpen: false,
          quickCreateType: null,
          notificationPanelOpen: false
        }),
      openQuickCreate: (quickCreateType) => set({ quickCreateType, quickCreateOpen: true }),
      setQuickCreateOpen: (quickCreateOpen) =>
        set((state) => ({
          quickCreateOpen,
          quickCreateType: quickCreateOpen ? state.quickCreateType : null
        })),
      setNotificationPanelOpen: (notificationPanelOpen) =>
        set({ notificationPanelOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            {
              ...toast,
              id: createId("toast")
            }
          ]
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id)
        })),
      markAllNotificationsRead: (ids) =>
        set((state) => ({
          data: {
            ...state.data,
            notifications: state.data.notifications.map((notification) => ({
              ...notification,
              read: ids && !ids.includes(notification.id) ? notification.read : true
            }))
          }
        }))
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== "object") {
          return persisted;
        }
        const state = persisted as Partial<AppStore>;
        if (state.sessionMode === "demo") {
          return {
            ...state,
            user: null,
            sessionMode: "none",
            onboardingComplete: false,
            company: defaultCompany,
            companyModules: buildDefaultCompanyModules(defaultTemplateId),
            data: createInitialBusinessData(null)
          };
        }
        const templateId = state.company?.businessTemplateId ?? defaultTemplateId;
        return {
          ...state,
          companyModules: state.companyModules
            ? normalizeCompanyModules(state.companyModules, templateId)
            : state.companyModules,
          data: state.data
            ? {
              ...state.data,
              employeeShifts: Array.isArray(state.data.employeeShifts)
                ? state.data.employeeShifts
                : [],
              sales: Array.isArray(state.data.sales)
                ? state.data.sales.map((sale) => ({
                    ...sale,
                    paymentMethod: sale.paymentMethod ?? "cash",
                    paymentStatus: sale.paymentStatus ?? (sale.status === "refunded" ? "refunded" : "paid"),
                    discountPercent: sale.discountPercent ?? 0,
                    discountAmount: sale.discountAmount ?? 0,
                    refundedAmount: sale.refundedAmount ?? (sale.status === "refunded" ? sale.amount : 0),
                    refundedQuantity: sale.refundedQuantity ?? (sale.status === "refunded" ? sale.quantity : 0)
                  }))
                : []
            }
            : state.data
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => {
        if (state.sessionMode === "none") {
          return {
            theme: state.theme,
            sidebarCollapsed: state.sidebarCollapsed
          };
        }

        if (state.sessionMode === "demo") {
          return {
            user: defaultUser,
            company: defaultCompany,
            theme: state.theme,
            role: state.role,
            sessionMode: "demo",
            onboardingComplete: true,
            companyModules: buildDefaultCompanyModules(defaultTemplateId),
            data: createDemoData(defaultTemplateId),
            sidebarCollapsed: state.sidebarCollapsed
          };
        }

        return {
          user: state.user,
          company: state.company,
          theme: state.theme,
          role: state.role,
          sessionMode: state.sessionMode,
          onboardingComplete: state.onboardingComplete,
          companyModules: state.companyModules,
          data: state.data,
          sidebarCollapsed: state.sidebarCollapsed
        };
      }
    }
  )
);

export const appStoreMeta = {
  productName: PRODUCT_NAME
};
