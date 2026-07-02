"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/modules/data-table";
import { PageHeader } from "@/components/modules/page-header";
import { SearchAndFilters } from "@/components/modules/search-and-filters";
import { StatusBadge } from "@/components/modules/status-badge";
import { DashboardWidget } from "@/components/modules/dashboard-widget";
import { useAppStore } from "@/store/app-store";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

const tabs = [
  { value: "products", label: "Товары" },
  { value: "materials", label: "Расходники" },
  { value: "movements", label: "Движения" },
  { value: "categories", label: "Категории" },
  { value: "suppliers", label: "Поставщики" }
];

export default function InventoryPage() {
  const data = useAppStore((state) => state.data);
  const [tab, setTab] = useState("products");
  const [search, setSearch] = useState("");

  const products = useMemo(() => {
    return data.products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data.products, search]);

  const columns: DataTableColumn<Product>[] = [
    { key: "name", header: "Название", cell: (product) => <span className="font-medium">{product.name}</span> },
    { key: "type", header: "Тип", cell: (product) => product.type === "material" ? "расходник" : product.type === "part" ? "запчасть" : "товар" },
    { key: "category", header: "Категория", cell: (product) => product.category },
    { key: "stock", header: "Остаток", cell: (product) => `${product.currentStock} / мин. ${product.minStock}` },
    { key: "purchase", header: "Закупка", cell: (product) => formatCurrency(product.purchasePrice) },
    { key: "sale", header: "Продажа", cell: (product) => formatCurrency(product.salePrice) },
    { key: "supplier", header: "Поставщик", cell: (product) => product.supplier },
    { key: "status", header: "Статус", cell: (product) => <StatusBadge status={product.status} /> }
  ];

  const chart = products.slice(0, 8).map((product) => ({
    name: product.name.split(" ").slice(0, 2).join(" "),
    расход: Math.max(1, product.minStock + 8 - product.currentStock)
  }));

  return (
    <div>
      <PageHeader
        title="Товары, расходники и остатки"
        description="Единый раздел учёта: остатки, движения, категории, поставщики и закупочные действия."
        actions={
          <div className="flex flex-wrap gap-2">
            {["Поступление", "Списание", "Корректировка", "Перемещение", "Добавить в закупку"].map((action) => (
              <Button key={action} type="button" variant="outline">
                {action}
              </Button>
            ))}
          </div>
        }
      />
      <div className="mb-4">
        <Tabs items={tabs} value={tab} onValueChange={setTab} />
      </div>
      {tab === "products" || tab === "materials" ? (
        <>
          <SearchAndFilters search={search} onSearchChange={setSearch} />
          <DataTable
            rows={products.filter((product) => tab === "products" ? product.type !== "material" : product.type === "material")}
            columns={columns}
          />
          <div className="mt-6">
            <DashboardWidget title="График расхода">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="расход" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashboardWidget>
          </div>
        </>
      ) : null}
      {tab === "movements" ? (
        <div className="grid gap-3">
          {data.inventoryMovements.map((movement) => (
            <div key={movement.id} className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium">{movement.comment}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {movement.type} · {movement.quantity} шт. · {movement.date}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {tab === "categories" ? <SimpleList items={["Основное", "Расходники", "Премиум", "Упаковка"]} /> : null}
      {tab === "suppliers" ? <SimpleList items={["ООО Поставка", "Склад Партнер", "Локальный поставщик"]} /> : null}
    </div>
  );
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <div key={item} className="rounded-lg border border-border bg-card p-4 font-medium">
          {item}
        </div>
      ))}
    </div>
  );
}
