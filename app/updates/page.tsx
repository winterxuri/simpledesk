import Link from "next/link";
import { CalendarDays, CheckCircle2, ClipboardList, Hammer, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicSite } from "@/components/layout/public-site";

const updates = [
  {
    version: "0.4",
    date: "Июль 2026",
    title: "Отчёты и сохранённые сводки",
    status: "Готово",
    items: [
      "Новый раздел «Отчёты»",
      "CSV, XLS, JSON и печатная версия для PDF",
      "История сохранённых отчётов",
      "Пустая аналитика для новых аккаунтов без демо-цифр"
    ]
  },
  {
    version: "0.3",
    date: "Июль 2026",
    title: "Backend-подключение",
    status: "Готово",
    items: [
      "Регистрация владельца через Supabase",
      "Сохранение клиентов, записей, сотрудников и финансов",
      "Удаление карточки уволенного сотрудника",
      "Выход из аккаунта"
    ]
  },
  {
    version: "0.2",
    date: "Июль 2026",
    title: "Операционные разделы",
    status: "Готово",
    items: [
      "Календарь и записи",
      "Клиенты и карточка клиента",
      "Сотрудники, увольнение и роли",
      "Расходники, акции, задачи и аналитика"
    ]
  }
];

const roadmap = [
  ["Смены", "Открытие и закрытие рабочего дня вручную, касса и дневной отчёт."],
  ["Интеграции", "Telegram, WhatsApp, email и загрузка заявок из внешних сервисов."],
  ["Импорт данных", "Нормальная загрузка клиентов, товаров и остатков из Excel/CSV."],
  ["Права команды", "Приглашения сотрудников и доступы по ролям."]
];

export default function UpdatesPage() {
  return (
    <PublicSite>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Badge variant="secondary">История продукта</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">
            Обновления SimpleDesk
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Здесь фиксируются важные изменения: что уже можно использовать,
            что появится дальше и какие части продукта ещё находятся в пилоте.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-4">
          {updates.map((update) => (
            <Card key={update.version} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {update.date}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold">{update.title}</h2>
                </div>
                <Badge variant="success">v{update.version} · {update.status}</Badge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {update.items.map((item) => (
                  <div key={item} className="flex gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Hammer className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Ближайший план</h2>
            </div>
            <div className="mt-5 space-y-3">
              {roadmap.map(([title, text]) => (
                <div key={title} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Как читать статусы</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Всё, что помечено как готовое, можно проверять в рабочем кабинете.
              Функции из плана лучше запускать отдельными шагами, чтобы не ломать
              уже работающую регистрацию и сохранение данных.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/feedback">
                <ClipboardList className="h-4 w-4" />
                Предложить улучшение
              </Link>
            </Button>
          </Card>
        </div>
      </section>
    </PublicSite>
  );
}
