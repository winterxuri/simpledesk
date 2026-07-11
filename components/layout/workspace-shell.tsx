"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { Drawer } from "@/components/ui/drawer";
import { canAccessWorkspacePath, getDefaultPathForRole } from "@/lib/permissions";
import { loadCurrentBackendWorkspace, signOutUser } from "@/lib/backend/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { usePathname } from "next/navigation";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const user = useAppStore((state) => state.user);
  const role = useAppStore((state) => state.role);
  const sessionMode = useAppStore((state) => state.sessionMode);
  const companyId = useAppStore((state) => state.company.id);
  const hydrateBackendWorkspace = useAppStore((state) => state.hydrateBackendWorkspace);
  const logout = useAppStore((state) => state.logout);
  const addToast = useAppStore((state) => state.addToast);
  const refreshInProgress = useRef(false);

  const refreshWorkspace = useCallback(async (showAccessMessage = false) => {
    if (sessionMode !== "registered" || refreshInProgress.current) {
      return;
    }

    refreshInProgress.current = true;
    try {
      const workspace = await loadCurrentBackendWorkspace();
      if (!workspace) {
        await signOutUser().catch(() => undefined);
        logout();
        if (showAccessMessage) {
          addToast({
            title: "Доступ к компании закрыт",
            description: "Аккаунт сотрудника больше не состоит в этой компании.",
            variant: "warning"
          });
        }
        router.replace("/login");
        return;
      }
      hydrateBackendWorkspace(workspace);
    } catch (error) {
      console.error("Workspace refresh failed", error);
    } finally {
      refreshInProgress.current = false;
    }
  }, [addToast, hydrateBackendWorkspace, logout, router, sessionMode]);

  useEffect(() => {
    if (!hasHydrated || sessionMode !== "registered") {
      return;
    }

    void refreshWorkspace(true);
  }, [hasHydrated, refreshWorkspace, sessionMode]);

  useEffect(() => {
    if (!hasHydrated || sessionMode !== "registered" || !companyId) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`workspace-sync:${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients", filter: `company_id=eq.${companyId}` },
        () => void refreshWorkspace()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `company_id=eq.${companyId}` },
        () => void refreshWorkspace()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees", filter: `company_id=eq.${companyId}` },
        () => void refreshWorkspace(true)
      )
      .subscribe();

    const refreshOnFocus = () => void refreshWorkspace(true);
    const accessCheckInterval = window.setInterval(() => {
      void refreshWorkspace(true);
    }, 15_000);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.clearInterval(accessCheckInterval);
      void supabase.removeChannel(channel);
    };
  }, [companyId, hasHydrated, refreshWorkspace, sessionMode]);

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
