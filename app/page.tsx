import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardList,
  Settings2,
  UsersRound
} from "lucide-react";
import { ProductMark } from "@/components/layout/product-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicSite } from "@/components/layout/public-site";
import { PRODUCT_NAME } from "@/config/product";

const productBlocks = [
  {
    title: "Клиенты",
    text: "Единая база, история визитов, ответственный, источник и следующий контакт.",
    icon: UsersRound
  },
  {
    title: "Записи",
    text: "Календарь, время, услуга, сотрудник, стоимость и статус выполнения.",
    icon: CalendarDays
  },
  {
    title: "Остатки",
    text: "Товары, расходники, минимальные остатки, поставщики и списания.",
    icon: ClipboardList
  },
  {
    title: "Отчёты",
    text: "Дневные и периодические сводки, экспорт, импорт и история сохранений.",
    icon: ChartNoAxesCombined
  }
];

const workflows = [
  ["01", "Принять клиента", "Добавьте клиента, создайте запись или продажу и назначьте ответственного."],
  ["02", "Вести день", "Команда видит задачи, записи, остатки и рабочие приоритеты."],
  ["03", "Проверить цифры", "Аналитика и отчёты показывают выручку, расходы, записи и проблемные зоны."],
  ["04", "Улучшить процесс", "По данным видно, кого вернуть, что докупить и какие задачи закрыть."]
];

const launchChecklist = [
  "название компании и ниша",
  "список сотрудников и роли",
  "клиенты или таблица для импорта",
  "товары, расходники и минимальные остатки",
  "рабочие дни, часы и валюта",
  "какие отчёты нужны владельцу"
];

export default function LandingPage() {
  return (
    <PublicSite>
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              CRM, записи и отчёты для малого бизнеса
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <ProductMark decorative className="h-12 w-12 rounded-xl md:h-16 md:w-16" />
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal md:text-7xl">
                {PRODUCT_NAME}
              </h1>
            </div>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-muted-foreground">
              Простая рабочая платформа для клиентов, записей, сотрудников,
              остатков, акций, задач и отчётов без перегруженного интерфейса.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Попробовать бесплатно
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Посмотреть демо</Link>
              </Button>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {["Быстрый старт", "Без лишних модулей", "Экспорт отчётов"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-sm text-muted-foreground">Сегодня</p>
                <p className="text-xl font-semibold">Рабочая панель</p>
              </div>
              <Button type="button" size="sm">Создать</Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Выручка", "0 ₽", "после первой продажи"],
                ["Записи", "0", "после создания записи"],
                ["Задачи", "0", "для контроля дня"]
              ].map(([label, value, hint]) => (
                <div key={label} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.8fr]">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-medium">Расписание</p>
                <div className="mt-4 space-y-3">
                  {["10:00 Консультация", "13:30 Продажа", "17:00 Повторный визит"].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <span>{item}</span>
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-medium">Отчёт дня</p>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Доходы</span><span>0 ₽</span></div>
                  <div className="flex justify-between"><span>Расходы</span><span>0 ₽</span></div>
                  <div className="flex justify-between"><span>Новые клиенты</span><span>0</span></div>
                </div>
                <Button type="button" variant="outline" className="mt-4 w-full" size="sm">
                  Сохранить отчёт
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Что внутри</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Операционная система для ежедневной работы</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            SimpleDesk не заменяет все корпоративные системы сразу. MVP закрывает
            базовые процессы, которые чаще всего нужны малому бизнесу каждый день.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productBlocks.map((block) => {
            const Icon = block.icon;
            return (
              <Card key={block.title} className="p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{block.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{block.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Сценарии</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Как будет выглядеть рабочий день</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Пользователь не должен разбираться с десятками разделов. Ему нужно
              быстро открыть день, добавить данные, увидеть проблемы и сохранить отчёт.
            </p>
          </div>
          <div className="space-y-3">
            {workflows.map(([step, title, text]) => (
              <div key={step} className="grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-[64px_1fr]">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {step}
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Что подготовить перед запуском</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {launchChecklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-border bg-background p-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <BadgePercent className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Что ещё нужно собрать</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Для хорошего запуска пригодятся реальные примеры отчётов владельца,
            таблицы клиентов/товаров, список частых действий сотрудников, правила
            начисления зарплаты и список интеграций, откуда приходят заявки.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Excel клиентов", "Excel остатков", "шаблон отчёта", "список ролей", "каналы заявок"].map((item) => (
              <span key={item} className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Попробуйте SimpleDesk на своих процессах</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Можно открыть демо, а затем создать рабочий аккаунт и подключить Supabase.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/register">Создать аккаунт</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/docs">Открыть инструкцию</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicSite>
  );
}
