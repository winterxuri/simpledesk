"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { Drawer } from "@/components/ui/drawer";
import { canAccessWorkspacePath, getDefaultPathForRole } from "@/lib/permissions";
import { useAppStore } from "@/store/app-store";
import { usePathname } from "next/navigation";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const user = useAppStore((state) => state.user);
  const role = useAppStore((state) => state.role);
  const addToast = useAppStore((state) => state.addToast);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccessWorkspacePath(role, pathname)) {
      addToast({
        title: "Раздел недоступен",
        description: "У текущей роли нет прав на этот раздел.",
        variant: "warning"
      });
      router.replace(getDefaultPathForRole(role));
    }
  }, [addToast, hasHydrated, pathname, role, router, user]);

  if (!hasHydrated || !user || !canAccessWorkspacePath(role, pathname)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AppSidebar />
      <Drawer
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        side="left"
        title="Меню"
        className="max-w-[320px]"
      >
        <AppSidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
      </Drawer>
      <div className="min-w-0 flex-1">
        <AppHeader onOpenMenu={() => setMobileMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1520px] px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
      <NotificationPanel />
    </div>
  );
}
