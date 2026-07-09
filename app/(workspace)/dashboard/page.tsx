"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { getScopedWorkspaceData } from "@/lib/employee-scope";
import { canPerformAction, type PermissionAction } from "@/lib/permissions";
import { getPromotionDisplayStatus } from "@/lib/promotion-status";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { QuickCreateType } from "@/types";

export default function DashboardPage() {
  const company = useAppStore((state) => state.company);
  const user = useAppStore((state) => state.user);
  const role = useAppStore((state) => state.role);
  const data = useAppStore((state) => state.data);
  const addToast = useAppStore((state) => state.addToast);
  const openQuickCreate = useAppStore((state) => state.openQuickCreate);
  const [greeting, setGreeting] = useState("Здравствуйте");
  const [planHighlight, setPlanHighlight] = useState(false);
  const dayPlanRef = useRef<HTMLDivElement | null>(null);
  const appointmentTerm = company.terminology.appointment;
  const today = getLocalDateKey(new Date());
  const isEmployee = role === "employee";
  const scopedData = useMemo(() => getScopedWorkspaceData(data, user, role), [data, role, user]);
  const visibleAppointments = scopedData.appointments;
  const visibleTasks = scopedData.tasks;
  const visibleClients = scopedData.clients;
  const hasBusinessData = Boolean(
    visibleClients.length ||
    visibleAppointments.length ||
    visibleTasks.length ||
    (!isEmployee && (
      data.products.length ||
      data.promotions.length ||
      data.financialOperations.length
    ))
  );
  const todayAppointments = visibleAppointments
    .filter((appointment) => appointment.date === today)
    .slice(0, 6);
  const todayTasks = visibleTasks
    .filter((task) => task.status !== "done" && task.status !== "cancelled" && task.dueDate <= today)
    .slice(0, 6);
  const todayRevenue = data.financialOperations
    .filter((operation) => operation.type === "income" && operation.date === today)
    .reduce((sum, operation) => sum + operation.amount, 0);
  const newClientsToday = data.clients.filter((client) => client.lastVisit === today && client.visits === 0).length;
  const promotionStatuses = data.promotions.map((promotion) => getPromotionDisplayStatus(promotion, today));
  const activePromotions = promotionStatuses.filter((status) =>
    ["active", "scheduled", "ending"].includes(status)
  ).length;
  const lowStock = data.products.filter((product) =>
    ["low", "critical", "out"].includes(product.status)
  ).length;
  const overdueTasks = visibleTasks.filter((task) => task.status !== "done" && task.status !== "cancelled" && (task.status === "overdue" || task.dueDate < today)).length;
  const unconfirmedAppointments = todayAppointments.filter((appointment) => appointment.status === "planned").length;
  const endingPromotions = promotionStatuses.filter((status) => status === "ending").length;
  const attention = [
    unconfirmedAppointments ? `${unconfirmedAppointments} ${plural(unconfirmedAppointments, ["запись", "записи", "записей"])} ожидает подтверждения` : "",
    !isEmployee && lowStock ? `${lowStock} ${plural(lowStock, ["позиция", "позиции", "позиций"])} склада требует закупки` : "",
    !isEmployee && endingPromotions ? `${endingPromotions} ${plural(endingPromotions, ["акция", "акции", "акций"])} скоро завершится` : "",
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
  const nextAppointment = todayAppointments
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  useEffect(() => {
    setGreeting(getGreetingByHour(new Date().getHours()));
  }, []);

  function openDayPlan() {
    dayPlanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPlanHighlight(true);
    window.setTimeout(() => setPlanHighlight(false), 1800);
    addToast({
      title: isEmployee ? "План дня показан" : "План работы показан",
      description: isEmployee ? "Показываю ваши записи и задачи на сегодня." : "Показываю расписание, задачи и события на сегодня.",
      variant: "info"
    });
  }

  if (!hasBusinessData) {
    return (
      <div>
        <PageHeader
          title={`${greeting}, ${userFirstName}`}
          description={
            isEmployee
              ? "На сегодня нет назначенных записей и задач."
              : "Рабочее пространство пока пустое. Добавьте первые данные, чтобы здесь появились показатели за день."
          }
        />
        <DashboardWidget title="Сегодня">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6">
            <p className="font-medium">Данных за сегодня пока нет</p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {isEmployee
                ? "Когда администратор назначит вам записи или задачи, они появятся здесь."
                : "После регистрации SimpleDesk не подставляет демо-выручку, записи и клиентов. Начните с клиента, записи, продажи или задачи."}
            </p>
          </div>
        </DashboardWidget>
        {!isEmployee ? (
        <div className="mt-6">
          <QuickActionsWidget
            role={role}
            appointmentTerm={appointmentTerm}
            productTerm={company.terminology.product}
            onCreate={openQuickCreate}
          />
        </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${userFirstName}`}
        description={isEmployee ? "Ваши записи, задачи и важные события на сегодня." : "Вот что происходит в вашем бизнесе сегодня."}
        actions={
          <Button type="button" onClick={openDayPlan}>
            К плану на сегодня
          </Button>
        }
      />

      {isEmployee ? (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title={`Мои ${appointmentTerm} сегодня`}
          value={String(todayAppointments.length)}
          hint={todayAppointments.length ? `${todayAppointments.filter((appointment) => appointment.status === "confirmed").length} подтверждены` : "нет записей"}
          icon="CalendarDays"
        />
        <MetricCard
          title="Мои задачи"
          value={String(todayTasks.length)}
          hint={overdueTasks ? `${overdueTasks} просрочено` : "без просрочек"}
          icon="ListTodo"
          tone={overdueTasks ? "danger" : "default"}
        />
        <MetricCard
          title="Следующая запись"
          value={nextAppointment?.time ?? "нет"}
          hint={nextAppointment?.title ?? "свободное окно"}
          icon="Clock3"
        />
        <MetricCard
          title="Клиенты"
          value={String(visibleClients.length)}
          hint="доступные вам карточки"
          icon="UsersRound"
        />
        <MetricCard
          title="Статус дня"
          value={attention.length ? "есть события" : "спокойно"}
          hint={attention.length ? "проверьте блок внимания" : "критичных событий нет"}
          icon="CircleCheck"
          tone={attention.length ? "warning" : "success"}
        />
      </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
      )}

      <div
        ref={dayPlanRef}
        className={`mt-6 grid scroll-mt-20 gap-6 rounded-lg transition-shadow xl:grid-cols-[1.1fr_0.9fr] ${
          planHighlight ? "shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]" : ""
        }`}
      >
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

      {isEmployee ? (
      <div className="mt-6">
        <DashboardWidget title="Мои задачи на сегодня">
          <div className="space-y-3">
            {todayTasks.length ? todayTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{task.description || "Описание не указано"}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </div>
            )) : <EmptyPanel text="На сегодня активных задач нет." />}
          </div>
        </DashboardWidget>
      </div>
      ) : (
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <QuickActionsWidget
          role={role}
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
      )}
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function QuickActionsWidget({
  role,
  appointmentTerm,
  productTerm,
  onCreate
}: {
  role: "owner" | "admin" | "employee";
  appointmentTerm: string;
  productTerm: string;
  onCreate: (type: QuickCreateType) => void;
}) {
  const allActions = [
    { label: "добавить клиента", type: "client", action: "manageClients" },
    { label: `создать ${appointmentTerm}`, type: "appointment", action: "manageAppointments" },
    { label: `добавить ${productTerm}`, type: "product", action: "manageInventory" },
    { label: "создать задачу", type: "task", action: "manageTasks" },
    { label: "добавить продажу", type: "sale", action: "manageSales" }
  ] satisfies { label: string; type: QuickCreateType; action: PermissionAction }[];
  const actions = allActions.filter((action) => canPerformAction(role, action.action));

  if (!actions.length) {
    return null;
  }

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
