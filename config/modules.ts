import type { ModuleCode, ModuleDefinition } from "@/types";

export const MODULES: ModuleDefinition[] = [
  {
    code: "dashboard",
    title: "Сегодня",
    description: "Ключевые показатели, расписание и рекомендации на день.",
    icon: "LayoutDashboard",
    route: "/dashboard",
    dependencies: [],
    defaultOrder: 1,
    plan: "basic"
  },
  {
    code: "calendar",
    title: "Календарь и записи",
    description: "Расписание, свободные окна, записи и бронирования.",
    icon: "CalendarDays",
    route: "/calendar",
    dependencies: ["clients", "employees"],
    defaultOrder: 2,
    plan: "basic"
  },
  {
    code: "clients",
    title: "Клиенты",
    description: "База клиентов, сегменты, история обращений и задачи.",
    icon: "UsersRound",
    route: "/clients",
    dependencies: [],
    defaultOrder: 3,
    plan: "basic"
  },
  {
    code: "employees",
    title: "Сотрудники",
    description: "Команда, графики, права, загрузка и показатели.",
    icon: "UserRoundCog",
    route: "/employees",
    dependencies: [],
    defaultOrder: 4,
    plan: "basic"
  },
  {
    code: "inventory",
    title: "Товары и расходники",
    description: "Остатки, движения, поставщики и закупочные действия.",
    icon: "Boxes",
    route: "/inventory",
    dependencies: [],
    defaultOrder: 5,
    plan: "basic"
  },
  {
    code: "resources",
    title: "Ресурсы",
    description: "Рабочие места, помещения, оборудование и бронирования.",
    icon: "Wrench",
    route: "/resources",
    dependencies: ["calendar"],
    defaultOrder: 6,
    plan: "basic"
  },
  {
    code: "promotions",
    title: "Акции",
    description: "Промо-кампании, условия, эффективность и статистика.",
    icon: "BadgePercent",
    route: "/promotions",
    dependencies: ["clients"],
    defaultOrder: 7,
    plan: "basic"
  },
  {
    code: "tasks",
    title: "Задачи",
    description: "Список и канбан для операционных задач команды.",
    icon: "ListTodo",
    route: "/tasks",
    dependencies: [],
    defaultOrder: 8,
    plan: "basic"
  },
  {
    code: "analytics",
    title: "Аналитика",
    description: "Выручка, прибыль, клиенты, загрузка и эффективность акций.",
    icon: "ChartNoAxesCombined",
    route: "/analytics",
    dependencies: [],
    defaultOrder: 9,
    plan: "basic"
  },
  {
    code: "ai-assistant",
    title: "AI-помощник",
    description: "Ответы и рекомендации по данным текущей компании.",
    icon: "Sparkles",
    route: "/ai-assistant",
    dependencies: ["analytics"],
    defaultOrder: 10,
    plan: "basic"
  },
  {
    code: "integrations",
    title: "Интеграции",
    description: "Telegram, WhatsApp, календарь, CSV, оплата, API и вебхуки.",
    icon: "Cable",
    route: "/settings/integrations",
    dependencies: [],
    defaultOrder: 11,
    plan: "pro"
  }
];

export function getModuleDefinition(code: ModuleCode) {
  return MODULES.find((module) => module.code === code);
}
