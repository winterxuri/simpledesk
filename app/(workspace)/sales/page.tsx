"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
  { value: "refunded", label: "Возвраты" },
  { value: "cancelled", label: "Отменённые" }
];

export default function SalesPage() {
  const data = useAppStore((state) => state.data);
  const openQuickCreate = useAppStore((state) => state.openQuickCreate);
  const cancelSale = useAppStore((state) => state.cancelSale);
  const addToast = useAppStore((state) => state.addToast);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SaleStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

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
  const completedSales = sales.filter((sale) => sale.status === "completed");
  const refundedSales = sales.filter((sale) => sale.status === "refunded");
  const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.amount, 0);
  const refundAmount = refundedSales.reduce((sum, sale) => sum + sale.amount, 0);
  const averageCheck = completedSales.length ? Math.round(totalRevenue / completedSales.length) : 0;
  const unitsSold = completedSales.reduce((sum, sale) => sum + sale.quantity, 0);

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
      cell: (sale) => sale.quantity ? `${formatQuantity(sale.quantity)} шт.` : "ручная"
    },
    {
      key: "amount",
      header: "Сумма",
      cell: (sale) => formatCurrency(sale.amount),
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

  function handleCancelSale(sale: Sale) {
    const reason = window.prompt("Причина отмены или возврата", "Возврат клиенту");
    if (reason === null) {
      return;
    }

    cancelSale(sale.id, reason);
    setSelectedSale(null);
    addToast({
      title: "Продажа возвращена",
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
          hint={`${completedSales.length} ${plural(completedSales.length, ["продажа", "продажи", "продаж"])}`}
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
          hint={`${refundedSales.length} ${plural(refundedSales.length, ["операция", "операции", "операций"])}`}
          icon="BadgePercent"
          tone={refundedSales.length ? "warning" : "default"}
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
                disabled={selectedSale.status !== "completed"}
                onClick={() => handleCancelSale(selectedSale)}
              >
                Отменить / вернуть
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
              <DetailRow label="Количество" value={selectedSale.quantity ? `${formatQuantity(selectedSale.quantity)} шт.` : "не списывалось"} />
              <DetailRow label="Цена за ед." value={selectedSale.quantity ? formatCurrency(selectedSale.unitPrice) : "не указана"} />
              <DetailRow label="Сумма" value={formatCurrency(selectedSale.amount)} />
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
            {selectedSale.status === "completed" ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Отмена создаст расход на сумму продажи. Если продажа связана с товаром, остаток будет возвращён на склад.
              </div>
            ) : null}
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

function plural(value: number, forms: [string, string, string]) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
