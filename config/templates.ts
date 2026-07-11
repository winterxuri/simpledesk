import type { BusinessTemplate } from "@/types";

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: "beauty",
    title: "Салон красоты",
    description: "Записи, мастера, услуги, расходники и повторные визиты.",
    icon: "Scissors",
    activeModules: [
      "dashboard",
      "calendar",
      "clients",
      "employees",
      "schedules",
      "resources",
      "inventory",
      "sales",
      "finance",
      "promotions",
      "tasks",
      "reports",
      "analytics"
    ],
    hiddenModules: ["integrations"],
    menuOrder: [
      "dashboard",
      "calendar",
      "clients",
      "employees",
      "schedules",
      "resources",
      "inventory",
      "sales",
      "finance",
      "promotions",
      "tasks",
      "reports",
      "analytics"
    ],
    terminology: {
      appointment: "запись",
      order: "заказ",
      employee: "мастер",
      client: "клиент",
      service: "услуга",
      resource: "рабочее место",
      product: "товар",
      material: "расходник"
    },
    dashboardWidgets: ["metrics", "schedule", "attention", "revenue"],
    sampleFocus: "Окрашивание, стрижки, повторные записи и расходники"
  }
];

export function getBusinessTemplate(id: string) {
  return (
    BUSINESS_TEMPLATES.find((template) => template.id === id) ??
    BUSINESS_TEMPLATES[BUSINESS_TEMPLATES.length - 1]
  );
}
