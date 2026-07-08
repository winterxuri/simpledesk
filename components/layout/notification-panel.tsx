"use client";

import { useEffect, useMemo, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { getNotificationFilters, getVisibleNotifications } from "@/lib/role-notifications";
import { formatDate } from "@/lib/utils";

export function NotificationPanel() {
  const open = useAppStore((state) => state.notificationPanelOpen);
  const setOpen = useAppStore((state) => state.setNotificationPanelOpen);
  const role = useAppStore((state) => state.role);
  const notifications = useAppStore((state) => state.data.notifications);
  const markRead = useAppStore((state) => state.markNotificationRead);
  const markAllRead = useAppStore((state) => state.markAllNotificationsRead);
  const [filter, setFilter] = useState("all");
  const visibleNotifications = useMemo(
    () => getVisibleNotifications(notifications, role),
    [notifications, role]
  );
  const filters = useMemo(() => getNotificationFilters(role), [role]);

  useEffect(() => {
    if (!filters.some((item) => item.value === filter)) {
      setFilter("all");
    }
  }, [filter, filters]);

  const filtered = useMemo(() => {
    if (filter === "all") {
      return visibleNotifications;
    }
    if (filter === "important") {
      return visibleNotifications.filter((notification) => notification.important);
    }
    return visibleNotifications.filter((notification) => notification.category === filter);
  }, [filter, visibleNotifications]);

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      title="Уведомления"
      description={
        role === "employee"
          ? "События по доступным вам задачам."
          : "События клиентов, склада, задач, финансов и системы."
      }
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
      <Button
        type="button"
        variant="outline"
        className="mt-5 w-full"
        onClick={() => markAllRead(visibleNotifications.map((notification) => notification.id))}
      >
        Отметить все прочитанными
      </Button>
    </Drawer>
  );
}
