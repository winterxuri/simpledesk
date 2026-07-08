import type { Notification, Role } from "@/types";

const employeeNotificationCategories = new Set<Notification["category"]>(["tasks"]);

export function getVisibleNotifications(notifications: Notification[], role: Role) {
  if (role === "owner" || role === "admin") {
    return notifications;
  }

  return notifications.filter((notification) =>
    employeeNotificationCategories.has(notification.category)
  );
}

export function getNotificationFilters(role: Role) {
  const common = [
    { value: "all", label: "Все" },
    { value: "important", label: "Важные" },
    { value: "tasks", label: "Задачи" }
  ];

  if (role === "employee") {
    return common;
  }

  return [
    ...common.slice(0, 2),
    { value: "clients", label: "Клиенты" },
    { value: "inventory", label: "Склад" },
    common[2],
    { value: "finance", label: "Финансы" },
    { value: "system", label: "Система" }
  ];
}
