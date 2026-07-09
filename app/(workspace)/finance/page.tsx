"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type DataTableColumn } from "@/components/modules/data-table";
import { EmptyState } from "@/components/modules/empty-state";
import { MetricCard } from "@/components/modules/metric-card";
import { PageHeader } from "@/components/modules/page-header";
import { SearchAndFilters } from "@/components/modules/search-and-filters";
import { useAppStore } from "@/store/app-store";
import { formatCurrency, formatDate, getLocalDateKey } from "@/lib/utils";
import type {
  FinancialOperation,
  FinancialOperationSource,
  Product,
  Sale,
  SalePaymentMethod
} from "@/types";

const typeOptions: { value: FinancialOperation["type"] | "all"; label: string }[] = [
  { value: "all", label: "Все типы" },
  { value: "income", label: "Доходы" },
  { value: "expense", label: "Расходы" }
];

const sourceOptions: { value: FinancialOperationSource | "all"; label: string }[] = [
  { value: "all", label: "Все источники" },
  { value: "sale", label: "Продажи" },
  { value: "refund", label: "Возвраты" },
  { value: "manual", label: "Ручные" },
  { value: "appointment", label: "Записи" },
  { value: "inventory", label: "Склад" }
];

const paymentOptions: { value: SalePaymentMethod | "all"; label: string }[] = [
  { value: "all", label: "Все оплаты" },
  { value: "cash", label: "Наличные" },
  { value: "card", label: "Карта" },
  { value: "transfer", label: "Перевод" },
  { value: "online", label: "Онлайн" },
  { value: "mixed", label: "Смешанная" }
];

const paymentMethodLabels: Record<SalePaymentMethod, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  online: "Онлайн",
  mixed: "Смешанная"
};

const sourceLabels: Record<FinancialOperationSource, string> = {
  manual: "Ручная",
  sale: "Продажа",
  refund: "Возврат",
  appointment: "Запись",
  inventory: "Склад"
};

const initialOperationForm = {
  type: "expense" as FinancialOperation["type"],
  category: "",
  amount: "",
  date: getLocalDateKey(),
  paymentMethod: "cash" as SalePaymentMethod,
  comment: ""
};

export default function FinancePage() {
  const company = useAppStore((state) => state.company);
  const data = useAppStore((state) => state.data);
  const addFinancialOperation = useAppStore((state) => state.addFinancialOperation);
  const addToast = useAppStore((state) => state.addToast);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FinancialOperation["type"] | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<FinancialOperationSource | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<SalePaymentMethod | "all">("all");
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [operationForm, setOperationForm] = useState(initialOperationForm);

  const sales = data.sales ?? [];
  const clientById = useMemo(() => new Map(data.clients.map((client) => [client.id, client])), [data.clients]);
  const employeeById = useMemo(() => new Map(data.employees.map((employee) => [employee.id, employee])), [data.employees]);
  const productById = useMemo(() => new Map(data.products.map((product) => [product.id, product])), [data.products]);
  const saleByOperationId = useMemo(() => {
    const map = new Map<string, Sale>();
    sales.forEach((sale) => {
      if (sale.financialOperationId) {
        map.set(sale.financialOperationId, sale);
      }
    });
    return map;
  }, [sales]);

  const financeRows = useMemo(
    () =>
      data.financialOperations
        .map((operation) => {
          const sale = saleByOperationId.get(operation.id);
          const source = getOperationSource(operation, sale);
          const paymentMethod = operation.paymentMethod ?? sale?.paymentMethod;
          return {
            ...operation,
            source,
            paymentMethod
          };
        })
        .sort((first, second) => second.date.localeCompare(first.date)),
    [data.financialOperations, saleByOperationId]
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filteredOperations = useMemo(
    () =>
      financeRows.filter((operation) => {
        if (typeFilter !== "all" && operation.type !== typeFilter) {
          return false;
        }
        if (sourceFilter !== "all" && operation.source !== sourceFilter) {
          return false;
        }
        if (paymentFilter !== "all" && operation.paymentMethod !== paymentFilter) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }
        const client = operation.clientId ? clientById.get(operation.clientId) : undefined;
        const employee = operation.employeeId ? employeeById.get(operation.employeeId) : undefined;
        return [
          operation.category,
          operation.comment,
          operation.date,
          operation.type,
          operation.source ? sourceLabels[operation.source] : "",
          operation.paymentMethod ? paymentMethodLabels[operation.paymentMethod] : "",
          client?.name,
          client?.phone,
          employee?.name
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      }),
    [clientById, employeeById, financeRows, normalizedSearch, paymentFilter, sourceFilter, typeFilter]
  );

  const completedSales = sales.filter((sale) => sale.status !== "cancelled");
  const grossSalesRevenue = completedSales.reduce((sum, sale) => sum + sale.amount, 0);
  const saleRefundAmount = completedSales.reduce((sum, sale) => sum + (sale.refundedAmount ?? 0), 0);
  const operationRefundAmount = financeRows
    .filter((operation) => operation.type === "expense" && operation.source === "refund")
    .reduce((sum, operation) => sum + operation.amount, 0);
  const refundAmount = Math.max(saleRefundAmount, operationRefundAmount);
  const netSalesRevenue = Math.max(0, grossSalesRevenue - refundAmount);
  const costOfGoods = completedSales.reduce(
    (sum, sale) => sum + getSaleCostOfGoods(sale, productById),
    0
  );
  const manualIncome = financeRows
    .filter((operation) => operation.type === "income" && operation.source === "manual")
    .reduce((sum, operation) => sum + operation.amount, 0);
  const manualExpenses = financeRows
    .filter((operation) => operation.type === "expense" && operation.source !== "refund")
    .reduce((sum, operation) => sum + operation.amount, 0);
  const cashMovement = financeRows.reduce(
    (sum, operation) => sum + (operation.type === "income" ? operation.amount : -operation.amount),
    0
  );
  const estimatedProfit = netSalesRevenue + manualIncome - costOfGoods - manualExpenses;
  const paymentRows = buildPaymentRows(financeRows);
  const expenseRows = buildCategoryRows(
    financeRows.filter((operation) => operation.type === "expense" && operation.source !== "refund")
  );

  const columns: DataTableColumn<FinancialOperation>[] = [
    {
      key: "date",
      header: "Дата",
      cell: (operation) => formatDate(operation.date, "dd.MM.yyyy")
    },
    {
      key: "type",
      header: "Тип",
      cell: (operation) => (
        <Badge variant={operation.type === "income" ? "success" : "warning"}>
          {operation.type === "income" ? "Доход" : "Расход"}
        </Badge>
      )
    },
    {
      key: "category",
      header: "Категория",
      cell: (operation) => (
        <div>
          <p className="font-medium">{operation.category}</p>
          <p className="text-xs text-muted-foreground">
            {operation.source ? sourceLabels[operation.source] : "Ручная"}
          </p>
        </div>
      )
    },
    {
      key: "related",
      header: "Связь",
      cell: (operation) => {
        const client = operation.clientId ? clientById.get(operation.clientId)?.name : "";
        const employee = operation.employeeId ? employeeById.get(operation.employeeId)?.name : "";
        return [client, employee].filter(Boolean).join(" · ") || "Не указано";
      }
    },
    {
      key: "payment",
      header: "Оплата",
      cell: (operation) => operation.paymentMethod ? paymentMethodLabels[operation.paymentMethod] : "Не указано"
    },
    {
      key: "comment",
      header: "Комментарий",
      cell: (operation) => operation.comment || "Без комментария"
    },
    {
      key: "amount",
      header: "Сумма",
      cell: (operation) => (
        <span className={operation.type === "income" ? "text-emerald-600" : "text-amber-600"}>
          {formatSignedCurrency(operation, company.currency)}
        </span>
      ),
      className: "text-right"
    }
  ];

  function openOperationDialog(type: FinancialOperation["type"] = "expense") {
    setOperationForm({
      ...initialOperationForm,
      type,
      date: getLocalDateKey()
    });
    setOperationDialogOpen(true);
  }

  function saveOperation() {
    const amount = Number(operationForm.amount);
    const category = operationForm.category.trim();
    const comment = operationForm.comment.trim();

    if (!category) {
      addToast({
        title: "Укажите категорию",
        description: "Например: аренда, закупка, маркетинг или дополнительный доход.",
        variant: "warning"
      });
      return;
    }

    if (!operationForm.date) {
      addToast({
        title: "Укажите дату",
        description: "Дата обязательна для кассового журнала.",
        variant: "warning"
      });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      addToast({
        title: "Укажите сумму",
        description: "Сумма операции должна быть больше нуля.",
        variant: "warning"
      });
      return;
    }

    addFinancialOperation({
      type: operationForm.type,
      category,
      amount,
      date: operationForm.date,
      paymentMethod: operationForm.paymentMethod,
      source: "manual",
      comment
    });
    setOperationDialogOpen(false);
    addToast({
      title: operationForm.type === "income" ? "Доход добавлен" : "Расход добавлен",
      description: "Операция появилась в финансовом журнале.",
      variant: "success"
    });
  }

  return (
    <div>
      <PageHeader
        title="Финансы"
        description="Кассовый журнал: продажи, возвраты, ручные доходы, расходы, способы оплаты и оценка прибыли."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => openOperationDialog("income")}>
              Добавить доход
            </Button>
            <Button type="button" onClick={() => openOperationDialog("expense")}>
              Добавить расход
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Движение денег"
          value={formatCurrency(cashMovement, company.currency)}
          hint="доходы минус расходы"
          icon="BriefcaseBusiness"
          tone={cashMovement >= 0 ? "success" : "danger"}
        />
        <MetricCard
          title="Чистая выручка продаж"
          value={formatCurrency(netSalesRevenue, company.currency)}
          hint={refundAmount ? `возвраты ${formatCurrency(refundAmount, company.currency)}` : "возвратов нет"}
          icon="CreditCard"
          tone="success"
        />
        <MetricCard
          title="Себестоимость товаров"
          value={formatCurrency(costOfGoods, company.currency)}
          hint="по закупочной цене карточек"
          icon="Boxes"
          tone={costOfGoods ? "warning" : "default"}
        />
        <MetricCard
          title="Оценка прибыли"
          value={formatCurrency(estimatedProfit, company.currency)}
          hint="чистая выручка минус себестоимость и расходы"
          icon="ChartNoAxesCombined"
          tone={estimatedProfit >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SummaryCard title="По способам оплаты" rows={paymentRows} currency={company.currency} empty="Движений по оплатам нет" />
        <SummaryCard title="Операционные расходы" rows={expenseRows} currency={company.currency} empty="Расходов пока нет" />
      </div>

      <div className="mt-6">
        <SearchAndFilters
          search={search}
          onSearchChange={setSearch}
          filters={[
            {
              label: "Тип",
              value: typeFilter,
              onChange: (value) => setTypeFilter(value as FinancialOperation["type"] | "all"),
              options: typeOptions
            },
            {
              label: "Источник",
              value: sourceFilter,
              onChange: (value) => setSourceFilter(value as FinancialOperationSource | "all"),
              options: sourceOptions
            },
            {
              label: "Оплата",
              value: paymentFilter,
              onChange: (value) => setPaymentFilter(value as SalePaymentMethod | "all"),
              options: paymentOptions
            }
          ]}
        />
        <DataTable
          rows={filteredOperations}
          columns={columns}
          empty={
            <EmptyState
              icon="BriefcaseBusiness"
              title="Финансовых операций пока нет"
              description="Продажа создаст доход автоматически. Ручные расходы и доходы можно добавить с этой страницы."
              actionLabel="Добавить расход"
              onAction={() => openOperationDialog("expense")}
            />
          }
        />
      </div>

      <Dialog
        open={operationDialogOpen}
        onOpenChange={setOperationDialogOpen}
        title={operationForm.type === "income" ? "Добавить доход" : "Добавить расход"}
        description="Ручная операция попадёт в кассовый журнал и отчёты."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOperationDialogOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={saveOperation}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="finance-operation-type">Тип операции</Label>
            <Select
              id="finance-operation-type"
              value={operationForm.type}
              onChange={(event) =>
                setOperationForm({
                  ...operationForm,
                  type: event.target.value as FinancialOperation["type"]
                })
              }
            >
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="finance-operation-date">Дата</Label>
            <Input
              id="finance-operation-date"
              type="date"
              value={operationForm.date}
              onChange={(event) => setOperationForm({ ...operationForm, date: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finance-operation-category">Категория</Label>
            <Input
              id="finance-operation-category"
              value={operationForm.category}
              onChange={(event) => setOperationForm({ ...operationForm, category: event.target.value })}
              placeholder={operationForm.type === "income" ? "Дополнительный доход" : "Аренда, закупка, маркетинг"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finance-operation-amount">Сумма</Label>
            <Input
              id="finance-operation-amount"
              type="number"
              min="1"
              value={operationForm.amount}
              onChange={(event) => setOperationForm({ ...operationForm, amount: event.target.value })}
              placeholder="0"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="finance-operation-payment">Способ оплаты</Label>
            <Select
              id="finance-operation-payment"
              value={operationForm.paymentMethod}
              onChange={(event) =>
                setOperationForm({
                  ...operationForm,
                  paymentMethod: event.target.value as SalePaymentMethod
                })
              }
            >
              <option value="cash">Наличные</option>
              <option value="card">Карта</option>
              <option value="transfer">Перевод</option>
              <option value="online">Онлайн</option>
              <option value="mixed">Смешанная</option>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="finance-operation-comment">Комментарий</Label>
            <Textarea
              id="finance-operation-comment"
              value={operationForm.comment}
              onChange={(event) => setOperationForm({ ...operationForm, comment: event.target.value })}
              placeholder="Короткое пояснение"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function getOperationSource(operation: FinancialOperation, sale?: Sale): FinancialOperationSource {
  if (operation.source) {
    return operation.source;
  }
  if (sale) {
    return "sale";
  }
  if (operation.category.toLowerCase().includes("возврат")) {
    return "refund";
  }
  return "manual";
}

function getSaleCostOfGoods(sale: Sale, productById: Map<string, Product>) {
  if (sale.status === "cancelled" || !sale.productId) {
    return 0;
  }
  const product = productById.get(sale.productId);
  if (!product) {
    return 0;
  }
  const soldQuantity = Math.max(0, sale.quantity - (sale.refundedQuantity ?? 0));
  return soldQuantity * product.purchasePrice;
}

function buildPaymentRows(operations: FinancialOperation[]) {
  const rows = new Map<string, { id: string; label: string; amount: number; count: number }>();
  operations.forEach((operation) => {
    const key = operation.paymentMethod ?? "unknown";
    const label = operation.paymentMethod ? paymentMethodLabels[operation.paymentMethod] : "Не указано";
    const current = rows.get(key) ?? { id: key, label, amount: 0, count: 0 };
    current.amount += operation.type === "income" ? operation.amount : -operation.amount;
    current.count += 1;
    rows.set(key, current);
  });
  return Array.from(rows.values()).sort((first, second) => Math.abs(second.amount) - Math.abs(first.amount));
}

function buildCategoryRows(operations: FinancialOperation[]) {
  const rows = new Map<string, { id: string; label: string; amount: number; count: number }>();
  operations.forEach((operation) => {
    const key = operation.category || "Без категории";
    const current = rows.get(key) ?? { id: key, label: key, amount: 0, count: 0 };
    current.amount += operation.amount;
    current.count += 1;
    rows.set(key, current);
  });
  return Array.from(rows.values()).sort((first, second) => second.amount - first.amount).slice(0, 6);
}

function SummaryCard({
  title,
  rows,
  currency,
  empty
}: {
  title: string;
  rows: { id: string; label: string; amount: number; count: number }[];
  currency: string;
  empty: string;
}) {
  const total = rows.reduce((sum, row) => sum + Math.abs(row.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length ? (
          rows.map((row) => {
            const percent = total ? Math.min(100, Math.round((Math.abs(row.amount) / total) * 100)) : 0;
            return (
              <div key={row.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(row.amount, currency)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.count} {plural(row.count, ["операция", "операции", "операций"])}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatSignedCurrency(operation: FinancialOperation, currency: string) {
  const sign = operation.type === "income" ? "+" : "-";
  return `${sign}${formatCurrency(operation.amount, currency)}`;
}

function plural(value: number, forms: [string, string, string]) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
