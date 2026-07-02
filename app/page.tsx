import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRODUCT_NAME } from "@/config/product";

const features = [
  "Клиенты и история обращений",
  "Календарь, записи и заказы",
  "Сотрудники, задачи и права",
  "Остатки, ресурсы и акции",
  "Выручка, аналитика и отчёты"
];

const niches = ["Салон красоты", "Автосервис", "Кофейня", "Магазин", "Мастерская"];
const heroStats = [
  ["Клиенты", "единая база и история"],
  ["Записи", "календарь и ресурсы"],
  ["Задачи", "контроль выполнения"]
];
const workflows = [
  ["1", "Записать клиента", "сразу выбрать услугу, время и ответственного"],
  ["2", "Проверить остатки", "увидеть, что заканчивается и что нужно заказать"],
  ["3", "Закрыть задачу", "отметить чек-лист и перевести работу в выполнено"]
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative flex min-h-[86vh] overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(20,184,166,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(241,245,249,0.78))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(20,184,166,0.16),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.76),rgba(15,23,42,0.92))]" />
        <div className="absolute inset-x-4 bottom-[-82px] mx-auto max-w-6xl rounded-lg border border-border bg-card/90 p-4 shadow-2xl backdrop-blur md:bottom-[-126px]">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Рабочий день</p>
                  <p className="text-xl font-semibold">Панель владельца</p>
                </div>
                <span className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                  Создать
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["78 400 ₽", "18 записей", "6 задач"].map((value) => (
                  <div key={value} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Показатель</p>
                    <p className="mt-2 text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-32 rounded-lg border border-border bg-[linear-gradient(135deg,rgba(20,184,166,0.18),rgba(14,165,233,0.08))]" />
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="font-semibold">Операционная рекомендация</p>
              <p className="mt-3 text-sm text-muted-foreground">
                12 клиентов обычно возвращаются каждые 30-40 дней, но пока не
                записались повторно. Запланируйте повторный контакт.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                  Создать задачу
                </span>
                <span className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm font-medium">
                  Скрыть
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 pb-44 pt-6 md:pb-56">
          <nav className="mb-16 flex items-center justify-between gap-4">
            <Link href="/" className="text-lg font-semibold text-primary">
              {PRODUCT_NAME}
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Демо</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          </nav>
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-6 inline-flex w-fit rounded-full border border-border bg-card/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
              CRM и операционный кабинет для малого бизнеса
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-normal md:text-7xl">
              {PRODUCT_NAME}
            </h1>
            <p className="mt-6 max-w-2xl text-xl text-muted-foreground">
              Простая платформа для клиентов, записей, сотрудников, ресурсов,
              акций, задач и аналитики без перегруженного интерфейса.
            </p>
            <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
              {heroStats.map(([title, description]) => (
                <div key={title} className="rounded-lg border border-border bg-card/75 p-3 backdrop-blur">
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Попробовать бесплатно
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Посмотреть демо</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-20 md:grid-cols-3">
        <Card className="p-5 transition-colors hover:bg-muted/30 md:col-span-2">
          <h2 className="text-2xl font-semibold">Основные возможности</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {feature}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 transition-colors hover:bg-muted/30">
          <h2 className="text-2xl font-semibold">Настройка под бизнес</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Онбординг выбирает шаблон, терминологию, меню и демонстрационные
            данные под вашу нишу. Ненужные разделы скрываются сразу.
          </p>
        </Card>
        <Card className="p-5 transition-colors hover:bg-muted/30">
          <h2 className="text-xl font-semibold">Примеры ниш</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {niches.map((niche) => (
              <span key={niche} className="rounded-md bg-muted px-3 py-1 text-sm">
                {niche}
              </span>
            ))}
          </div>
        </Card>
        <Card className="p-5 transition-colors hover:bg-muted/30">
          <h2 className="text-xl font-semibold">Рабочие сценарии</h2>
          <div className="mt-4 space-y-3">
            {workflows.map(([step, title, description]) => (
              <div key={step} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  {step}
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 transition-colors hover:bg-muted/30">
          <h2 className="text-xl font-semibold">Готово к пилоту</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Внутри есть кликабельный кабинет, аналитика, настройки модулей
            и адаптивная версия.
          </p>
        </Card>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Запустите рабочее пространство</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Регистрация ведёт в онбординг, демо-вход открывает готовый кабинет.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/register">Зарегистрироваться</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Войти в демо</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
