"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatDate } from "@/lib/utils";

const filters = [
  { value: "all", label: "Все" },
  { value: "important", label: "Важные" },
  { value: "clients", label: "Клиенты" },
  { value: "inventory", label: "Склад" },
  { value: "tasks", label: "Задачи" },
  { value: "system", label: "Система" }
];

export function NotificationPanel() {
  const open = useAppStore((state) => state.notificationPanelOpen);
  const setOpen = useAppStore((state) => state.setNotificationPanelOpen);
  const notifications = useAppStore((state) => state.data.notifications);
  const markRead = useAppStore((state) => state.markNotificationRead);
  const markAllRead = useAppStore((state) => state.markAllNotificationsRead);
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") {
      return notifications;
    }
    if (filter === "important") {
      return notifications.filter((notification) => notification.important);
    }
    return notifications.filter((notification) => notification.category === filter);
  }, [filter, notifications]);

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      title="Уведомления"
      description="События клиентов, склада, задач и системы."
    >
      <Tabs items={filters} value={filter} onValueChange={setFilter} />
      <div className="mt-5 space-y-3">
        {filtered.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className="w-full rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-muted/40"
            onClick={() => markRead(notification.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{notification.title}</p>
                  {notification.important ? <StatusBadge status="attention" /> : null}
                  {!notification.read ? <StatusBadge status="new" /> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.description}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(notification.date)}
              </span>
            </div>
          </button>
        ))}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
            По выбранному фильтру уведомлений нет.
          </div>
        ) : null}
      </div>
      <Button type="button" variant="outline" className="mt-5 w-full" onClick={markAllRead}>
        Отметить все прочитанными
      </Button>
    </Drawer>
  );
}
