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
  syncEmployee,
  syncFinancialOperation,
  syncInventoryMovement,
  syncProduct,
  syncPromotion,
  syncReportSnapshot,
  deleteReportSnapshot,
  syncTask
} from "@/lib/backend/sync";
import { createId } from "@/lib/utils";
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

interface AppStore {
  user: User | null;
  company: Company;
  theme: ThemeMode;
  role: Role;
  sessionMode: "demo" | "registered";
  onboardingComplete: boolean;
  companyModules: CompanyModule[];
  data: DemoData;
  toasts: ToastMessage[];
  quickCreateOpen: boolean;
  quickCreateType: QuickCreateType | null;
  notificationPanelOpen: boolean;
  sidebarCollapsed: boolean;
  setTheme: (theme: ThemeMode) => void;
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

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      company: defaultCompany,
      theme: "light",
      role: "owner",
      sessionMode: "demo",
      onboardingComplete: false,
      companyModules: buildDefaultCompanyModules(defaultTemplateId),
      data: createDemoData(defaultTemplateId),
      toasts: [],
      quickCreateOpen: false,
      quickCreateType: null,
      notificationPanelOpen: false,
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setRole: (role) =>
        set((state) => ({
          role,
          user: state.user ? { ...state.user, role } : state.user
        })),
      startDemoSession: () =>
        set((state) => ({
          user: state.user ?? defaultUser,
          onboardingComplete: true,
          role: state.user?.role ?? "owner",
          sessionMode: "demo"
        })),
      registerUser: ({ name, email, companyName, companyId, ownerEmployeeId }) =>
        set((state) => ({
          user: {
            id: createId("user"),
            name,
            email,
            role: "owner"
          },
          role: "owner",
          sessionMode: "registered",
          company: {
            ...state.company,
            id: companyId ?? createId("company"),
            name: companyName
          },
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
          void syncCompany(nextCompany);
          return { company: nextCompany };
        }),
      updateTerminology: (key, value) =>
        set((state) => ({
          company: {
            ...state.company,
            terminology: {
              ...state.company.terminology,
              [key]: value
            }
          }
        })),
      toggleModule: (code, enabled) =>
        set((state) => ({
          companyModules: normalizeCompanyModules(state.companyModules, state.company.businessTemplateId).map((module) => {
            if (module.code !== code || !module.availableOnTariff) {
              return module;
            }
            return {
              ...module,
              status: enabled ? "enabled" : "disabled",
              visible: enabled
            };
          })
        })),
      setModuleVisibility: (code, visible) =>
        set((state) => ({
          companyModules: normalizeCompanyModules(state.companyModules, state.company.businessTemplateId).map((module) => {
            if (module.code !== code || !module.availableOnTariff) {
              return module;
            }
            return {
              ...module,
              status: visible ? "enabled" : "hidden",
              visible
            };
          })
        })),
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

          return {
            companyModules: normalizedModules.map((module) => ({
              ...module,
              order: orderMap.get(module.code) ?? module.order
            }))
          };
        }),
      reorderNavigation: (orderedCodes) =>
        set((state) => ({
          companyModules: normalizeCompanyModules(state.companyModules, state.company.businessTemplateId).map((module) => ({
            ...module,
            order:
              orderedCodes.indexOf(module.code) >= 0
                ? orderedCodes.indexOf(module.code) + 1
                : module.order
          }))
        })),
      restoreRecommendedNavigation: () =>
        set((state) => ({
          companyModules: buildDefaultCompanyModules(
            state.company.businessTemplateId,
            state.companyModules
              .filter((module) => module.status !== "disabled" && module.status !== "unavailable")
              .map((module) => module.code)
          )
        })),
      addClient: (client) =>
        set((state) => {
          const nextClient = {
            ...client,
            id: createId("client"),
            totalSpent: 0,
            visits: 0,
            lastVisit: new Date().toISOString().slice(0, 10)
          };
          void syncClient(state.company.id, nextClient);
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
            void syncClient(state.company.id, changedClient);
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
            void syncClient(state.company.id, changedClient);
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
          void syncAppointment(state.company.id, nextAppointment);
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
            void syncAppointment(state.company.id, changedAppointment);
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
          void syncEmployee(state.company.id, nextEmployee);
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
            void syncEmployee(state.company.id, changedEmployee);
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
              dismissedAt: new Date().toISOString().slice(0, 10)
            };
            return changedEmployee;
          });
          if (changedEmployee) {
            void syncEmployee(state.company.id, changedEmployee);
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
          void deleteEmployee(state.company.id, id);

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
          void syncProduct(state.company.id, nextProduct);
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
            void syncProduct(state.company.id, changedProduct);
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
          void syncInventoryMovement(state.company.id, nextMovement);
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
          void syncTask(state.company.id, nextTask);
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
            void syncTask(state.company.id, changedTask);
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
          void syncFinancialOperation(state.company.id, nextOperation);
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
          void syncReportSnapshot(state.company.id, snapshot);
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
          void deleteReportSnapshot(state.company.id, id);
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
          void syncPromotion(state.company.id, nextPromotion);
          return {
            data: {
              ...state.data,
              promotions: [nextPromotion, ...state.data.promotions]
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
          sessionMode: "registered",
          onboardingComplete: false,
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
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        theme: state.theme,
        role: state.role,
        sessionMode: state.sessionMode,
        onboardingComplete: state.onboardingComplete,
        companyModules: state.companyModules,
        data: state.data,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
);

export const appStoreMeta = {
  productName: PRODUCT_NAME
};
