"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type DataTableColumn } from "@/components/modules/data-table";
import { PageHeader } from "@/components/modules/page-header";
import { SearchAndFilters } from "@/components/modules/search-and-filters";
import { StatusBadge } from "@/components/modules/status-badge";
import { DashboardWidget } from "@/components/modules/dashboard-widget";
import { useAppStore } from "@/store/app-store";
import { formatCurrency } from "@/lib/utils";
import type { InventoryMovement, Product, ProductStatus } from "@/types";

const tabs = [
  { value: "products", label: "Товары" },
  { value: "materials", label: "Расходники" },
  { value: "movements", label: "Движения" },
  { value: "categories", label: "Категории" },
  { value: "suppliers", label: "Поставщики" }
];

export default function InventoryPage() {
  const data = useAppStore((state) => state.data);
  const updateProduct = useAppStore((state) => state.updateProduct);
  const addInventoryMovement = useAppStore((state) => state.addInventoryMovement);
  const [tab, setTab] = useState("products");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState<InventoryMovement["type"]>("income");
  const [movementForm, setMovementForm] = useState({
    productId: data.products[0]?.id ?? "",
    quantity: "1",
    comment: ""
  });
  const [productForm, setProductForm] = useState({
    name: "",
    type: "product" as Product["type"],
    category: "",
    currentStock: "0",
    minStock: "1",
    purchasePrice: "0",
    salePrice: "0",
    supplier: ""
  });

  const products = useMemo(() => {
    return data.products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data.products, search]);

  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "Название",
      cell: (product) => (
        <button type="button" className="font-medium text-primary hover:underline" onClick={() => openProduct(product)}>
          {product.name}
        </button>
      )
    },
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
  const categories = Array.from(new Set(data.products.map((product) => product.category)));
  const suppliers = Array.from(new Set(data.products.map((product) => product.supplier)));

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      type: product.type,
      category: product.category,
      currentStock: String(product.currentStock),
      minStock: String(product.minStock),
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice),
      supplier: product.supplier
    });
  }

  function saveProduct() {
    if (!selectedProduct) {
      return;
    }
    const currentStock = Number(productForm.currentStock) || 0;
    const minStock = Number(productForm.minStock) || 0;
    updateProduct(selectedProduct.id, {
      name: productForm.name,
      type: productForm.type,
      category: productForm.category,
      currentStock,
      minStock,
      purchasePrice: Number(productForm.purchasePrice) || 0,
      salePrice: Number(productForm.salePrice) || 0,
      supplier: productForm.supplier,
      status: getProductStatus(currentStock, minStock)
    });
    setSelectedProduct(null);
  }

  function openMovement(type: InventoryMovement["type"]) {
    setMovementType(type);
    setMovementForm({
      productId: data.products[0]?.id ?? "",
      quantity: "1",
      comment: ""
    });
    setMovementOpen(true);
  }

  function saveMovement() {
    const product = data.products.find((item) => item.id === movementForm.productId);
    if (!product) {
      return;
    }
    const quantity = Math.max(0, Number(movementForm.quantity) || 0);
    const nextStock =
      movementType === "income"
        ? product.currentStock + quantity
        : movementType === "writeOff"
          ? Math.max(0, product.currentStock - quantity)
          : movementType === "adjustment"
            ? quantity
            : product.currentStock;

    addInventoryMovement({
      productId: product.id,
      type: movementType,
      quantity,
      date: new Date().toISOString().slice(0, 10),
      comment: movementForm.comment || movementLabel(movementType)
    });
    updateProduct(product.id, {
      currentStock: nextStock,
      status: getProductStatus(nextStock, product.minStock)
    });
    setMovementOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Товары, расходники и остатки"
        description="Единый раздел учёта: остатки, движения, категории, поставщики и закупочные действия."
        actions={
          <div className="flex flex-wrap gap-2">
            {[
              ["income", "Поступление"],
              ["writeOff", "Списание"],
              ["adjustment", "Корректировка"],
              ["transfer", "Перемещение"]
            ].map(([type, action]) => (
              <Button key={action} type="button" variant="outline" onClick={() => openMovement(type as InventoryMovement["type"])}>
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
      {tab === "categories" ? <SimpleList items={categories} /> : null}
      {tab === "suppliers" ? <SimpleList items={suppliers} /> : null}

      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        title="Карточка позиции"
        description="Измените остатки, цены, категорию и поставщика."
        className="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)}>Отмена</Button>
            <Button type="button" onClick={saveProduct}>Сохранить</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select value={productForm.type} onChange={(event) => setProductForm({ ...productForm, type: event.target.value as Product["type"] })}>
                <option value="product">Товар</option>
                <option value="material">Расходник</option>
                <option value="part">Запчасть</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Поставщик</Label>
              <Input value={productForm.supplier} onChange={(event) => setProductForm({ ...productForm, supplier: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Остаток</Label>
              <Input value={productForm.currentStock} onChange={(event) => setProductForm({ ...productForm, currentStock: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Мин. остаток</Label>
              <Input value={productForm.minStock} onChange={(event) => setProductForm({ ...productForm, minStock: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Закупка</Label>
              <Input value={productForm.purchasePrice} onChange={(event) => setProductForm({ ...productForm, purchasePrice: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Продажа</Label>
              <Input value={productForm.salePrice} onChange={(event) => setProductForm({ ...productForm, salePrice: event.target.value })} />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        title={movementLabel(movementType)}
        description="Движение будет добавлено в журнал и пересчитает остаток."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setMovementOpen(false)}>Отмена</Button>
            <Button type="button" onClick={saveMovement}>Провести</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Позиция</Label>
            <Select value={movementForm.productId} onChange={(event) => setMovementForm({ ...movementForm, productId: event.target.value })}>
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{movementType === "adjustment" ? "Новый остаток" : "Количество"}</Label>
            <Input value={movementForm.quantity} onChange={(event) => setMovementForm({ ...movementForm, quantity: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea value={movementForm.comment} onChange={(event) => setMovementForm({ ...movementForm, comment: event.target.value })} />
          </div>
        </div>
      </Dialog>
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

function getProductStatus(currentStock: number, minStock: number): ProductStatus {
  if (currentStock <= 0) {
    return "out";
  }
  if (currentStock <= minStock / 2) {
    return "critical";
  }
  if (currentStock <= minStock) {
    return "low";
  }
  return "ok";
}

function movementLabel(type: InventoryMovement["type"]) {
  if (type === "income") {
    return "Поступление";
  }
  if (type === "writeOff") {
    return "Списание";
  }
  if (type === "adjustment") {
    return "Корректировка";
  }
  return "Перемещение";
}
