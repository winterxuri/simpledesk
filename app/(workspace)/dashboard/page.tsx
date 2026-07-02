"use client";

import { useState } from "react";
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

export default function DashboardPage() {
  const company = useAppStore((state) => state.company);
  const user = useAppStore((state) => state.user);
  const data = useAppStore((state) => state.data);
  const addToast = useAppStore((state) => state.addToast);
  const [recommendationVisible, setRecommendationVisible] = useState(true);
  const appointmentTerm = company.terminology.appointment;
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = data.appointments
    .filter((appointment) => appointment.date === today)
    .slice(0, 6);
  const attention = [
    `Несколько клиентов не подтвердили ${appointmentTerm}`,
    `Заканчиваются ${company.terminology.material}`,
    "Скоро завершается акция для новых клиентов",
    "Есть просроченные задачи",
    "Найдено свободное время у сотрудника"
  ];
  const revenue = data.financialOperations
    .filter((operation) => operation.type === "income")
    .reduce((sum, operation) => sum + operation.amount, 0);
  const lowStock = data.products.filter((product) =>
    ["low", "critical", "out"].includes(product.status)
  ).length;
  const chartData = Array.from({ length: 7 }, (_, index) => ({
    day: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][index],
    value: 22000 + index * 5200 + (index % 2 === 0 ? 4000 : -1800)
  }));

  return (
    <div>
      <PageHeader
        title={`Доброе утро, ${user?.name?.split(" ")[0] ?? "владелец"}`}
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
          value={formatCurrency(78400)}
          hint="+14% к прошлой среде"
          icon="ChartNoAxesCombined"
          tone="success"
        />
        <MetricCard
          title={`${capitalize(appointmentTerm)} сегодня`}
          value="18"
          hint="14 подтверждены"
          icon="CalendarDays"
        />
        <MetricCard title="Новые клиенты" value="6" hint="3 из акции" icon="UsersRound" />
        <MetricCard
          title="Загрузка сотрудников"
          value="76%"
          hint="2 свободных окна"
          icon="UserRoundCog"
        />
        <MetricCard
          title="Активные акции"
          value="3"
          hint="1 скоро завершится"
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
          <div className="space-y-3">
            {attention.map((item, index) => (
              <div key={item} className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
                <Badge variant={index < 2 ? "warning" : "secondary"}>{index + 1}</Badge>
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Расписание на сегодня">
          <div className="space-y-3">
            {(todayAppointments.length ? todayAppointments : data.appointments.slice(0, 5)).map(
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
            )}
          </div>
        </DashboardWidget>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <DashboardWidget title="Быстрые действия">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "добавить клиента",
              `создать ${appointmentTerm}`,
              `добавить ${company.terminology.product}`,
              "создать задачу",
              "запустить акцию"
            ].map((action) => (
              <Button
                key={action}
                type="button"
                variant="outline"
                onClick={() =>
                  addToast({
                    title: "Демо-действие",
                    description: `Команда "${action}" доступна через верхнее меню "Создать".`,
                    variant: "info"
                  })
                }
              >
                {action}
              </Button>
            ))}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Выручка за последние 7 дней">
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
        </DashboardWidget>
      </div>

      {recommendationVisible ? (
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
