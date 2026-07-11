"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProductLogo } from "@/components/layout/product-logo";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/config/product";
import { AppIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const navItems = [
  { href: "/", label: "Главная" },
  { href: "/updates", label: "Обновления" },
  { href: "/docs", label: "Документация" },
  { href: "/feedback", label: "Обратная связь" }
];

const footerGroups = [
  {
    title: "Продукт",
    links: [
      { href: "/", label: "Главная" },
      { href: "/updates", label: "Обновления" },
      { href: "/login", label: "Демо" },
      { href: "/register", label: "Регистрация" }
    ]
  },
  {
    title: "Поддержка",
    links: [
      { href: "/docs", label: "Документация" },
      { href: "/feedback", label: "Обратная связь" },
      { href: "/updates", label: "Обновления" }
    ]
  },
  {
    title: "Юридическое",
    links: [
      { href: "/legal/terms", label: "Условия использования" },
      { href: "/legal/privacy", label: "Политика конфиденциальности" },
      { href: "/legal/personal-data", label: "Согласие на обработку данных" }
    ]
  }
];

export function PublicSite({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      {children}
      <PublicFooter />
    </main>
  );
}

function PublicHeader() {
  const pathname = usePathname();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center" aria-label={PRODUCT_NAME}>
          <ProductLogo wordmarkClassName="text-base" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Переключить тему"
            title="Переключить тему"
          >
            <AppIcon name={theme === "dark" ? "Sun" : "Moon"} className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Войти</Link>
          </Button>
          <Button type="button" asChild>
            <Link href="/register">Регистрация</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <ProductLogo wordmarkClassName="text-lg" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              Рабочая платформа для салонов красоты и студий с несколькими
              мастерами: клиенты, записи, расходники, акции, отчёты и понятная
              операционная картина дня.
            </p>
            <div className="mt-6 flex gap-2">
              <Button type="button" size="icon" variant="outline" asChild title="Обратная связь">
                <Link href="/feedback">
                  <AppIcon name="Send" className="h-4 w-4" />
                </Link>
              </Button>
              <Button type="button" size="icon" variant="outline" asChild title="Документация">
                <Link href="/docs">
                  <AppIcon name="ClipboardList" className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="font-semibold">{group.title}</p>
                <div className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© 2026 {PRODUCT_NAME}. Все права защищены.</span>
          <span>Не заменяет бухгалтерскую, юридическую или налоговую консультацию.</span>
        </div>
      </div>
    </footer>
  );
}
