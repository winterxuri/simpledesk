import { addDays, formatISO, subDays } from "date-fns";
import { getBusinessTemplate } from "@/config/templates";
import type {
  Appointment,
  Client,
  ClientStatus,
  DashboardWidget,
  DemoData,
  Employee,
  EmployeeShift,
  FinancialOperation,
  InventoryMovement,
  Notification,
  Product,
  Promotion,
  Resource,
  Sale,
  Task
} from "@/types";

const clientNames = [
  "Анна Смирнова",
  "Мария Кузнецова",
  "Елена Петрова",
  "Ольга Соколова",
  "Ирина Орлова",
  "Дмитрий Волков",
  "Сергей Морозов",
  "Алексей Егоров",
  "Наталья Павлова",
  "Кирилл Новиков",
  "Виктория Белова",
  "Павел Захаров",
  "Юлия Федорова",
  "Роман Киселев",
  "Алина Комарова",
  "Михаил Андреев",
  "Дарья Лебедева",
  "Татьяна Громова",
  "Георгий Макаров",
  "Екатерина Миронова"
];

const employeeNames = [
  ["Алексей Никитин", "Управляющий"],
  ["София Романова", "Старший специалист"],
  ["Иван Медведев", "Специалист"],
  ["Марина Ершова", "Специалист"],
  ["Денис Фролов", "Администратор"],
  ["Вера Климова", "Младший специалист"]
] as const;

const templateServices: Record<string, string[]> = {
  beauty: [
    "Стрижка и укладка",
    "Окрашивание",
    "Маникюр",
    "Уход для волос",
    "Коррекция бровей"
  ],
  auto: [
    "Диагностика ходовой",
    "Замена масла",
    "Ремонт тормозов",
    "Шиномонтаж",
    "Компьютерная диагностика"
  ],
  cafe: [
    "Кофейный сет",
    "Завтрак",
    "Корпоративный заказ",
    "Десертный набор",
    "Поставка зерна"
  ],
  shop: [
    "Продажа аксессуаров",
    "Консультация",
    "Комплектация заказа",
    "Возврат товара",
    "Предзаказ"
  ],
  universal: [
    "Консультация",
    "Услуга стандарт",
    "Заказ клиента",
    "Повторный визит",
    "Подготовка материалов"
  ]
};

const productByTemplate: Record<string, string[]> = {
  beauty: [
    "Краска Estel 7/0",
    "Оксид 6%",
    "Шампунь восстанавливающий",
    "Маска для волос",
    "Перчатки нитриловые",
    "Пилки 180/240",
    "Гель-лак нюдовый",
    "Средство для дезинфекции",
    "Одноразовые полотенца",
    "Сыворотка для волос"
  ],
  auto: [
    "Моторное масло 5W-30",
    "Масляный фильтр",
    "Тормозные колодки",
    "Свечи зажигания",
    "Антифриз G12",
    "Воздушный фильтр",
    "Салонный фильтр",
    "Лампа H7",
    "Очиститель тормозов",
    "Технические салфетки"
  ],
  cafe: [
    "Зерно Бразилия 1 кг",
    "Молоко 3,2%",
    "Сироп ваниль",
    "Стаканы 250 мл",
    "Крышки для стаканов",
    "Круассан замороженный",
    "Сахар в стиках",
    "Какао",
    "Чай черный",
    "Салфетки"
  ],
  shop: [
    "Рюкзак городской",
    "Термокружка",
    "Подарочный сертификат",
    "Носки хлопковые",
    "Ежедневник",
    "Чехол для телефона",
    "Батарейки AA",
    "Кабель USB-C",
    "Пакеты брендированные",
    "Ценники"
  ],
  universal: [
    "Товар базовый",
    "Расходный материал",
    "Комплект деталей",
    "Упаковка",
    "Сервисный набор",
    "Бланки",
    "Маркировочные стикеры",
    "Средство очистки",
    "Запасной элемент",
    "Подарочная карта"
  ]
};

function isoDate(offset: number) {
  return formatISO(addDays(new Date(), offset), { representation: "date" });
}

function makeClients(): Client[] {
  const statuses: ClientStatus[] = [
    "active",
    "new",
    "loyal",
    "inactive",
    "attention"
  ];

  return clientNames.map((name, index) => ({
    id: `client-${index + 1}`,
    name,
    phone: `+7 9${20 + (index % 70)} ${100 + index}-${20 + index}-${10 + index}`,
    email: `${name.toLowerCase().split(" ")[0]}.${index + 1}@mail.ru`,
    status: statuses[index % statuses.length],
    responsibleId: `employee-${(index % 6) + 1}`,
    totalSpent: 4200 + index * 1850,
    visits: 1 + (index % 12),
    lastVisit: formatISO(subDays(new Date(), 2 + index * 2), {
      representation: "date"
    }),
    nextAppointment: index % 4 === 0 ? undefined : isoDate((index % 9) + 1),
    source: ["Рекомендация", "Яндекс", "Instagram", "Повторный визит"][index % 4],
    notes:
      index % 3 === 0
        ? "Предпочитает напоминание за день и персональные предложения."
        : "История обращений заполнена, согласие на коммуникации получено."
  }));
}

function makeEmployees(templateId: string): Employee[] {
  const template = getBusinessTemplate(templateId);
  const specialist = template.terminology.employee;

  return employeeNames.map(([name, position], index) => ({
    id: `employee-${index + 1}`,
    name,
    position:
      index === 0
        ? "Владелец"
        : position.replace("Специалист", capitalize(specialist)),
    status: index === 4 ? "dayOff" : index === 5 ? "vacation" : "working",
    schedule: index % 2 === 0 ? "09:00-18:00" : "11:00-20:00",
    loadPercent: 52 + index * 7,
    revenue: 54000 + index * 15300,
    appointmentsCount: 12 + index * 3,
    rating: 4.4 + (index % 5) * 0.1,
    role: index === 0 ? "owner" : index === 4 ? "admin" : "employee",
    compensationType: index === 0 ? "mixed" : index % 2 === 0 ? "fixed" : "commission",
    baseSalary: index === 0 ? 80000 : index % 2 === 0 ? 45000 : 0,
    commissionPercent: index === 0 ? 10 : index % 2 === 0 ? 0 : 30
  }));
}

function makeEmployeeShifts(): EmployeeShift[] {
  const shiftTypes: EmployeeShift["type"][] = ["work", "work", "work", "work", "dayOff", "vacation"];
  return Array.from({ length: 18 }, (_, index) => {
    const employeeIndex = index % 6;
    const type = index === 11 ? "sick" : shiftTypes[employeeIndex];
    return {
      id: `shift-${index + 1}`,
      employeeId: `employee-${employeeIndex + 1}`,
      date: isoDate(Math.floor(index / 6)),
      type,
      startTime: type === "work" ? (employeeIndex % 2 === 0 ? "09:00" : "11:00") : "",
      endTime: type === "work" ? (employeeIndex % 2 === 0 ? "18:00" : "20:00") : "",
      comment:
        type === "dayOff"
          ? "Плановый выходной"
          : type === "vacation"
            ? "Отпуск"
            : type === "sick"
              ? "Больничный"
              : ""
    };
  });
}

function makeAppointments(templateId: string): Appointment[] {
  const services = templateServices[templateId] ?? templateServices.universal;

  return Array.from({ length: 25 }, (_, index) => ({
    id: `appointment-${index + 1}`,
    clientId: `client-${(index % 20) + 1}`,
    employeeId: `employee-${(index % 6) + 1}`,
    resourceId: `resource-${(index % 6) + 1}`,
    title: services[index % services.length],
    date: isoDate((index % 7) - 1),
    time: `${9 + (index % 9)}:${index % 2 === 0 ? "00" : "30"}`,
    duration: [30, 45, 60, 90][index % 4],
    price: 1800 + (index % 8) * 700,
    status: ["planned", "confirmed", "inProgress", "completed", "cancelled"][
      index % 5
    ] as Appointment["status"],
    paid: index % 3 !== 0,
    promotionId: index % 4 === 0 ? `promotion-${(index % 3) + 1}` : undefined,
    comment: index % 4 === 0 ? "Нужно подтвердить за час до визита." : undefined
  }));
}

function makeProducts(templateId: string): Product[] {
  const names = productByTemplate[templateId] ?? productByTemplate.universal;
  const list = [...names, ...productByTemplate.universal].slice(0, 20);

  return list.map((name, index) => {
    const minStock = 6 + (index % 5);
    const currentStock = [34, 18, 9, 4, 0][index % 5];
    const status =
      currentStock === 0
        ? "out"
        : currentStock <= minStock / 2
          ? "critical"
          : currentStock <= minStock
            ? "low"
            : "ok";

    return {
      id: `product-${index + 1}`,
      name,
      type: index % 3 === 0 ? "material" : index % 3 === 1 ? "product" : "part",
      category: ["Основное", "Расходники", "Премиум", "Упаковка"][index % 4],
      currentStock,
      minStock,
      purchasePrice: 120 + index * 85,
      salePrice: 320 + index * 140,
      supplier: ["ООО Поставка", "Склад Партнер", "Локальный поставщик"][
        index % 3
      ],
      status
    };
  });
}

function makeMovements(): InventoryMovement[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `movement-${index + 1}`,
    productId: `product-${(index % 20) + 1}`,
    type: ["income", "writeOff", "adjustment", "transfer"][index % 4] as
      | "income"
      | "writeOff"
      | "adjustment"
      | "transfer",
    quantity: 2 + (index % 8),
    date: isoDate(-index),
    comment: ["Поступление от поставщика", "Списание по услугам", "Инвентаризация", "Перемещение между зонами"][index % 4]
  }));
}

function makeSales(templateId: string): Sale[] {
  const names = productByTemplate[templateId] ?? productByTemplate.universal;

  return Array.from({ length: 18 }, (_, index) => {
    const quantity = 1 + (index % 3);
    const unitPrice = 900 + index * 170;
    const productIndex = index % Math.min(names.length, 10);
    const status: Sale["status"] =
      index % 11 === 0
        ? "refunded"
        : index % 7 === 0
          ? "partiallyRefunded"
        : index % 13 === 0
          ? "cancelled"
          : "completed";
    const discountPercent = index % 4 === 0 ? 10 : 0;
    const discountAmount = discountPercent ? Math.round(quantity * unitPrice * discountPercent / 100) : 0;
    const amount = quantity * unitPrice - discountAmount;
    const refundedAmount = status === "refunded"
      ? amount
      : status === "partiallyRefunded"
        ? Math.round(amount / 2)
        : 0;
    const refundedQuantity = status === "refunded"
      ? quantity
      : status === "partiallyRefunded"
        ? 1
        : 0;

    return {
      id: `sale-${index + 1}`,
      date: isoDate(-index),
      productId: `product-${productIndex + 1}`,
      productName: names[productIndex],
      quantity,
      unitPrice,
      amount,
      category: ["Товары", "Услуги", "Дополнительные продажи"][index % 3],
      paymentMethod: ["cash", "card", "transfer", "online"][index % 4] as Sale["paymentMethod"],
      paymentStatus: status === "refunded" ? "refunded" : status === "partiallyRefunded" ? "partial" : "paid",
      discountPercent,
      discountAmount,
      promotionId: discountPercent ? `promotion-${(index % 3) + 1}` : undefined,
      clientId: `client-${(index % 20) + 1}`,
      employeeId: `employee-${(index % 6) + 1}`,
      financialOperationId: `operation-${index + 1}`,
      inventoryMovementId: `movement-${index + 1}`,
      status,
      comment: status === "completed" ? "Демо-продажа" : "Демо-продажа с изменённым статусом",
      refundedAmount,
      refundedQuantity,
      cancelReason: status !== "completed" ? "Демонстрационный возврат" : undefined,
      cancelledAt: status !== "completed" ? isoDate(-index + 1) : undefined
    };
  });
}

function makeResources(templateId: string): Resource[] {
  const namesByTemplate: Record<string, string[]> = {
    beauty: [
      "Кресло 1",
      "Кресло 2",
      "Кабинет маникюра",
      "Кабинет косметолога",
      "Мойка",
      "Зона ожидания"
    ],
    auto: [
      "Пост 1",
      "Пост 2",
      "Подъемник 1",
      "Диагностический стенд",
      "Шиномонтажная зона",
      "Мойка деталей"
    ],
    cafe: [
      "Кофемашина",
      "Гриндер 1",
      "Витрина",
      "Кухонный стол",
      "Зал 1",
      "Склад"
    ],
    universal: [
      "Рабочее место 1",
      "Рабочее место 2",
      "Кабинет",
      "Оборудование",
      "Помещение",
      "Складская зона"
    ]
  };

  const names =
    namesByTemplate[templateId] ?? namesByTemplate.universal;

  return names.map((name, index) => ({
    id: `resource-${index + 1}`,
    name,
    type: ["рабочее место", "кабинет", "оборудование", "помещение"][index % 4],
    status: ["free", "busy", "maintenance", "free", "unavailable", "busy"][
      index
    ] as Resource["status"],
    loadPercent: 35 + index * 9,
    futureBookings: 2 + index,
    condition: ["исправно", "требует проверки", "плановое обслуживание"][index % 3],
    comment: index % 2 === 0 ? "Используется в ближайших записях." : "Свободно для бронирования."
  }));
}

function makePromotions(templateId: string): Promotion[] {
  const template = getBusinessTemplate(templateId);
  const service = template.terminology.service;

  return [
    {
      id: "promotion-1",
      name: `-15% на повторную ${template.terminology.appointment}`,
      period: "1-30 июля",
      status: "active",
      conditions: `Для клиентов без ${template.terminology.appointment} больше 45 дней`,
      usageCount: 34,
      revenue: 128000,
      newClients: 7,
      efficiency: 78,
      description: "Персональное предложение для возврата клиентов."
    },
    {
      id: "promotion-2",
      name: `Пакет "${capitalize(service)} + подарок"`,
      period: "10-24 июля",
      status: "scheduled",
      conditions: "При оплате полного пакета",
      usageCount: 0,
      revenue: 0,
      newClients: 0,
      efficiency: 0,
      description: "Запланированная кампания для повышения среднего чека."
    },
    {
      id: "promotion-3",
      name: "Промокод для новых клиентов",
      period: "15 июня - 15 июля",
      status: "ending",
      conditions: "Только первый визит или первая покупка",
      usageCount: 52,
      revenue: 196000,
      newClients: 41,
      efficiency: 84,
      description: "Работает в Telegram и на визитках."
    },
    {
      id: "promotion-4",
      name: "Семейное предложение",
      period: "1-14 июня",
      status: "finished",
      conditions: "Два клиента в один день",
      usageCount: 18,
      revenue: 74000,
      newClients: 5,
      efficiency: 62,
      description: "Завершена, статистика доступна в аналитике."
    },
    {
      id: "promotion-5",
      name: "Черновик летней акции",
      period: "не задан",
      status: "draft",
      conditions: "Условия еще не заполнены",
      usageCount: 0,
      revenue: 0,
      newClients: 0,
      efficiency: 0,
      description: "Нужно выбрать аудиторию и канал продвижения."
    }
  ];
}

function makeTasks(): Task[] {
  return Array.from({ length: 15 }, (_, index) => ({
    id: `task-${index + 1}`,
    title:
      [
        "Подтвердить записи на завтра",
        "Заказать расходники",
        "Проверить просроченные оплаты",
        "Подготовить пост об акции",
        "Обновить график сотрудников"
      ][index % 5] + ` #${index + 1}`,
    description: "Операционная задача, созданная для демонстрации workflow.",
    responsibleId: `employee-${(index % 6) + 1}`,
    dueDate: isoDate((index % 9) - 2),
    priority: ["low", "medium", "high"][index % 3] as Task["priority"],
    status: ["new", "inProgress", "waiting", "done", "overdue"][index % 5] as Task["status"],
    clientId: index % 3 === 0 ? `client-${(index % 20) + 1}` : undefined,
    appointmentId: index % 4 === 0 ? `appointment-${(index % 25) + 1}` : undefined,
    productId: index % 5 === 0 ? `product-${(index % 20) + 1}` : undefined,
    checklist: [
      { title: "Проверить данные", done: index % 2 === 0 },
      { title: "Согласовать с ответственным", done: false }
    ]
  }));
}

function makeFinance(): FinancialOperation[] {
  return Array.from({ length: 30 }, (_, index) => ({
    id: `operation-${index + 1}`,
    type: index % 5 === 0 ? "expense" : "income",
    category:
      index % 5 === 0
        ? ["Закупка", "Аренда", "Маркетинг"][index % 3]
        : ["Услуги", "Товары", "Повторные клиенты"][index % 3],
    amount: index % 5 === 0 ? 3500 + index * 480 : 4200 + index * 710,
    date: isoDate(-index),
    comment: index % 5 === 0 ? "Расходная операция" : "Оплата клиента",
    paymentMethod: ["cash", "card", "transfer", "online"][index % 4] as FinancialOperation["paymentMethod"],
    source: index % 5 === 0 ? "manual" : "sale"
  }));
}

function makeNotifications(): Notification[] {
  const items = [
    ["Клиент подтвердил запись", "Анна Смирнова подтвердила визит на 15:00", "clients"],
    ["Товар достиг минимального остатка", "Оксид 6% осталось 4 шт.", "inventory"],
    ["Акция завершится через три дня", "Промокод для новых клиентов скоро закончится", "system"],
    ["Сотрудник выполнил задачу", "Марина Ершова закрыла задачу по графику", "tasks"],
    ["Обнаружена просроченная оплата", "Счет по заказу #184 требует проверки", "finance"],
    ["Недельный отчет готов", "Сводка доступна в разделе аналитики", "system"]
  ] as const;

  return Array.from({ length: 12 }, (_, index) => {
    const item = items[index % items.length];
    return {
      id: `notification-${index + 1}`,
      title: item[0],
      description: item[1],
      category: item[2],
      important: index % 3 === 0,
      date: isoDate(-Math.floor(index / 2)),
      read: index > 4
    };
  });
}

function makeWidgets(): DashboardWidget[] {
  return [
    { id: "metrics", title: "Показатели", type: "metric", visible: true, order: 1 },
    { id: "attention", title: "Требует внимания", type: "attention", visible: true, order: 2 },
    { id: "schedule", title: "Расписание", type: "schedule", visible: true, order: 3 },
    { id: "revenue", title: "Выручка", type: "chart", visible: true, order: 4 },
    { id: "summary", title: "Операционная сводка", type: "attention", visible: true, order: 5 }
  ];
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createDemoData(templateId: string): DemoData {
  return {
    clients: makeClients(),
    employees: makeEmployees(templateId),
    employeeShifts: makeEmployeeShifts(),
    appointments: makeAppointments(templateId),
    products: makeProducts(templateId),
    inventoryMovements: makeMovements(),
    sales: makeSales(templateId),
    resources: makeResources(templateId),
    promotions: makePromotions(templateId),
    tasks: makeTasks(),
    financialOperations: makeFinance(),
    reportSnapshots: [],
    notifications: makeNotifications(),
    dashboardWidgets: makeWidgets()
  };
}
