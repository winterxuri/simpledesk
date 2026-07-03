"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DashboardWidget } from "@/components/modules/dashboard-widget";
import { MetricCard } from "@/components/modules/metric-card";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { AppIcon } from "@/lib/icons";
import { createId, formatCurrency } from "@/lib/utils";
import type {
  DemoData,
  FinancialOperation,
  ProductStatus,
  ReportSnapshot,
  ReportSummary
} from "@/types";

const reportFormats = [
  { label: "CSV", description: "Для Excel, Google Sheets и обмена таблицами." },
  { label: "XLS", description: "Excel-совместимый файл без отдельной библиотеки." },
  { label: "JSON", description: "Полный снимок отчета для резервной копии и импорта." },
  { label: "PDF", description: "Через печатную версию браузера: Печать -> Сохранить как PDF." }
];

export default function ReportsPage() {
  const company = useAppStore((state) => state.company);
  const data = useAppStore((state) => state.data);
  const role = useAppStore((state) => state.role);
  const saveReportSnapshot = useAppStore((state) => state.saveReportSnapshot);
  const deleteReportSnapshot = useAppStore((state) => state.deleteReportSnapshot);
  const addToast = useAppStore((state) => state.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = getLocalDateKey(new Date());
  const [rangePreset, setRangePreset] = useState("today");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [reportTitle, setReportTitle] = useState("");

  const period = useMemo(
    () => getReportPeriod(rangePreset, customStart, customEnd),
    [customEnd, customStart, rangePreset]
  );

  const currentReport = useMemo(
    () => buildReportSnapshot(data, company.name, period.start, period.end),
    [company.name, data, period.end, period.start]
  );
  const savedReports = data.reportSnapshots ?? [];

  function createCurrentSnapshot() {
    return {
      ...currentReport,
      id: createId("report"),
      title: reportTitle.trim() || currentReport.title,
      generatedAt: new Date().toISOString()
    };
  }

  function handleSaveReport() {
    const snapshot = createCurrentSnapshot();
    saveReportSnapshot(snapshot);
    setReportTitle("");
    addToast({
      title: "Отчёт сохранён",
      description: "Снимок добавлен в историю отчётов.",
      variant: "success"
    });
  }

  function handleExport(format: "csv" | "xls" | "json" | "print") {
    const snapshot = {
      ...currentReport,
      title: reportTitle.trim() || currentReport.title,
      generatedAt: new Date().toISOString()
    };
    const fileBaseName = makeFileName(snapshot.title, snapshot.periodStart, snapshot.periodEnd);

    if (format === "csv") {
      downloadText(`${fileBaseName}.csv`, snapshotToCsv(snapshot, company.currency), "text/csv");
      return;
    }

    if (format === "xls") {
      downloadText(
        `${fileBaseName}.xls`,
        snapshotToHtml(snapshot, company.currency),
        "application/vnd.ms-excel"
      );
      return;
    }

    if (format === "json") {
      downloadText(
        `${fileBaseName}.json`,
        JSON.stringify(snapshot, null, 2),
        "application/json"
      );
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      addToast({
        title: "Не удалось открыть печать",
        description: "Браузер заблокировал новое окно. Разрешите всплывающие окна для сайта.",
        variant: "warning"
      });
      return;
    }

    printWindow.document.write(snapshotToHtml(snapshot, company.currency, true));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const snapshots = file.name.toLowerCase().endsWith(".json")
        ? parseJsonReports(text)
        : [snapshotFromCsv(text, file.name)];

      snapshots.forEach(saveReportSnapshot);
      addToast({
        title: "Импорт выполнен",
        description: `${snapshots.length} ${plural(snapshots.length, ["отчёт добавлен", "отчёта добавлены", "отчётов добавлено"])} в историю.`,
        variant: "success"
      });
    } catch {
      addToast({
        title: "Не удалось импортировать",
        description: "Проверьте, что файл создан в SimpleDesk и имеет формат JSON или CSV.",
        variant: "error"
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Отчёты"
        description="Сводки за день или период, история сохранённых отчётов, импорт и экспорт файлов."
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,application/json,text/csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <AppIcon name="Upload" className="h-4 w-4" />
              Импорт
            </Button>
            <Button type="button" onClick={handleSaveReport}>
              <AppIcon name="Save" className="h-4 w-4" />
              Сохранить отчёт
            </Button>
          </div>
        }
      />

      {role === "employee" ? (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Сотруднику доступна ограниченная сводка. Финансовые отчёты полностью видны владельцу и администратору.
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr]">
            <label className="space-y-1">
              <span className="text-sm font-medium">Период</span>
              <Select value={rangePreset} onChange={(event) => setRangePreset(event.target.value)}>
                <option value="today">Сегодня</option>
                <option value="week">7 дней</option>
                <option value="month">30 дней</option>
                <option value="custom">Свой период</option>
              </Select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">С даты</span>
              <Input
                type="date"
                value={period.start}
                disabled={rangePreset !== "custom"}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">По дату</span>
              <Input
                type="date"
                value={period.end}
                disabled={rangePreset !== "custom"}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </label>
          </div>
          <label className="mt-3 block space-y-1">
            <span className="text-sm font-medium">Название сохранённого отчёта</span>
            <Input
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
              placeholder={currentReport.title}
            />
          </label>
        </Card>

        <Card className="p-4">
          <p className="font-medium">Форматы</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {reportFormats.map((format) => (
              <div key={format.label} className="rounded-lg border border-border p-3">
                <Badge variant="secondary">{format.label}</Badge>
                <p className="mt-2 text-xs text-muted-foreground">{format.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Выручка"
          value={formatCurrency(currentReport.summary.income, company.currency)}
          hint={`${currentReport.summary.salesCount} ${plural(currentReport.summary.salesCount, ["продажа", "продажи", "продаж"])}`}
          icon="ChartNoAxesCombined"
          tone="success"
        />
        <MetricCard
          title="Расходы"
          value={formatCurrency(currentReport.summary.expenses, company.currency)}
          hint={`Списания: ${currentReport.summary.inventoryWriteOff}`}
          icon="Boxes"
          tone="warning"
        />
        <MetricCard
          title="Прибыль"
          value={formatCurrency(currentReport.summary.profit, company.currency)}
          hint="выручка минус расходы"
          icon="BadgePercent"
        />
        <MetricCard
          title="Средний чек"
          value={formatCurrency(currentReport.summary.averageCheck, company.currency)}
          hint="по оплаченным операциям"
          icon="CreditCard"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => handleExport("csv")}>
          <AppIcon name="FileText" className="h-4 w-4" />
          CSV
        </Button>
        <Button type="button" variant="outline" onClick={() => handleExport("xls")}>
          <AppIcon name="FileSpreadsheet" className="h-4 w-4" />
          Excel XLS
        </Button>
        <Button type="button" variant="outline" onClick={() => handleExport("json")}>
          <AppIcon name="FileJson" className="h-4 w-4" />
          JSON
        </Button>
        <Button type="button" variant="outline" onClick={() => handleExport("print")}>
          <AppIcon name="Printer" className="h-4 w-4" />
          PDF / печать
        </Button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardWidget title="Финансы по категориям">
          <ReportTable
            empty="Финансовых операций за период нет."
            headers={["Категория", "Тип", "Сумма", "Операций"]}
            rows={currentReport.sections.financeByCategory.map((row) => [
              row.category,
              row.type === "income" ? "Доход" : "Расход",
              formatCurrency(row.amount, company.currency),
              String(row.count)
            ])}
          />
        </DashboardWidget>

        <DashboardWidget title="Сотрудники">
          <ReportTable
            empty="По сотрудникам пока нет данных за период."
            headers={["Сотрудник", "Выручка", "Записей"]}
            rows={currentReport.sections.employees.map((row) => [
              row.name,
              formatCurrency(row.revenue, company.currency),
              String(row.appointments)
            ])}
          />
        </DashboardWidget>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardWidget title="Записи за период">
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Всего" value={String(currentReport.summary.appointments)} />
            <MiniMetric label="Завершены" value={String(currentReport.summary.completedAppointments)} />
            <MiniMetric label="Оплачены" value={String(currentReport.summary.paidAppointments)} />
          </div>
          <div className="overflow-x-auto">
            {currentReport.sections.appointments.length ? (
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Дата</th>
                    <th className="px-3 py-2">Запись</th>
                    <th className="px-3 py-2">Клиент</th>
                    <th className="px-3 py-2">Сотрудник</th>
                    <th className="px-3 py-2">Статус</th>
                    <th className="px-3 py-2 text-right">Сумма</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentReport.sections.appointments.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">{formatHumanDate(row.date)} {row.time}</td>
                      <td className="px-3 py-2">{row.title}</td>
                      <td className="px-3 py-2">{row.client}</td>
                      <td className="px-3 py-2">{row.employee}</td>
                      <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.price, company.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyPanel text="Записей за период нет." />
            )}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Остатки и расходники">
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Низкий остаток" value={String(currentReport.summary.lowStock)} />
            <MiniMetric label="Списано за период" value={String(currentReport.summary.inventoryWriteOff)} />
          </div>
          <ReportTable
            empty="Критичных остатков сейчас нет."
            headers={["Позиция", "Остаток", "Минимум", "Статус"]}
            rows={currentReport.sections.inventory.map((row) => [
              row.name,
              String(row.stock),
              String(row.minStock),
              getProductStatusLabel(row.status)
            ])}
          />
        </DashboardWidget>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <DashboardWidget title="Клиенты и задачи">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Клиентов в период" value={String(currentReport.summary.clients)} />
            <MiniMetric label="Новые клиенты" value={String(currentReport.summary.newClients)} />
            <MiniMetric label="Открытые задачи" value={String(currentReport.summary.tasksOpen)} />
            <MiniMetric label="Закрытые задачи" value={String(currentReport.summary.tasksDone)} />
          </div>
        </DashboardWidget>

        <DashboardWidget title="Сохранённые отчёты">
          {savedReports.length ? (
            <div className="space-y-3">
              {savedReports.slice(0, 8).map((report) => (
                <div key={report.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatHumanDate(report.periodStart)} - {formatHumanDate(report.periodEnd)} · {new Date(report.generatedAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">{formatCurrency(report.summary.income, company.currency)}</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => downloadText(
                        `${makeFileName(report.title, report.periodStart, report.periodEnd)}.json`,
                        JSON.stringify(report, null, 2),
                        "application/json"
                      )}
                    >
                      <AppIcon name="Download" className="h-4 w-4" />
                      JSON
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => deleteReportSnapshot(report.id)}>
                      <AppIcon name="Trash2" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel text="Сохранённых отчётов пока нет. Сформируйте период и нажмите «Сохранить отчёт»." />
          )}
        </DashboardWidget>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function ReportTable({
  headers,
  rows,
  empty
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (!rows.length) {
    return <EmptyPanel text={empty} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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

function buildReportSnapshot(
  data: DemoData,
  companyName: string,
  periodStart: string,
  periodEnd: string
): ReportSnapshot {
  const financialOperations = data.financialOperations.filter((operation) =>
    isDateInRange(operation.date, periodStart, periodEnd)
  );
  const incomeOperations = financialOperations.filter((operation) => operation.type === "income");
  const expenseOperations = financialOperations.filter((operation) => operation.type === "expense");
  const appointments = data.appointments.filter((appointment) =>
    isDateInRange(appointment.date, periodStart, periodEnd)
  );
  const clients = data.clients.filter((client) =>
    isDateInRange(client.lastVisit, periodStart, periodEnd) ||
    Boolean(client.nextAppointment && isDateInRange(client.nextAppointment, periodStart, periodEnd))
  );
  const tasks = data.tasks.filter((task) => isDateInRange(task.dueDate, periodStart, periodEnd));
  const movements = data.inventoryMovements.filter((movement) =>
    isDateInRange(movement.date, periodStart, periodEnd)
  );
  const inventoryWriteOff = movements
    .filter((movement) => movement.type === "writeOff")
    .reduce((sum, movement) => sum + movement.quantity, 0);
  const income = sumOperations(incomeOperations);
  const expenses = sumOperations(expenseOperations);
  const summary: ReportSummary = {
    income,
    expenses,
    profit: income - expenses,
    averageCheck: incomeOperations.length ? Math.round(income / incomeOperations.length) : 0,
    salesCount: incomeOperations.length,
    appointments: appointments.length,
    completedAppointments: appointments.filter((appointment) => appointment.status === "completed").length,
    paidAppointments: appointments.filter((appointment) => appointment.paid).length,
    clients: clients.length,
    newClients: clients.filter((client) => client.visits <= 1 || client.status === "new").length,
    tasksOpen: tasks.filter((task) => task.status !== "done").length,
    tasksDone: tasks.filter((task) => task.status === "done").length,
    lowStock: data.products.filter((product) => ["low", "critical", "out"].includes(product.status)).length,
    inventoryWriteOff
  };
  const financeByCategory = buildFinanceRows(financialOperations);
  const employees = data.employees
    .filter((employee) => employee.status !== "dismissed")
    .map((employee) => {
      const employeeRevenue = incomeOperations
        .filter((operation) => operation.employeeId === employee.id)
        .reduce((sum, operation) => sum + operation.amount, 0);
      const employeeAppointments = appointments.filter((appointment) => appointment.employeeId === employee.id).length;
      return {
        id: employee.id,
        name: employee.name,
        revenue: employeeRevenue,
        appointments: employeeAppointments,
        load: employee.loadPercent
      };
    })
    .filter((employee) => employee.revenue > 0 || employee.appointments > 0)
    .sort((first, second) => second.revenue - first.revenue);
  const appointmentRows = appointments
    .slice()
    .sort((first, second) => `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`))
    .slice(0, 30)
    .map((appointment) => ({
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      title: appointment.title,
      client: data.clients.find((client) => client.id === appointment.clientId)?.name ?? "Не указан",
      employee: data.employees.find((employee) => employee.id === appointment.employeeId)?.name ?? "Не указан",
      price: appointment.price,
      status: appointment.status,
      paid: appointment.paid
    }));
  const inventory = data.products
    .filter((product) => ["low", "critical", "out"].includes(product.status))
    .map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.currentStock,
      minStock: product.minStock,
      status: product.status,
      supplier: product.supplier
    }));

  return {
    id: "current-report",
    title: `${companyName}: ${periodStart === periodEnd ? "отчёт за день" : "отчёт за период"}`,
    periodStart,
    periodEnd,
    generatedAt: new Date().toISOString(),
    summary,
    sections: {
      financeByCategory,
      employees,
      appointments: appointmentRows,
      inventory
    }
  };
}

function buildFinanceRows(operations: FinancialOperation[]) {
  const grouped = new Map<string, {
    id: string;
    category: string;
    type: "income" | "expense";
    amount: number;
    count: number;
  }>();

  operations.forEach((operation) => {
    const key = `${operation.type}:${operation.category}`;
    const current = grouped.get(key) ?? {
      id: key,
      category: operation.category,
      type: operation.type,
      amount: 0,
      count: 0
    };
    current.amount += operation.amount;
    current.count += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((first, second) => second.amount - first.amount);
}

function sumOperations(operations: FinancialOperation[]) {
  return operations.reduce((sum, operation) => sum + operation.amount, 0);
}

function getReportPeriod(preset: string, customStart: string, customEnd: string) {
  if (preset === "custom") {
    return customStart <= customEnd
      ? { start: customStart, end: customEnd }
      : { start: customEnd, end: customStart };
  }

  const today = new Date();
  if (preset === "week") {
    return { start: getLocalDateKey(addDays(today, -6)), end: getLocalDateKey(today) };
  }
  if (preset === "month") {
    return { start: getLocalDateKey(addDays(today, -29)), end: getLocalDateKey(today) };
  }
  return { start: getLocalDateKey(today), end: getLocalDateKey(today) };
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

function isDateInRange(date: string | undefined, start: string, end: string) {
  return Boolean(date && date >= start && date <= end);
}

function snapshotToCsv(snapshot: ReportSnapshot, currency: string) {
  const sections: string[][] = [
    ["SimpleDesk", "Отчёт"],
    ["Название", snapshot.title],
    ["Период", `${snapshot.periodStart} - ${snapshot.periodEnd}`],
    ["Сформирован", new Date(snapshot.generatedAt).toLocaleString("ru-RU")],
    [],
    ["Показатель", "Значение"],
    ["Выручка", formatCurrency(snapshot.summary.income, currency)],
    ["Расходы", formatCurrency(snapshot.summary.expenses, currency)],
    ["Прибыль", formatCurrency(snapshot.summary.profit, currency)],
    ["Средний чек", formatCurrency(snapshot.summary.averageCheck, currency)],
    ["Продаж", String(snapshot.summary.salesCount)],
    ["Записей", String(snapshot.summary.appointments)],
    ["Клиентов", String(snapshot.summary.clients)],
    [],
    ["Финансы по категориям"],
    ["Категория", "Тип", "Сумма", "Операций"],
    ...snapshot.sections.financeByCategory.map((row) => [
      row.category,
      row.type === "income" ? "Доход" : "Расход",
      formatCurrency(row.amount, currency),
      String(row.count)
    ]),
    [],
    ["Сотрудники"],
    ["Сотрудник", "Выручка", "Записей"],
    ...snapshot.sections.employees.map((row) => [
      row.name,
      formatCurrency(row.revenue, currency),
      String(row.appointments)
    ]),
    [],
    ["Записи"],
    ["Дата", "Время", "Название", "Клиент", "Сотрудник", "Сумма", "Статус", "Оплачено"],
    ...snapshot.sections.appointments.map((row) => [
      row.date,
      row.time,
      row.title,
      row.client,
      row.employee,
      formatCurrency(row.price, currency),
      row.status,
      row.paid ? "да" : "нет"
    ])
  ];

  return sections.map((row) => row.map(csvCell).join(";")).join("\n");
}

function snapshotToHtml(snapshot: ReportSnapshot, currency: string, printable = false) {
  const style = `
    body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 24px 0 8px; }
    p { color: #4b5563; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 13px; }
    th { background: #f3f4f6; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px; }
    .metric { border: 1px solid #d1d5db; padding: 10px; }
    .metric span { color: #6b7280; font-size: 12px; }
    .metric strong { display: block; margin-top: 4px; font-size: 18px; }
    @media print { button { display: none; } body { margin: 12px; } }
  `;

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(snapshot.title)}</title>
  <style>${style}</style>
</head>
<body>
  ${printable ? "<button onclick=\"window.print()\">Печать / сохранить PDF</button>" : ""}
  <h1>${escapeHtml(snapshot.title)}</h1>
  <p>${escapeHtml(snapshot.periodStart)} - ${escapeHtml(snapshot.periodEnd)} · сформирован ${escapeHtml(new Date(snapshot.generatedAt).toLocaleString("ru-RU"))}</p>
  <div class="metrics">
    <div class="metric"><span>Выручка</span><strong>${escapeHtml(formatCurrency(snapshot.summary.income, currency))}</strong></div>
    <div class="metric"><span>Расходы</span><strong>${escapeHtml(formatCurrency(snapshot.summary.expenses, currency))}</strong></div>
    <div class="metric"><span>Прибыль</span><strong>${escapeHtml(formatCurrency(snapshot.summary.profit, currency))}</strong></div>
    <div class="metric"><span>Средний чек</span><strong>${escapeHtml(formatCurrency(snapshot.summary.averageCheck, currency))}</strong></div>
  </div>
  ${htmlTable("Финансы по категориям", ["Категория", "Тип", "Сумма", "Операций"], snapshot.sections.financeByCategory.map((row) => [
    row.category,
    row.type === "income" ? "Доход" : "Расход",
    formatCurrency(row.amount, currency),
    String(row.count)
  ]))}
  ${htmlTable("Сотрудники", ["Сотрудник", "Выручка", "Записей"], snapshot.sections.employees.map((row) => [
    row.name,
    formatCurrency(row.revenue, currency),
    String(row.appointments)
  ]))}
  ${htmlTable("Записи", ["Дата", "Время", "Название", "Клиент", "Сотрудник", "Сумма"], snapshot.sections.appointments.map((row) => [
    row.date,
    row.time,
    row.title,
    row.client,
    row.employee,
    formatCurrency(row.price, currency)
  ]))}
</body>
</html>`;
}

function htmlTable(title: string, headers: string[], rows: string[][]) {
  if (!rows.length) return `<h2>${escapeHtml(title)}</h2><p>Нет данных.</p>`;
  return `<h2>${escapeHtml(title)}</h2><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function parseJsonReports(text: string) {
  const parsed = JSON.parse(text) as unknown;
  const items = Array.isArray(parsed) ? parsed : [parsed];
  const reports = items.filter(isReportSnapshot);
  if (!reports.length) {
    throw new Error("No reports");
  }
  return reports.map((report) => ({
    ...report,
    id: createId("report"),
    generatedAt: report.generatedAt || new Date().toISOString()
  }));
}

function snapshotFromCsv(text: string, fileName: string): ReportSnapshot {
  const rows = parseCsv(text);
  const summary = createEmptySummary();
  const summaryStart = rows.findIndex((row) => row[0] === "Показатель" && row[1] === "Значение");
  if (summaryStart >= 0) {
    for (let index = summaryStart + 1; index < rows.length; index += 1) {
      const [label, value] = rows[index];
      if (!label) break;
      if (label === "Выручка") summary.income = parseAmount(value);
      if (label === "Расходы") summary.expenses = parseAmount(value);
      if (label === "Прибыль") summary.profit = parseAmount(value);
      if (label === "Средний чек") summary.averageCheck = parseAmount(value);
      if (label === "Продаж") summary.salesCount = parseAmount(value);
      if (label === "Записей") summary.appointments = parseAmount(value);
      if (label === "Клиентов") summary.clients = parseAmount(value);
    }
  }

  const financeStart = rows.findIndex((row) => row[0] === "Категория" && row[2] === "Сумма");
  const financeByCategory = financeStart >= 0
    ? rows.slice(financeStart + 1)
      .filter((row) => row[0] && row[2])
      .map((row, index) => ({
        id: `import-finance-${index}`,
        category: row[0],
        type: row[1] === "Расход" ? "expense" as const : "income" as const,
        amount: parseAmount(row[2]),
        count: parseAmount(row[3])
      }))
    : [];

  return {
    id: createId("report"),
    title: `Импорт: ${fileName}`,
    periodStart: getLocalDateKey(new Date()),
    periodEnd: getLocalDateKey(new Date()),
    generatedAt: new Date().toISOString(),
    summary,
    sections: {
      financeByCategory,
      employees: [],
      appointments: [],
      inventory: []
    }
  };
}

function isReportSnapshot(value: unknown): value is ReportSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.title === "string" &&
    typeof record.periodStart === "string" &&
    typeof record.periodEnd === "string" &&
    typeof record.summary === "object" &&
    typeof record.sections === "object";
}

function createEmptySummary(): ReportSummary {
  return {
    income: 0,
    expenses: 0,
    profit: 0,
    averageCheck: 0,
    salesCount: 0,
    appointments: 0,
    completedAppointments: 0,
    paidAppointments: 0,
    clients: 0,
    newClients: 0,
    tasksOpen: 0,
    tasksDone: 0,
    lowStock: 0,
    inventoryWriteOff: 0
  };
}

function parseCsv(text: string) {
  return text.split(/\r?\n/).map((line) => {
    const cells: string[] = [];
    let current = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === "\"" && quoted && next === "\"") {
        current += "\"";
        index += 1;
      } else if (char === "\"") {
        quoted = !quoted;
      } else if (char === ";" && !quoted) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  });
}

function parseAmount(value: string | undefined) {
  return Number(String(value ?? "").replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
}

function csvCell(value: string) {
  const text = String(value ?? "");
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function downloadText(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function makeFileName(title: string, start: string, end: string) {
  const safeTitle = title.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 48);
  return `${safeTitle || "simpledesk-report"}-${start}-${end}`;
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatHumanDate(date: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function getProductStatusLabel(status: ProductStatus) {
  if (status === "low") return "заканчивается";
  if (status === "critical") return "критический остаток";
  if (status === "out") return "нет в наличии";
  return "достаточно";
}

function plural(value: number, forms: [string, string, string]) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
