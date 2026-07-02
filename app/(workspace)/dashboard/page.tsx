"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardWidget } from "@/components/modules/dashboard-widget";
import { MetricCard } from "@/components/modules/metric-card";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { QuickCreateType } from "@/types";

export default function DashboardPage() {
  const company = useAppStore((state) => state.company);
  const user = useAppStore((state) => state.user);
  const data = useAppStore((state) => state.data);
  const addToast = useAppStore((state) => state.addToast);
  const openQuickCreate = useAppStore((state) => state.openQuickCreate);
  const [recommendationVisible, setRecommendationVisible] = useState(true);
  const [greeting, setGreeting] = useState("Здравствуйте");
  const appointmentTerm = company.terminology.appointment;
  const today = getLocalDateKey(new Date());
  const hasBusinessData = Boolean(
    data.clients.length ||
    data.appointments.length ||
    data.products.length ||
    data.promotions.length ||
    data.tasks.length ||
    data.financialOperations.length
  );
  const todayAppointments = data.appointments
    .filter((appointment) => appointment.date === today)
    .slice(0, 6);
  const todayRevenue = data.financialOperations
    .filter((operation) => operation.type === "income" && operation.date === today)
    .reduce((sum, operation) => sum + operation.amount, 0);
  const newClientsToday = data.clients.filter((client) => client.lastVisit === today && client.visits === 0).length;
  const workingEmployees = data.employees.filter((employee) => employee.status !== "dismissed");
  const averageLoad = workingEmployees.length
    ? Math.round(workingEmployees.reduce((sum, employee) => sum + employee.loadPercent, 0) / workingEmployees.length)
    : 0;
  const activePromotions = data.promotions.filter((promotion) =>
    ["active", "scheduled", "ending"].includes(promotion.status)
  ).length;
  const lowStock = data.products.filter((product) =>
    ["low", "critical", "out"].includes(product.status)
  ).length;
  const overdueTasks = data.tasks.filter((task) => task.status !== "done" && (task.status === "overdue" || task.dueDate < today)).length;
  const unconfirmedAppointments = todayAppointments.filter((appointment) => appointment.status === "planned").length;
  const endingPromotions = data.promotions.filter((promotion) => promotion.status === "ending").length;
  const attention = [
    unconfirmedAppointments ? `${unconfirmedAppointments} ${plural(unconfirmedAppointments, ["запись", "записи", "записей"])} ожидает подтверждения` : "",
    lowStock ? `${lowStock} ${plural(lowStock, ["позиция", "позиции", "позиций"])} склада требует закупки` : "",
    endingPromotions ? `${endingPromotions} ${plural(endingPromotions, ["акция", "акции", "акций"])} скоро завершится` : "",
    overdueTasks ? `${overdueTasks} ${plural(overdueTasks, ["задача", "задачи", "задач"])} просрочено` : ""
  ].filter(Boolean);
  const chartData = getLastSevenDays().map(({ date, label }) => ({
    day: label,
    value: data.financialOperations
      .filter((operation) => operation.type === "income" && operation.date === date)
      .reduce((sum, operation) => sum + operation.amount, 0)
  }));
  const chartHasData = chartData.some((item) => item.value > 0);
  const userFirstName = user?.name?.split(" ")[0] ?? "владелец";

  useEffect(() => {
    setGreeting(getGreetingByHour(new Date().getHours()));
  }, []);

  if (!hasBusinessData) {
    return (
      <div>
        <PageHeader
          title={`${greeting}, ${userFirstName}`}
          description="Рабочее пространство пока пустое. Добавьте первые данные, чтобы здесь появились показатели за день."
        />
        <DashboardWidget title="Сегодня">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6">
            <p className="font-medium">Данных за сегодня пока нет</p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              После регистрации SimpleDesk не подставляет демо-выручку, записи и клиентов. Начните с клиента, записи, продажи или задачи.
            </p>
          </div>
        </DashboardWidget>
        <div className="mt-6">
          <QuickActionsWidget
            appointmentTerm={appointmentTerm}
            productTerm={company.terminology.product}
            onCreate={openQuickCreate}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${userFirstName}`}
        description="Вот что происходит в вашем бизнесе сегодня."
        actions={
          <Button type="button" onClick={() => addToast({
            title: "Рабочий день открыт",
            description: "Проверьте записи, задачи и остатки на сегодня.",
            variant: "info"
          })}>
            Открыть план дня
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          title="Выручка за сегодня"
          value={formatCurrency(todayRevenue)}
          hint={todayRevenue ? "по сохранённым продажам" : "продаж сегодня нет"}
          icon="ChartNoAxesCombined"
          tone="success"
        />
        <MetricCard
          title={`${capitalize(appointmentTerm)} сегодня`}
          value={String(todayAppointments.length)}
          hint={todayAppointments.length ? `${todayAppointments.filter((appointment) => appointment.status === "confirmed").length} подтверждены` : "нет записей"}
          icon="CalendarDays"
        />
        <MetricCard title="Новые клиенты" value={String(newClientsToday)} hint={newClientsToday ? "добавлены сегодня" : "новых клиентов нет"} icon="UsersRound" />
        <MetricCard
          title="Загрузка сотрудников"
          value={`${averageLoad}%`}
          hint={workingEmployees.length ? `${workingEmployees.length} в команде` : "сотрудников нет"}
          icon="UserRoundCog"
        />
        <MetricCard
          title="Активные акции"
          value={String(activePromotions)}
          hint={endingPromotions ? `${endingPromotions} скоро завершится` : "активных акций нет"}
          icon="BadgePercent"
          tone="warning"
        />
        <MetricCard
          title="Низкий остаток"
          value={String(lowStock)}
          hint="нужна закупка"
          icon="Boxes"
          tone="danger"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardWidget title="Требует внимания">
          {attention.length ? (
            <div className="space-y-3">
              {attention.map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
                  <Badge variant={index < 2 ? "warning" : "secondary"}>{index + 1}</Badge>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel text="Критичных событий пока нет." />
          )}
        </DashboardWidget>

        <DashboardWidget title="Расписание на сегодня">
          <div className="space-y-3">
            {todayAppointments.length ? todayAppointments.map(
              (appointment) => {
                const client = data.clients.find((item) => item.id === appointment.clientId);
                const employee = data.employees.find((item) => item.id === appointment.employeeId);
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">{appointment.time} · {appointment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {client?.name} · {employee?.name}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                );
              }
            ) : <EmptyPanel text={`На сегодня ${appointmentTerm} не запланированы.`} />}
          </div>
        </DashboardWidget>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <QuickActionsWidget
          appointmentTerm={appointmentTerm}
          productTerm={company.terminology.product}
          onCreate={openQuickCreate}
        />

        <DashboardWidget title="Выручка за последние 7 дней">
          {chartHasData ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(value) => `${Number(value) / 1000}к`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.16)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyPanel text="Продаж за последние 7 дней пока нет." />
          )}
        </DashboardWidget>
      </div>

      {recommendationVisible && data.clients.length ? (
      <div className="mt-6">
        <DashboardWidget title="Рекомендация по клиентам">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">
                12 клиентов обычно возвращаются каждые 30-40 дней, но пока не
                записались повторно. Подготовить предложение?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Основано на истории визитов, сегментах клиентов и активности за месяц.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => addToast({
                title: "Задача создана",
                description: "Добавьте кампанию или задачу на повторный контакт в следующих разделах.",
                variant: "success"
              })}>
                Создать задачу
              </Button>
              <Button type="button" variant="outline" onClick={() => setRecommendationVisible(false)}>
                Скрыть
              </Button>
            </div>
          </div>
        </DashboardWidget>
      </div>
      ) : null}
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function QuickActionsWidget({
  appointmentTerm,
  productTerm,
  onCreate
}: {
  appointmentTerm: string;
  productTerm: string;
  onCreate: (type: QuickCreateType) => void;
}) {
  const actions: { label: string; type: QuickCreateType }[] = [
    { label: "добавить клиента", type: "client" },
    { label: `создать ${appointmentTerm}`, type: "appointment" },
    { label: `добавить ${productTerm}`, type: "product" },
    { label: "создать задачу", type: "task" },
    { label: "запустить акцию", type: "promotion" },
    { label: "добавить продажу", type: "sale" }
  ];

  return (
    <DashboardWidget title="Быстрые действия">
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <Button
            key={action.type}
            type="button"
            variant="outline"
            onClick={() => onCreate(action.type)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </DashboardWidget>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function getLastSevenDays() {
  const formatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      date: getLocalDateKey(date),
      label: formatter.format(date)
    };
  });
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getGreetingByHour(hour: number) {
  if (hour >= 5 && hour < 12) return "Доброе утро";
  if (hour >= 12 && hour < 18) return "Добрый день";
  if (hour >= 18 && hour < 23) return "Добрый вечер";
  return "Доброй ночи";
}

function plural(value: number, forms: [string, string, string]) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
