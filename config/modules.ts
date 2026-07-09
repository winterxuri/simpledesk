import type { ModuleCode, ModuleDefinition } from "@/types";

export const MODULES: ModuleDefinition[] = [
  {
    code: "dashboard",
    title: "Сегодня",
    description: "Ключевые показатели, расписание и события на день.",
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
    code: "sales",
    title: "Продажи",
    description: "Журнал продаж, оплаты, списания товаров, отмены и возвраты.",
    icon: "CreditCard",
    route: "/sales",
    dependencies: ["clients", "inventory"],
    defaultOrder: 6,
    plan: "basic"
  },
  {
    code: "finance",
    title: "Финансы",
    description: "Касса, доходы, расходы, возвраты, способы оплаты и прибыль.",
    icon: "BriefcaseBusiness",
    route: "/finance",
    dependencies: ["sales"],
    defaultOrder: 7,
    plan: "basic"
  },
  {
    code: "resources",
    title: "Помещения и оборудование",
    description: "Кабинеты, посты, залы, техника и другое, что нужно бронировать вместе с записью.",
    icon: "Wrench",
    route: "/resources",
    dependencies: ["calendar"],
    defaultOrder: 8,
    plan: "basic"
  },
  {
    code: "promotions",
    title: "Акции",
    description: "Промо-кампании, условия, эффективность и статистика.",
    icon: "BadgePercent",
    route: "/promotions",
    dependencies: ["clients"],
    defaultOrder: 9,
    plan: "basic"
  },
  {
    code: "tasks",
    title: "Задачи",
    description: "Список и канбан для операционных задач команды.",
    icon: "ListTodo",
    route: "/tasks",
    dependencies: [],
    defaultOrder: 10,
    plan: "basic"
  },
  {
    code: "analytics",
    title: "Аналитика",
    description: "Выручка, прибыль, клиенты, загрузка и эффективность акций.",
    icon: "ChartNoAxesCombined",
    route: "/analytics",
    dependencies: [],
    defaultOrder: 11,
    plan: "basic"
  },
  {
    code: "reports",
    title: "Отчёты",
    description: "Сводки за день и период, сохранение, импорт и экспорт файлов.",
    icon: "ClipboardList",
    route: "/reports",
    dependencies: [],
    defaultOrder: 12,
    plan: "basic"
  },
  {
    code: "integrations",
    title: "Интеграции",
    description: "Telegram, WhatsApp, календарь, CSV, оплата, API и вебхуки.",
    icon: "Cable",
    route: "/settings/integrations",
    dependencies: [],
    defaultOrder: 13,
    plan: "pro"
  }
];

export function getModuleDefinition(code: ModuleCode) {
  return MODULES.find((module) => module.code === code);
}
