"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildDefaultCompanyModules, normalizeCompanyModules } from "@/config/navigation";
import { PRODUCT_NAME, STORAGE_KEY } from "@/config/product";
import { getBusinessTemplate } from "@/config/templates";
import { createDemoData } from "@/data/demo-data";
import { createInitialBusinessData } from "@/data/initial-data";
import {
  deleteEmployee,
  syncAppointment,
  syncClient,
  syncCompany,
  syncCompanyModules,
  syncEmployee,
  syncFinancialOperation,
  syncInventoryMovement,
  syncProduct,
  syncPromotion,
  syncReportSnapshot,
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
  FinancialOperation,
  InventoryMovement,
  ModuleCode,
  Product,
  Promotion,
  QuickCreateType,
  ReportSnapshot,
  Role,
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
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  dismissEmployee: (id: string) => void;
  deleteDismissedEmployee: (id: string) => void;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  addInventoryMovement: (movement: Omit<InventoryMovement, "id">) => void;
  addFinancialOperation: (operation: Omit<FinancialOperation, "id">) => void;
  saveReportSnapshot: (snapshot: ReportSnapshot) => void;
  deleteReportSnapshot: (id: string) => void;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  toggleTaskChecklistItem: (taskId: string, itemIndex: number, done: boolean) => void;
  addPromotion: (promotion: Omit<Promotion, "id" | "usageCount" | "revenue" | "newClients" | "efficiency">) => void;
  updatePromotion: (id: string, promotion: Partial<Promotion>) => void;
  markNotificationRead: (id: string) => void;
  logout: () => void;
  openQuickCreate: (type: QuickCreateType) => void;
  setQuickCreateOpen: (open: boolean) => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  markAllNotificationsRead: () => void;
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
          companyModules: buildDefaultCompanyModules(template.id, selectedModules),
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
          const normalizedModules = normalizeCompanyModules(state.companyModules, state.company.businessTemplateId);
          const visible = normalizedModules
            .filter((module) => module.status !== "disabled" && module.status !== "unavailable")
            .sort((a, b) => a.order - b.order);
          const index = visible.findIndex((module) => module.code === code);
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (index < 0 || targetIndex < 0 || targetIndex >= visible.length) {
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
          const companyModules = normalizeCompanyModules(state.companyModules, state.company.businessTemplateId).map((module) => ({
            ...module,
            order:
              orderedCodes.indexOf(module.code) >= 0
                ? orderedCodes.indexOf(module.code) + 1
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
          runBackendSync(get, () => syncClient(state.company.id, nextClient));
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
          runBackendSync(get, () => syncAppointment(state.company.id, nextAppointment));
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
      addEmployee: (employee) =>
        set((state) => {
          const nextEmployee = { ...employee, id: createId("employee") };
          runBackendSync(get, () => syncEmployee(state.company.id, nextEmployee));
          return {
            data: {
              ...state.data,
              employees: [nextEmployee, ...state.data.employees]
            }
          };
        }),
      updateEmployee: (id, employee) =>
        set((state) => {
          let changedEmployee: Employee | undefined;
          const employees = state.data.employees.map((item) => {
            if (item.id !== id) {
              return item;
            }
            changedEmployee = { ...item, ...employee };
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
      dismissEmployee: (id) =>
        set((state) => {
          let changedEmployee: Employee | undefined;
          const employees = state.data.employees.map((item) => {
            if (item.id !== id) {
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
          const nextOperation = { ...operation, id: createId("operation") };
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
        set((state) => ({
          data: {
            ...state.data,
            tasks: state.data.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    checklist: task.checklist.map((item, index) =>
                      index === itemIndex ? { ...item, done } : item
                    )
                  }
                : task
            )
          }
        })),
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
      markAllNotificationsRead: () =>
        set((state) => ({
          data: {
            ...state.data,
            notifications: state.data.notifications.map((notification) => ({
              ...notification,
              read: true
            }))
          }
        }))
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 2,
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
        return persisted;
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
