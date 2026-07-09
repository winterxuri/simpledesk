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
      "resources",
      "inventory",
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
      "resources",
      "inventory",
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
  },
  {
    id: "auto",
    title: "Автосервис",
    description: "Заказ-наряды, механики, автомобили, посты и запчасти.",
    icon: "CarFront",
    activeModules: [
      "dashboard",
      "calendar",
      "clients",
      "employees",
      "resources",
      "inventory",
      "tasks",
      "reports",
      "analytics"
    ],
    hiddenModules: ["promotions", "integrations"],
    menuOrder: [
      "dashboard",
      "calendar",
      "clients",
      "resources",
      "inventory",
      "employees",
      "tasks",
      "reports",
      "analytics"
    ],
    terminology: {
      appointment: "заказ-наряд",
      order: "заказ-наряд",
      employee: "механик",
      client: "клиент",
      service: "работа",
      resource: "рабочий пост",
      product: "запчасть",
      material: "расходник"
    },
    dashboardWidgets: ["metrics", "schedule", "attention", "resources"],
    sampleFocus: "Посты, механики, запчасти и повторные обращения"
  },
  {
    id: "cafe",
    title: "Кофейня",
    description: "Продажи, сотрудники, товары, расходники и акции.",
    icon: "Coffee",
    activeModules: [
      "dashboard",
      "clients",
      "employees",
      "inventory",
      "promotions",
      "tasks",
      "reports",
      "analytics"
    ],
    hiddenModules: ["calendar", "resources", "integrations"],
    menuOrder: [
      "dashboard",
      "clients",
      "inventory",
      "employees",
      "promotions",
      "tasks",
      "reports",
      "analytics"
    ],
    terminology: {
      appointment: "заказ",
      order: "заказ",
      employee: "сотрудник",
      client: "гость",
      service: "позиция меню",
      resource: "оборудование",
      product: "товар",
      material: "ингредиент"
    },
    dashboardWidgets: ["metrics", "attention", "revenue", "inventory"],
    sampleFocus: "Продажи, списания ингредиентов и возвращаемость гостей"
  },
  {
    id: "shop",
    title: "Небольшой магазин",
    description: "Продажи, остатки, поставщики, акции и клиенты.",
    icon: "Store",
    activeModules: [
      "dashboard",
      "clients",
      "inventory",
      "promotions",
      "tasks",
      "reports",
      "analytics"
    ],
    hiddenModules: ["calendar", "employees", "resources", "integrations"],
    menuOrder: [
      "dashboard",
      "inventory",
      "clients",
      "promotions",
      "tasks",
      "reports",
      "analytics"
    ],
    terminology: {
      appointment: "заказ",
      order: "продажа",
      employee: "сотрудник",
      client: "покупатель",
      service: "категория",
      resource: "складская зона",
      product: "товар",
      material: "остаток"
    },
    dashboardWidgets: ["metrics", "attention", "revenue", "inventory"],
    sampleFocus: "Остатки, поставщики, акции и повторные покупки"
  },
  {
    id: "universal",
    title: "Универсальный бизнес",
    description: "Базовый набор модулей для услуг, продаж и команды.",
    icon: "Building2",
    activeModules: [
      "dashboard",
      "calendar",
      "clients",
      "employees",
      "resources",
      "inventory",
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
      "resources",
      "inventory",
      "promotions",
      "tasks",
      "reports",
      "analytics"
    ],
    terminology: {
      appointment: "запись",
      order: "заказ",
      employee: "сотрудник",
      client: "клиент",
      service: "услуга",
      resource: "помещение или оборудование",
      product: "товар",
      material: "расходник"
    },
    dashboardWidgets: ["metrics", "schedule", "attention", "revenue"],
    sampleFocus: "Клиенты, заказы, сотрудники и операционные задачи"
  }
];

export function getBusinessTemplate(id: string) {
  return (
    BUSINESS_TEMPLATES.find((template) => template.id === id) ??
    BUSINESS_TEMPLATES[BUSINESS_TEMPLATES.length - 1]
  );
}

export const ONBOARDING_BUSINESS_OPTIONS = [
  {
    id: "beauty-salon",
    templateId: "beauty",
    title: "Салон красоты",
    description: "Записи, мастера, услуги и расходники.",
    icon: "Scissors"
  },
  {
    id: "barbershop",
    templateId: "beauty",
    title: "Барбершоп",
    description: "Мастера, кресла, повторные визиты и акции.",
    icon: "Scissors"
  },
  {
    id: "auto",
    templateId: "auto",
    title: "Автосервис",
    description: "Посты, механики, автомобили и запчасти.",
    icon: "CarFront"
  },
  {
    id: "cafe",
    templateId: "cafe",
    title: "Кофейня",
    description: "Продажи, гости, ингредиенты и акции.",
    icon: "Coffee"
  },
  {
    id: "shop",
    templateId: "shop",
    title: "Небольшой магазин",
    description: "Товары, остатки, клиенты и поставщики.",
    icon: "Store"
  },
  {
    id: "repair-workshop",
    templateId: "universal",
    title: "Ремонтная мастерская",
    description: "Заказы, материалы, задачи и клиенты.",
    icon: "Hammer"
  },
  {
    id: "education-center",
    templateId: "universal",
    title: "Образовательный центр",
    description: "Группы, расписание, клиенты и сотрудники.",
    icon: "GraduationCap"
  },
  {
    id: "other-business",
    templateId: "universal",
    title: "Другой бизнес",
    description: "Гибкий набор модулей без лишних разделов.",
    icon: "Building2"
  }
];
