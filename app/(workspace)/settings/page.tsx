import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/modules/page-header";
import { AppIcon } from "@/lib/icons";

const sections = [
  {
    title: "Модули",
    description: "Включайте, скрывайте и отключайте разделы без удаления данных.",
    href: "/settings/modules",
    icon: "Boxes"
  },
  {
    title: "Меню",
    description: "Меняйте порядок пунктов, скрывайте лишнее и возвращайте рекомендации.",
    href: "/settings/navigation",
    icon: "ListTodo"
  },
  {
    title: "Компания",
    description: "Название, контакты, график работы, терминология и шаблон.",
    href: "/settings/company",
    icon: "Building2"
  },
  {
    title: "Интеграции",
    description: "Telegram, WhatsApp, календарь, CSV, телефония, оплата и API.",
    href: "/settings/integrations",
    icon: "Cable"
  }
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Настройки"
        description="Ключевые настройки рабочего пространства и демонстрационные ограничения тарифа."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full p-5 transition-colors hover:bg-muted/35">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <AppIcon name={section.icon} className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
