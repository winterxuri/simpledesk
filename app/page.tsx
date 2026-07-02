import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRODUCT_NAME } from "@/config/product";

const features = [
  "Клиенты и история обращений",
  "Календарь, записи и заказы",
  "Сотрудники, задачи и права",
  "Остатки, ресурсы и акции",
  "Выручка, аналитика и AI-рекомендации"
];

const niches = ["Салон красоты", "Автосервис", "Кофейня", "Магазин", "Мастерская"];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative flex min-h-[86vh] overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(20,184,166,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(241,245,249,0.78))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(20,184,166,0.16),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.76),rgba(15,23,42,0.92))]" />
        <div className="absolute inset-x-4 bottom-[-90px] mx-auto max-w-6xl rounded-lg border border-border bg-card/88 p-4 shadow-2xl backdrop-blur md:bottom-[-130px]">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Сегодня</p>
                  <p className="text-xl font-semibold">Доброе утро, Алексей</p>
                </div>
                <Button size="sm">Создать</Button>
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
              <p className="font-semibold">AI-рекомендация</p>
              <p className="mt-3 text-sm text-muted-foreground">
                12 клиентов обычно возвращаются каждые 30-40 дней, но пока не
                записались повторно. Подготовить предложение?
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Подготовить</Button>
                <Button size="sm" variant="outline">
                  Скрыть
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center px-4 pb-44 pt-20 md:pb-56">
          <div className="mb-6 inline-flex w-fit rounded-full border border-border bg-card/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
            {PRODUCT_NAME} для предпринимателей без тяжёлой CRM
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">
            Управляйте малым бизнесом без сложной CRM
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Клиенты, записи, сотрудники, ресурсы, акции и аналитика в одной
            понятной системе.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register" className="flex items-center gap-2">
                Попробовать бесплатно
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Посмотреть демо</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-20 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
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
        <Card className="p-5">
          <h2 className="text-2xl font-semibold">Настройка под бизнес</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Онбординг выбирает шаблон, терминологию, меню и демонстрационные
            данные под вашу нишу. Ненужные разделы скрываются сразу.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Примеры ниш</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {niches.map((niche) => (
              <span key={niche} className="rounded-md bg-muted px-3 py-1 text-sm">
                {niche}
              </span>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Проще перегруженных CRM</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Только нужные модули, понятная навигация, рабочие сценарии для
            малой команды и локальные настройки без корпоративного шума.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Готово к демонстрации</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Внутри есть кликабельный кабинет, mock-данные, AI-помощник,
            аналитика, настройки модулей и адаптивная версия.
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
