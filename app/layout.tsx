import type { Metadata } from "next";
import "./globals.css";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/config/product";
import { ThemeController } from "@/components/theme-controller";
import { ToastViewport } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} - ${PRODUCT_TAGLINE}`,
  description:
    "Клиенты, записи, товары, задачи, акции и отчеты в одной простой системе."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeController />
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
