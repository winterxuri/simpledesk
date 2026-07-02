"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildDefaultCompanyModules } from "@/config/navigation";
import { PRODUCT_NAME, STORAGE_KEY } from "@/config/product";
import { getBusinessTemplate } from "@/config/templates";
import { createDemoData } from "@/data/demo-data";
import { createId } from "@/lib/utils";
import type {
  Appointment,
  Client,
  Company,
  CompanyModule,
  DemoData,
  ModuleCode,
  Promotion,
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
  aiPanelOpen: boolean;
  notificationPanelOpen: boolean;
  sidebarCollapsed: boolean;
  setTheme: (theme: ThemeMode) => void;
  setRole: (role: Role) => void;
  startDemoSession: () => void;
  registerUser: (payload: { name: string; email: string; companyName: string }) => void;
  completeOnboarding: (templateId: string, selectedModules: ModuleCode[]) => void;
  updateCompany: (company: Partial<Company>) => void;
  updateTerminology: (key: string, value: string) => void;
  toggleModule: (code: ModuleCode, enabled: boolean) => void;
  setModuleVisibility: (code: ModuleCode, visible: boolean) => void;
  moveNavigationItem: (code: ModuleCode, direction: "up" | "down") => void;
  reorderNavigation: (orderedCodes: ModuleCode[]) => void;
  restoreRecommendedNavigation: () => void;
  addClient: (client: Omit<Client, "id" | "totalSpent" | "visits" | "lastVisit">) => void;
  addAppointment: (appointment: Omit<Appointment, "id">) => void;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  toggleTaskChecklistItem: (taskId: string, itemIndex: number, done: boolean) => void;
  addPromotion: (promotion: Omit<Promotion, "id" | "usageCount" | "revenue" | "newClients" | "efficiency">) => void;
  markNotificationRead: (id: string) => void;
  setQuickCreateOpen: (open: boolean) => void;
  setAiPanelOpen: (open: boolean) => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
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
      aiPanelOpen: false,
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
      registerUser: ({ name, email, companyName }) =>
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
            id: createId("company"),
            name: companyName
          },
          onboardingComplete: false
        })),
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
          data: createDemoData(template.id),
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
        set((state) => ({
          company: {
            ...state.company,
            ...company
          }
        })),
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
          companyModules: state.companyModules.map((module) => {
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
          companyModules: state.companyModules.map((module) => {
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
          const visible = state.companyModules
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
            companyModules: state.companyModules.map((module) => ({
              ...module,
              order: orderMap.get(module.code) ?? module.order
            }))
          };
        }),
      reorderNavigation: (orderedCodes) =>
        set((state) => ({
          companyModules: state.companyModules.map((module) => ({
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
        set((state) => ({
          data: {
            ...state.data,
            clients: [
              {
                ...client,
                id: createId("client"),
                totalSpent: 0,
                visits: 0,
                lastVisit: new Date().toISOString().slice(0, 10)
              },
              ...state.data.clients
            ]
          }
        })),
      addAppointment: (appointment) =>
        set((state) => ({
          data: {
            ...state.data,
            appointments: [{ ...appointment, id: createId("appointment") }, ...state.data.appointments]
          }
        })),
      addTask: (task) =>
        set((state) => ({
          data: {
            ...state.data,
            tasks: [{ ...task, id: createId("task") }, ...state.data.tasks]
          }
        })),
      updateTask: (id, task) =>
        set((state) => ({
          data: {
            ...state.data,
            tasks: state.data.tasks.map((item) =>
              item.id === id ? { ...item, ...task } : item
            )
          }
        })),
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
        set((state) => ({
          data: {
            ...state.data,
            promotions: [
              {
                ...promotion,
                id: createId("promotion"),
                usageCount: 0,
                revenue: 0,
                newClients: 0,
                efficiency: 0
              },
              ...state.data.promotions
            ]
          }
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            notifications: state.data.notifications.map((notification) =>
              notification.id === id ? { ...notification, read: true } : notification
            )
          }
        })),
      setQuickCreateOpen: (quickCreateOpen) => set({ quickCreateOpen }),
      setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
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
