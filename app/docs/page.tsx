import Link from "next/link";
import { BookOpen, CheckCircle2, Database, FileSpreadsheet, KeyRound, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicSite } from "@/components/layout/public-site";

const sections = [
  {
    title: "1. Создать аккаунт",
    icon: KeyRound,
    text: "Владелец регистрируется, создаёт компанию и проходит мастер настройки бизнеса.",
    steps: ["укажите имя, email и пароль", "введите название компании", "примите условия", "выберите тип бизнеса"]
  },
  {
    title: "2. Настроить рабочее пространство",
    icon: Database,
    text: "После онбординга можно поправить меню, рабочие дни, валюту, роли и терминологию.",
    steps: ["проверьте раздел «Компания»", "включите нужные модули", "расположите меню в удобном порядке", "скройте лишние разделы"]
  },
  {
    title: "3. Добавить данные",
    icon: UsersRound,
    text: "Начните с клиентов, сотрудников, товаров/расходников и первых записей.",
    steps: ["добавьте сотрудников", "создайте клиентов", "заведите товары и минимальные остатки", "создайте записи или продажи"]
  },
  {
    title: "4. Сохранить отчёт",
    icon: FileSpreadsheet,
    text: "Раздел «Отчёты» формирует сводку за день или период из сохранённых данных.",
    steps: ["выберите период", "проверьте показатели", "сохраните снимок", "экспортируйте CSV, XLS, JSON или PDF"]
  }
];

const faq = [
  ["Почему после регистрации пустые цифры?", "Новый аккаунт не получает демо-данные. Показатели появятся после добавления клиентов, записей, продаж и расходов."],
  ["Как сотрудник попадёт в компанию?", "В MVP владелец создаёт карточку сотрудника. Следующий шаг: приглашение по email/ссылке и привязка пользователя к карточке сотрудника."],
  ["Можно ли импортировать Excel?", "Для отчётов уже есть CSV/JSON. Для клиентов и товаров лучше добавить отдельный импорт с проверкой колонок, чтобы не испортить базу."],
  ["Как сделать PDF отчёта?", "Откройте экспорт «PDF / печать» и выберите в браузере «Сохранить как PDF»."]
];

export default function DocsPage() {
  return (
    <PublicSite>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Badge variant="secondary">Документация</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">
            Как пользоваться SimpleDesk
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Короткая инструкция для владельца малого бизнеса: от регистрации до
            первых клиентов, сотрудников, записей и отчётов.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/register">Начать настройку</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/feedback">Задать вопрос</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.text}</p>
              <div className="mt-5 space-y-2">
                {section.steps.map((step) => (
                  <div key={step} className="flex gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-3xl font-semibold tracking-normal">Частые вопросы</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faq.map(([question, answer]) => (
              <Card key={question} className="bg-background p-5">
                <h3 className="font-semibold">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicSite>
  );
}
