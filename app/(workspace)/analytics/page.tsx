"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card } from "@/components/ui/card";
import { DateRangeSelector } from "@/components/modules/date-range-selector";
import { MetricCard } from "@/components/modules/metric-card";
import { PageHeader } from "@/components/modules/page-header";
import { DashboardWidget } from "@/components/modules/dashboard-widget";
import { useAppStore } from "@/store/app-store";
import { formatCurrency } from "@/lib/utils";
import type { Client, FinancialOperation } from "@/types";

const colors = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"];
const chartAxisProps = {
  tick: { fill: "hsl(var(--muted-foreground))" },
  tickLine: { stroke: "hsl(var(--border))" },
  axisLine: { stroke: "hsl(var(--border))" }
};
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  color: "hsl(var(--card-foreground))"
};

export default function AnalyticsPage() {
  const data = useAppStore((state) => state.data);
  const role = useAppStore((state) => state.role);
  const [range, setRange] = useState("month");
  const periodDays = getRangeDays(range);
  const today = getLocalDateKey(new Date());
  const periodStart = getLocalDateKey(addDays(new Date(), -(periodDays - 1)));
  const previousStart = getLocalDateKey(addDays(new Date(), -(periodDays * 2 - 1)));
  const previousEnd = getLocalDateKey(addDays(new Date(), -periodDays));

  const totals = useMemo(() => {
    const currentOperations = data.financialOperations.filter((operation) =>
      isDateInRange(operation.date, periodStart, today)
    );
    const previousOperations = data.financialOperations.filter((operation) =>
      isDateInRange(operation.date, previousStart, previousEnd)
    );
    const income = sumOperations(currentOperations, "income");
    const expenses = sumOperations(currentOperations, "expense");
    const previousIncome = sumOperations(previousOperations, "income");
    const salesCount = currentOperations.filter((operation) => operation.type === "income").length;

    return {
      income,
      expenses,
      profit: income - expenses,
      averageCheck: salesCount ? Math.round(income / salesCount) : 0,
      incomeDelta: getDeltaLabel(income, previousIncome)
    };
  }, [data.financialOperations, periodStart, previousEnd, previousStart, today]);

  const line = useMemo(
    () => buildFinancialSeries(data.financialOperations, periodDays),
    [data.financialOperations, periodDays]
  );
  const lineHasData = line.some((item) => item.revenue > 0 || item.expenses > 0);

  const bar = data.employees.filter((employee) => employee.status !== "dismissed").slice(0, 6).map((employee) => ({
    name: employee.name.split(" ")[0],
    revenue: employee.revenue,
    appointments: employee.appointmentsCount
  }));
  const barHasData = bar.some((employee) => employee.revenue > 0 || employee.appointments > 0);

  const pie = useMemo(() => buildClientSegments(data.clients), [data.clients]);
  const leaders = bar
    .filter((employee) => employee.revenue > 0 || employee.appointments > 0)
    .sort((first, second) => second.revenue - first.revenue)
    .slice(0, 5);
  const hasAnalyticsData = Boolean(
    data.financialOperations.length ||
    data.clients.length ||
    data.appointments.length ||
    data.products.length ||
    data.promotions.length
  );

  return (
    <div>
      <PageHeader
        title="Аналитика"
        description="Выручка, расходы, прибыль, клиенты, загрузка сотрудников и эффективность акций."
        actions={<DateRangeSelector value={range} onChange={setRange} />}
      />
      {role === "employee" ? (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Роль сотрудника показывает ограниченную аналитику без полной финансовой детализации.
        </Card>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Выручка"
          value={formatCurrency(totals.income)}
          hint={totals.income ? "по сохранённым продажам" : "продаж за период нет"}
          icon="ChartNoAxesCombined"
          delta={totals.incomeDelta}
        />
        <MetricCard
          title="Расходы"
          value={formatCurrency(totals.expenses)}
          hint={totals.expenses ? "по сохранённым расходам" : "расходов за период нет"}
          icon="Boxes"
          tone="warning"
        />
        <MetricCard
          title="Прибыль"
          value={formatCurrency(totals.profit)}
          hint={totals.profit ? "выручка минус расходы" : "нет финансовых операций"}
          icon="BadgePercent"
          tone="success"
        />
        <MetricCard
          title="Средний чек"
          value={formatCurrency(totals.averageCheck)}
          hint={totals.averageCheck ? "по продажам за период" : "продаж за период нет"}
          icon="UsersRound"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardWidget title="Выручка и расходы">
          {lineHasData ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={line}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" {...chartAxisProps} />
                  <YAxis tickFormatter={(value) => `${Number(value) / 1000}к`} {...chartAxisProps} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="revenue" name="Выручка" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expenses" name="Расходы" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyPanel text="Финансовых операций за выбранный период пока нет." />
          )}
        </DashboardWidget>
        <DashboardWidget title="Новые и повторные клиенты">
          {pie.length ? (
            <div className="grid min-h-80 gap-4 lg:grid-cols-[1fr_180px] lg:items-center">
              <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                    {pie.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {pie.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="truncate text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyPanel text="Клиентов пока нет. После добавления клиентов здесь появится распределение по сегментам." />
          )}
        </DashboardWidget>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardWidget title="Записи сотрудников">
          {barHasData ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bar}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" {...chartAxisProps} />
                  <YAxis {...chartAxisProps} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="appointments" name="Записи" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyPanel text="Данные появятся после создания записей и распределения работы по сотрудникам." />
          )}
        </DashboardWidget>
        <DashboardWidget title="Таблица лидеров и вывод">
          <div className="space-y-3">
            {leaders.length ? leaders.map((row, index) => (
              <div key={row.name} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>{index + 1}. {row.name}</span>
                <span className="font-medium">{formatCurrency(row.revenue)}</span>
              </div>
            )) : (
              <EmptyPanel text="Лидеров пока нет: у сотрудников ещё нет выручки или выполненных записей." />
            )}
            {hasAnalyticsData ? (
              <div className="rounded-lg bg-accent p-4 text-sm text-accent-foreground">
                Вывод будет точнее после накопления продаж, записей и расходов за несколько рабочих дней.
              </div>
            ) : (
              <div className="rounded-lg bg-accent p-4 text-sm text-accent-foreground">
                Недостаточно данных для вывода. Добавьте клиентов, записи, продажи или расходы.
              </div>
            )}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function getRangeDays(range: string) {
  if (range === "today") return 1;
  if (range === "week") return 7;
  if (range === "quarter") return 90;
  return 30;
}

function buildFinancialSeries(operations: FinancialOperation[], periodDays: number) {
  const bucketCount = Math.min(periodDays, 14);
  const periodStart = addDays(new Date(), -(periodDays - 1));

  return Array.from({ length: bucketCount }, (_, index) => {
    const startOffset = Math.floor((index * periodDays) / bucketCount);
    const endOffset = Math.floor(((index + 1) * periodDays) / bucketCount) - 1;
    const startDate = addDays(periodStart, startOffset);
    const endDate = addDays(periodStart, endOffset);
    const startKey = getLocalDateKey(startDate);
    const endKey = getLocalDateKey(endDate);
    const bucketOperations = operations.filter((operation) => isDateInRange(operation.date, startKey, endKey));

    return {
      day: formatBucketLabel(startDate, endDate),
      revenue: sumOperations(bucketOperations, "income"),
      expenses: sumOperations(bucketOperations, "expense")
    };
  });
}

function buildClientSegments(clients: Client[]) {
  if (!clients.length) return [];

  const segments = clients.reduce(
    (acc, client) => {
      const source = client.source.toLowerCase();
      if (source.includes("акц") || source.includes("promo")) {
        acc.promo += 1;
      } else if (client.visits > 1 || client.status === "loyal") {
        acc.repeat += 1;
      } else if (client.status === "new" || client.visits <= 1) {
        acc.new += 1;
      } else {
        acc.other += 1;
      }
      return acc;
    },
    { repeat: 0, new: 0, promo: 0, other: 0 }
  );

  const total = segments.repeat + segments.new + segments.promo + segments.other;
  if (!total) return [];

  return [
    { name: "Повторные", count: segments.repeat },
    { name: "Новые", count: segments.new },
    { name: "Из акций", count: segments.promo },
    { name: "Другие", count: segments.other }
  ]
    .filter((segment) => segment.count > 0)
    .map((segment) => ({
      name: segment.name,
      value: Math.round((segment.count / total) * 100)
    }));
}

function sumOperations(operations: FinancialOperation[], type: "income" | "expense") {
  return operations
    .filter((operation) => operation.type === type)
    .reduce((sum, operation) => sum + operation.amount, 0);
}

function isDateInRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + days);
  return result;
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatBucketLabel(startDate: Date, endDate: Date) {
  const formatter = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" });
  const start = formatter.format(startDate);
  const end = formatter.format(endDate);
  return start === end ? start : `${start}-${end}`;
}

function getDeltaLabel(current: number, previous: number) {
  if (!current || !previous) return undefined;
  const delta = Math.round(((current - previous) / previous) * 100);
  if (!Number.isFinite(delta) || delta === 0) return undefined;
  return `${delta > 0 ? "+" : ""}${delta}%`;
}
