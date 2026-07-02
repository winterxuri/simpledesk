"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { Drawer } from "@/components/ui/drawer";
import { useAppStore } from "@/store/app-store";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useAppStore((state) => state.user);
  const startDemoSession = useAppStore((state) => state.startDemoSession);

  useEffect(() => {
    if (!user) {
      startDemoSession();
    }
  }, [startDemoSession, user]);

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
