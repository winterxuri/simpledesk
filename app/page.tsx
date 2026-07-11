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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicSite } from "@/components/layout/public-site";
import { PRODUCT_NAME } from "@/config/product";

const productBlocks = [
  {
    title: "Клиенты",
    text: "Единая база, история визитов, любимый мастер, источник и следующая запись.",
    icon: UsersRound
  },
  {
    title: "Записи",
    text: "Календарь по мастерам, услуга, время, стоимость и статус визита.",
    icon: CalendarDays
  },
  {
    title: "Расходники",
    text: "Краска, гель-лак и материалы: остатки, минимальные запасы и списания по услугам.",
    icon: ClipboardList
  },
  {
    title: "Отчёты",
    text: "Выручка по мастерам и услугам, экспорт, импорт и история сохранений.",
    icon: ChartNoAxesCombined
  }
];

const workflows = [
  ["01", "Записать клиента", "Добавьте клиента, выберите мастера и услугу, назначьте время визита."],
  ["02", "Вести смену", "Мастера видят своё расписание, клиентов и расходники, которые заканчиваются."],
  ["03", "Проверить кассу", "Аналитика показывает выручку по мастерам, услугам и загрузку кресел."],
  ["04", "Вернуть клиента", "Акции и напоминания поднимают повторные записи и средний чек."]
];

const launchChecklist = [
  "название салона и адрес",
  "список мастеров и услуги",
  "клиенты или таблица для импорта",
  "расходники и минимальные остатки",
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
              Записи и CRM для салонов красоты и студий с несколькими мастерами
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <ProductMark decorative className="h-12 w-12 rounded-xl md:h-16 md:w-16" />
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal md:text-7xl">
                {PRODUCT_NAME}
              </h1>
            </div>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-muted-foreground">
              Простая платформа для салона или студии с несколькими мастерами:
              клиенты, запись, расходники, зарплата мастеров и отчёты — без
              переплаты за функции для сетей.
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
              {["Настройка за один день", "Без предоплаты на год", "Расходники под контролем"].map((item) => (
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
              <span className={buttonVariants({ size: "sm" })}>Создать</span>
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
                  {["10:00 Маникюр — Ирина", "13:30 Окрашивание — София", "17:00 Коррекция бровей — Анна"].map((item) => (
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
                <span className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4 w-full" })}>
                  Сохранить отчёт
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Что внутри</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Всё для записи и работы мастеров</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            SimpleDesk не пытается заменить большие CRM для сетей салонов. MVP
            закрывает то, что нужно каждый день небольшому салону или студии
            с несколькими мастерами.
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
            Для хорошего запуска пригодятся прайс-лист на услуги, список мастеров
            с графиком, правила начисления зарплаты (ставка/процент) и каналы,
            откуда приходят клиенты — Instagram, Яндекс, рекомендации.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Excel клиентов", "Excel расходников", "прайс-лист услуг", "график мастеров", "каналы клиентов"].map((item) => (
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
            <h2 className="text-2xl font-semibold">Попробуйте SimpleDesk на процессах своего салона</h2>
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
