"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { QuickCreateMenu } from "@/components/layout/quick-create-menu";
import { signOutUser } from "@/lib/backend/auth";
import { getVisibleNotifications } from "@/lib/role-notifications";
import { useAppStore } from "@/store/app-store";

const titles: Record<string, string> = {
  "/dashboard": "Сегодня",
  "/calendar": "Календарь",
  "/clients": "Клиенты",
  "/employees": "Сотрудники",
  "/inventory": "Товары и расходники",
  "/resources": "Помещения и оборудование",
  "/promotions": "Акции",
  "/tasks": "Задачи",
  "/reports": "Отчёты",
  "/analytics": "Аналитика",
  "/settings": "Настройки",
  "/settings/modules": "Модули",
  "/settings/navigation": "Меню",
  "/settings/company": "Компания",
  "/settings/integrations": "Интеграции"
};

const roleLabels = {
  owner: "Владелец",
  admin: "Администратор",
  employee: "Сотрудник"
} as const;

function getTitle(pathname: string) {
  if (pathname.startsWith("/clients/")) {
    return "Карточка клиента";
  }
  return titles[pathname] ?? "Рабочее пространство";
}

export function AppHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const role = useAppStore((state) => state.role);
  const setRole = useAppStore((state) => state.setRole);
  const company = useAppStore((state) => state.company);
  const sessionMode = useAppStore((state) => state.sessionMode);
  const notifications = useAppStore((state) => state.data.notifications);
  const logout = useAppStore((state) => state.logout);
  const addToast = useAppStore((state) => state.addToast);
  const setNotificationPanelOpen = useAppStore(
    (state) => state.setNotificationPanelOpen
  );
  const visibleNotifications = getVisibleNotifications(notifications, role);
  const unread = visibleNotifications.filter((notification) => !notification.read).length;

  async function handleLogout() {
    try {
      if (sessionMode === "registered") {
        await signOutUser();
      }
      logout();
      router.push("/login");
    } catch (error) {
      addToast({
        title: "Не удалось выйти",
        description: error instanceof Error ? error.message : "Попробуйте ещё раз.",
        variant: "error"
      });
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/92 px-4 backdrop-blur lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMenu}
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-muted-foreground">
          {sessionMode === "demo" ? "Демо-кабинет" : company.name}
        </p>
        <h1 className="truncate text-lg font-semibold">{getTitle(pathname)}</h1>
      </div>
      <div className="hidden min-w-60 max-w-sm flex-1 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск клиентов, задач, записей" className="pl-9" />
        </div>
      </div>
      <QuickCreateMenu />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => setNotificationPanelOpen(true)}
        aria-label="Уведомления"
      >
        <Bell className="h-4 w-4" />
        {unread ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread}
          </span>
        ) : null}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Переключить тему"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      {sessionMode === "demo" ? (
        <Select
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
          className="hidden w-40 md:block"
          aria-label="Роль"
        >
          <option value="owner">Владелец</option>
          <option value="admin">Администратор</option>
          <option value="employee">Сотрудник</option>
        </Select>
      ) : (
        <span className="hidden rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground md:inline-flex">
          {roleLabels[role]}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleLogout}
        aria-label="Выйти из аккаунта"
        title="Выйти"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
