import type { DemoData, Employee, User } from "@/types";
import { getLocalDateKey } from "@/lib/utils";

export function createInitialBusinessData(owner: User | null, ownerEmployeeId?: string): DemoData {
  const ownerEmployee: Employee = {
    id: ownerEmployeeId ?? "employee-owner",
    name: owner?.name ?? "Владелец",
    position: "Владелец",
    status: "working",
    schedule: "09:00-18:00",
    loadPercent: 0,
    revenue: 0,
    appointmentsCount: 0,
    rating: 5,
    role: "owner",
    compensationType: "mixed",
    baseSalary: 0,
    commissionPercent: 0
  };

  return {
    clients: [],
    employees: [ownerEmployee],
    appointments: [],
    products: [],
    inventoryMovements: [],
    resources: [],
    promotions: [],
    tasks: [],
    financialOperations: [],
    reportSnapshots: [],
    notifications: [
      {
        id: "notification-welcome",
        title: "Рабочее пространство готово",
        description: "Добавьте клиентов, сотрудников, записи и первые продажи.",
        category: "system",
        important: false,
        date: getLocalDateKey(),
        read: false
      }
    ],
    dashboardWidgets: [
      { id: "metrics", title: "Показатели", type: "metric", visible: true, order: 1 },
      { id: "attention", title: "Требует внимания", type: "attention", visible: true, order: 2 },
      { id: "schedule", title: "Расписание", type: "schedule", visible: true, order: 3 },
      { id: "revenue", title: "Выручка", type: "chart", visible: true, order: 4 }
    ]
  };
}
