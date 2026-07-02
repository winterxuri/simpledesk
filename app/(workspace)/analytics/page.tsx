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

const colors = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
  const data = useAppStore((state) => state.data);
  const role = useAppStore((state) => state.role);
  const [range, setRange] = useState("month");

  const totals = useMemo(() => {
    const income = data.financialOperations
      .filter((operation) => operation.type === "income")
      .reduce((sum, operation) => sum + operation.amount, 0);
    const expenses = data.financialOperations
      .filter((operation) => operation.type === "expense")
      .reduce((sum, operation) => sum + operation.amount, 0);
    return { income, expenses, profit: income - expenses };
  }, [data.financialOperations]);

  const line = Array.from({ length: 8 }, (_, index) => ({
    day: `${index + 1}`,
    revenue: 42000 + index * 6400 + (index % 2 ? -2800 : 3600),
    expenses: 12000 + index * 1500
  }));

  const bar = data.employees.slice(0, 6).map((employee) => ({
    name: employee.name.split(" ")[0],
    load: employee.loadPercent,
    revenue: employee.revenue
  }));

  const pie = [
    { name: "Повторные", value: 58 },
    { name: "Новые", value: 26 },
    { name: "Из акций", value: 16 }
  ];

  return (
    <div>
      <PageHeader
        title="Аналитика"
        description="Выручка, расходы, прибыль, клиенты, загрузка сотрудников и эффективность акций."
        actions={<DateRangeSelector value={range} onChange={setRange} />}
      />
      {role === "employee" ? (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Демо-роль сотрудника показывает ограниченную аналитику без полной финансовой детализации.
        </Card>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Выручка" value={formatCurrency(totals.income)} icon="ChartNoAxesCombined" delta="+14%" />
        <MetricCard title="Расходы" value={formatCurrency(totals.expenses)} icon="Boxes" tone="warning" />
        <MetricCard title="Прибыль" value={formatCurrency(totals.profit)} icon="BadgePercent" tone="success" />
        <MetricCard title="Средний чек" value={formatCurrency(Math.round(totals.income / 84))} icon="UsersRound" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardWidget title="Выручка и расходы">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={line}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => `${Number(value) / 1000}к`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="revenue" name="Выручка" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" name="Расходы" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardWidget>
        <DashboardWidget title="Новые и повторные клиенты">
          <div className="grid min-h-80 gap-4 lg:grid-cols-[1fr_180px] lg:items-center">
            <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                  {pie.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
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
        </DashboardWidget>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardWidget title="Загрузка сотрудников">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bar}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="load" name="Загрузка, %" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardWidget>
        <DashboardWidget title="Таблица лидеров и вывод">
          <div className="space-y-3">
            {bar.slice(0, 5).map((row, index) => (
              <div key={row.name} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>{index + 1}. {row.name}</span>
                <span className="font-medium">{formatCurrency(row.revenue)}</span>
              </div>
            ))}
            <div className="rounded-lg bg-accent p-4 text-sm text-accent-foreground">
              Выручка выросла на 14% по сравнению с прошлым месяцем. Основной рост
              обеспечили повторные клиенты и услуга «Окрашивание».
            </div>
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}
