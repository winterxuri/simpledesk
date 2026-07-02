"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProductMark } from "@/components/layout/product-logo";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/config/product";
import { buildNavigationItems } from "@/config/navigation";
import { useAppStore } from "@/store/app-store";
import { AppIcon } from "@/lib/icons";
import { cn, getInitials } from "@/lib/utils";

export function AppSidebar({
  mobile = false,
  onNavigate
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const company = useAppStore((state) => state.company);
  const user = useAppStore((state) => state.user);
  const role = useAppStore((state) => state.role);
  const modules = useAppStore((state) => state.companyModules);
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const setCollapsed = useAppStore((state) => state.setSidebarCollapsed);

  const items = buildNavigationItems(modules, company.businessTemplateId).filter(
    (item) => item.visible && (role !== "employee" || item.code !== "settings")
  );

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card",
        mobile ? "min-h-[calc(100vh-96px)]" : "hidden lg:flex",
        !mobile && (collapsed ? "w-20" : "w-72")
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <ProductMark decorative className="h-10 w-10" />
        {!collapsed || mobile ? (
          <div className="min-w-0">
            <p className="truncate font-semibold">{PRODUCT_NAME}</p>
            <p className="truncate text-xs text-muted-foreground">{company.name}</p>
          </div>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active =
            pathname === item.route ||
            (item.route !== "/dashboard" && pathname.startsWith(item.route));
          return (
            <Link
              key={item.code}
              href={item.route}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && !mobile && "justify-center px-2"
              )}
              title={collapsed && !mobile ? item.title : undefined}
            >
              <AppIcon name={item.icon} className="h-5 w-5 shrink-0" />
              {!collapsed || mobile ? <span className="truncate">{item.title}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-border p-3">
        {!mobile ? (
          <Button
            type="button"
            variant="ghost"
            className={cn("w-full", collapsed && "px-0")}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Свернуть меню"
          >
            <AppIcon
              name={collapsed ? "PanelLeftOpen" : "PanelLeftClose"}
              className="h-4 w-4"
            />
            {!collapsed ? "Свернуть" : null}
          </Button>
        ) : null}
        <div className={cn("flex items-center gap-3 rounded-lg bg-muted p-2", collapsed && !mobile && "justify-center")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {getInitials(user?.name ?? "Алексей")}
          </div>
          {!collapsed || mobile ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name ?? "Алексей"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {role === "owner" ? "Владелец" : role === "admin" ? "Администратор" : "Сотрудник"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
