"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type DataTableColumn } from "@/components/modules/data-table";
import { EmptyState } from "@/components/modules/empty-state";
import { MetricCard } from "@/components/modules/metric-card";
import { PageHeader } from "@/components/modules/page-header";
import { SearchAndFilters } from "@/components/modules/search-and-filters";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale, SaleStatus } from "@/types";

const statusOptions: { value: SaleStatus | "all"; label: string }[] = [
  { value: "all", label: "Все статусы" },
  { value: "completed", label: "Завершённые" },
  { value: "partiallyRefunded", label: "Частичные возвраты" },
  { value: "refunded", label: "Возвраты" },
  { value: "cancelled", label: "Отменённые" }
];

const paymentMethodLabels: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  online: "Онлайн",
  mixed: "Смешанная"
};

const paymentStatusLabels: Record<string, string> = {
  paid: "оплачено",
  partial: "частично",
  unpaid: "не оплачено",
  refunded: "возврат"
};

export default function SalesPage() {
  const data = useAppStore((state) => state.data);
  const openQuickCreate = useAppStore((state) => state.openQuickCreate);
  const refundSale = useAppStore((state) => state.refundSale);
  const addToast = useAppStore((state) => state.addToast);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SaleStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [refundTarget, setRefundTarget] = useState<Sale | null>(null);
  const [refundForm, setRefundForm] = useState({
    amount: "",
    quantity: "",
    reason: ""
  });

  const sales = data.sales ?? [];
  const clientById = useMemo(
    () => new Map(data.clients.map((client) => [client.id, client])),
    [data.clients]
  );
  const employeeById = useMemo(
    () => new Map(data.employees.map((employee) => [employee.id, employee])),
    [data.employees]
  );
  const productById = useMemo(
    () => new Map(data.products.map((product) => [product.id, product])),
    [data.products]
  );
  const promotionById = useMemo(
    () => new Map(data.promotions.map((promotion) => [promotion.id, promotion])),
    [data.promotions]
  );
  const categories = useMemo(
    () => Array.from(new Set(sales.map((sale) => sale.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ru")),
    [sales]
  );
  const categoryOptions = [
    { value: "all", label: "Все категории" },
    ...categories.map((item) => ({ value: item, label: item }))
  ];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredSales = useMemo(
    () =>
      sales
        .filter((sale) => status === "all" || sale.status === status)
        .filter((sale) => category === "all" || sale.category === category)
        .filter((sale) => {
          if (!normalizedSearch) {
            return true;
          }
          const client = sale.clientId ? clientById.get(sale.clientId) : undefined;
          const employee = sale.employeeId ? employeeById.get(sale.employeeId) : undefined;
          return [
            sale.productName,
            sale.category,
            sale.comment,
            sale.date,
            client?.name,
            client?.phone,
            employee?.name
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);
        })
        .sort((first, second) => second.date.localeCompare(first.date)),
    [category, clientById, employeeById, normalizedSearch, sales, status]
  );
  const paidSales = sales.filter((sale) => sale.status === "completed" || sale.status === "partiallyRefunded");
  const totalRevenue = paidSales.reduce((sum, sale) => sum + getSaleNetAmount(sale), 0);
  const refundAmount = sales.reduce((sum, sale) => sum + (sale.refundedAmount ?? 0), 0);
  const averageCheck = paidSales.length ? Math.round(totalRevenue / paidSales.length) : 0;
  const unitsSold = paidSales.reduce((sum, sale) => sum + Math.max(0, sale.quantity - (sale.refundedQuantity ?? 0)), 0);

  const columns: DataTableColumn<Sale>[] = [
    {
      key: "date",
      header: "Дата",
      cell: (sale) => formatDate(sale.date, "dd.MM.yyyy")
    },
    {
      key: "sale",
      header: "Продажа",
      cell: (sale) => (
        <button
          type="button"
          className="max-w-xs text-left font-medium text-primary hover:underline"
          onClick={() => setSelectedSale(sale)}
        >
          {sale.productName || sale.category}
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {sale.category}
          </span>
        </button>
      )
    },
    {
      key: "client",
      header: "Клиент",
      cell: (sale) => sale.clientId ? clientById.get(sale.clientId)?.name ?? "Клиент удалён" : "Без клиента"
    },
    {
      key: "employee",
      header: "Сотрудник",
      cell: (sale) => sale.employeeId ? employeeById.get(sale.employeeId)?.name ?? "Сотрудник удалён" : "Не указан"
    },
    {
      key: "quantity",
      header: "Кол-во",
      cell: (sale) => sale.quantity ? `${formatQuantity(Math.max(0, sale.quantity - (sale.refundedQuantity ?? 0)))} шт.` : "ручная"
    },
    {
      key: "payment",
      header: "Оплата",
      cell: (sale) => (
        <div>
          <p>{paymentMethodLabels[sale.paymentMethod] ?? "Наличные"}</p>
          <p className="text-xs text-muted-foreground">{paymentStatusLabels[sale.paymentStatus] ?? "оплачено"}</p>
        </div>
      )
    },
    {
      key: "amount",
      header: "Сумма",
      cell: (sale) => (
        <div className="text-right">
          <p>{formatCurrency(getSaleNetAmount(sale))}</p>
          {(sale.refundedAmount ?? 0) > 0 ? (
            <p className="text-xs text-muted-foreground">возврат {formatCurrency(sale.refundedAmount ?? 0)}</p>
          ) : null}
        </div>
      ),
      className: "text-right"
    },
    {
      key: "status",
      header: "Статус",
      cell: (sale) => <StatusBadge status={sale.status} />
    },
    {
      key: "action",
      header: "",
      cell: (sale) => (
        <Button type="button" size="sm" variant="outline" onClick={() => setSelectedSale(sale)}>
          Открыть
        </Button>
      ),
      className: "text-right"
    }
  ];

  function openRefundDialog(sale: Sale) {
    const remainingAmount = Math.max(0, sale.amount - (sale.refundedAmount ?? 0));
    const remainingQuantity = Math.max(0, sale.quantity - (sale.refundedQuantity ?? 0));
    setRefundTarget(sale);
    setRefundForm({
      amount: String(remainingAmount),
      quantity: sale.productId ? String(remainingQuantity) : "0",
      reason: "Возврат клиенту"
    });
  }

  function saveRefund() {
    if (!refundTarget) {
      return;
    }

    const amount = Number(refundForm.amount);
    const quantity = Number(refundForm.quantity);

    refundSale(refundTarget.id, {
      amount,
      quantity: refundTarget.productId ? quantity : 0,
      reason: refundForm.reason
    });
    setRefundTarget(null);
    setSelectedSale(null);
    addToast({
      title: "Возврат проведён",
      description: "Создан расход на возврат, а товар возвращён на склад, если он был связан с продажей.",
      variant: "success"
    });
  }

  return (
    <div>
      <PageHeader
        title="Продажи"
        description="Журнал продаж: клиент, товар, сотрудник, сумма, списание остатков и возвраты."
        actions={
          <Button type="button" onClick={() => openQuickCreate("sale")}>
            Добавить продажу
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Выручка"
          value={formatCurrency(totalRevenue)}
          hint={`${paidSales.length} ${plural(paidSales.length, ["продажа", "продажи", "продаж"])}`}
          icon="ChartNoAxesCombined"
          tone="success"
        />
        <MetricCard
          title="Средний чек"
          value={formatCurrency(averageCheck)}
          hint={averageCheck ? "по завершённым продажам" : "нет продаж"}
          icon="CreditCard"
        />
        <MetricCard
          title="Товаров списано"
          value={formatQuantity(unitsSold)}
          hint="по продажам с выбранным товаром"
          icon="Boxes"
        />
        <MetricCard
          title="Возвраты"
          value={formatCurrency(refundAmount)}
          hint={`${sales.filter((sale) => (sale.refundedAmount ?? 0) > 0).length} ${plural(sales.filter((sale) => (sale.refundedAmount ?? 0) > 0).length, ["операция", "операции", "операций"])}`}
          icon="BadgePercent"
          tone={refundAmount ? "warning" : "default"}
        />
      </div>

      <div className="mt-6">
        <SearchAndFilters
          search={search}
          onSearchChange={setSearch}
          filters={[
            {
              label: "Статус",
              value: status,
              onChange: (value) => setStatus(value as SaleStatus | "all"),
              options: statusOptions
            },
            {
              label: "Категория",
              value: category,
              onChange: setCategory,
              options: categoryOptions
            }
          ]}
        />
        <DataTable
          rows={filteredSales}
          columns={columns}
          empty={
            <EmptyState
              title="Продаж пока нет"
              description="Добавьте продажу через эту страницу или кнопку «Создать», чтобы она попала в журнал, финансы и остатки."
              actionLabel="Добавить продажу"
              onAction={() => openQuickCreate("sale")}
            />
          }
        />
      </div>

      <Dialog
        open={Boolean(selectedSale)}
        onOpenChange={(open) => !open && setSelectedSale(null)}
        title={selectedSale ? selectedSale.productName || "Продажа" : "Продажа"}
        description={selectedSale ? `${formatDate(selectedSale.date, "dd.MM.yyyy")} · ${formatCurrency(selectedSale.amount)}` : undefined}
        className="max-w-2xl"
        footer={
          selectedSale ? (
            <>
              <Button type="button" variant="outline" onClick={() => setSelectedSale(null)}>
                Закрыть
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!canRefundSale(selectedSale)}
                onClick={() => openRefundDialog(selectedSale)}
              >
                Возврат
              </Button>
            </>
          ) : null
        }
      >
        {selectedSale ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedSale.status} />
              <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {selectedSale.category}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Клиент" value={selectedSale.clientId ? clientById.get(selectedSale.clientId)?.name ?? "Клиент удалён" : "Без клиента"} />
              <DetailRow label="Сотрудник" value={selectedSale.employeeId ? employeeById.get(selectedSale.employeeId)?.name ?? "Не указан" : "Не указан"} />
              <DetailRow label="Товар" value={selectedSale.productId ? productById.get(selectedSale.productId)?.name ?? selectedSale.productName : "Ручная продажа"} />
              <DetailRow label="Количество" value={selectedSale.quantity ? `${formatQuantity(Math.max(0, selectedSale.quantity - (selectedSale.refundedQuantity ?? 0)))} из ${formatQuantity(selectedSale.quantity)} шт.` : "не списывалось"} />
              <DetailRow label="Цена за ед." value={selectedSale.quantity ? formatCurrency(selectedSale.unitPrice) : "не указана"} />
              <DetailRow label="Оплата" value={`${paymentMethodLabels[selectedSale.paymentMethod] ?? "Наличные"} · ${paymentStatusLabels[selectedSale.paymentStatus] ?? "оплачено"}`} />
              <DetailRow label="Скидка" value={selectedSale.discountAmount || selectedSale.discountPercent ? `${selectedSale.discountPercent}% · ${formatCurrency(selectedSale.discountAmount)}` : "без скидки"} />
              <DetailRow label="Акция" value={selectedSale.promotionId ? promotionById.get(selectedSale.promotionId)?.name ?? "Акция удалена" : "без акции"} />
              <DetailRow label="Сумма" value={`${formatCurrency(getSaleNetAmount(selectedSale))} из ${formatCurrency(selectedSale.amount)}`} />
              <DetailRow label="Возвращено" value={(selectedSale.refundedAmount ?? 0) > 0 ? `${formatCurrency(selectedSale.refundedAmount ?? 0)}${selectedSale.productId ? ` · ${formatQuantity(selectedSale.refundedQuantity ?? 0)} шт.` : ""}` : "возвратов нет"} />
            </div>
            <DetailRow label="Комментарий" value={selectedSale.comment || "Комментарий не указан"} wide />
            {selectedSale.status !== "completed" ? (
              <DetailRow
                label="Причина отмены"
                value={[
                  selectedSale.cancelReason,
                  selectedSale.cancelledAt ? `дата: ${formatDate(selectedSale.cancelledAt, "dd.MM.yyyy")}` : ""
                ].filter(Boolean).join(" · ") || "Не указана"}
                wide
              />
            ) : null}
            {canRefundSale(selectedSale) ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Возврат создаст расход на выбранную сумму. Если продажа связана с товаром, выбранное количество вернётся на склад.
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(refundTarget)}
        onOpenChange={(open) => !open && setRefundTarget(null)}
        title="Возврат продажи"
        description={refundTarget ? refundTarget.productName : undefined}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setRefundTarget(null)}>
              Отмена
            </Button>
            <Button type="button" variant="destructive" onClick={saveRefund}>
              Провести возврат
            </Button>
          </>
        }
      >
        {refundTarget ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Доступно к возврату: {formatCurrency(Math.max(0, refundTarget.amount - (refundTarget.refundedAmount ?? 0)))}
              {refundTarget.productId ? ` · ${formatQuantity(Math.max(0, refundTarget.quantity - (refundTarget.refundedQuantity ?? 0)))} шт.` : ""}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sale-refund-amount">Сумма возврата</Label>
                <Input
                  id="sale-refund-amount"
                  type="number"
                  min="1"
                  value={refundForm.amount}
                  onChange={(event) => setRefundForm({ ...refundForm, amount: event.target.value })}
                />
              </div>
              {refundTarget.productId ? (
                <div className="space-y-2">
                  <Label htmlFor="sale-refund-quantity">Количество к возврату</Label>
                  <Input
                    id="sale-refund-quantity"
                    type="number"
                    min="1"
                    value={refundForm.quantity}
                    onChange={(event) => setRefundForm({ ...refundForm, quantity: event.target.value })}
                  />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-refund-reason">Причина</Label>
              <Textarea
                id="sale-refund-reason"
                value={refundForm.reason}
                onChange={(event) => setRefundForm({ ...refundForm, reason: event.target.value })}
              />
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "rounded-lg border border-border p-3 sm:col-span-2" : "rounded-lg border border-border p-3"}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2
  }).format(value);
}

function getSaleNetAmount(sale: Sale) {
  return Math.max(0, sale.amount - (sale.refundedAmount ?? 0));
}

function canRefundSale(sale: Sale) {
  return (
    sale.status !== "cancelled" &&
    sale.status !== "refunded" &&
    getSaleNetAmount(sale) > 0
  );
}

function plural(value: number, forms: [string, string, string]) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
