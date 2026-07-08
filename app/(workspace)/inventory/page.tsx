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
import { formatCurrency, getLocalDateKey } from "@/lib/utils";
import type { InventoryMovement, Product, ProductStatus } from "@/types";

const tabs = [
  { value: "products", label: "Товары" },
  { value: "materials", label: "Расходники" },
  { value: "movements", label: "Движения" },
  { value: "categories", label: "Категории" },
  { value: "suppliers", label: "Поставщики" }
];

const writeOffReasons = [
  "Использовано в работе",
  "Брак",
  "Порча",
  "Инвентаризация",
  "Потеря",
  "Другое"
];

const transferLocations = [
  "Основной склад",
  "Витрина",
  "Рабочая зона",
  "Кабинет / пост",
  "Сервисная зона",
  "Резерв"
];

const movementDescriptions: Record<InventoryMovement["type"], string> = {
  income: "Увеличивает общий остаток и может обновить поставщика или закупочную цену.",
  writeOff: "Уменьшает общий остаток. Нельзя списать больше, чем есть на остатке.",
  adjustment: "Фиксирует фактический остаток после инвентаризации.",
  transfer: "Переносит позицию между местами хранения. Общий остаток не меняется."
};

type MovementForm = {
  productId: string;
  quantity: string;
  comment: string;
  reason: string;
  sourceLocation: string;
  destinationLocation: string;
  supplier: string;
  unitCost: string;
};

export default function InventoryPage() {
  const data = useAppStore((state) => state.data);
  const updateProduct = useAppStore((state) => state.updateProduct);
  const addInventoryMovement = useAppStore((state) => state.addInventoryMovement);
  const addToast = useAppStore((state) => state.addToast);
  const [tab, setTab] = useState("products");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState<InventoryMovement["type"]>("income");
  const [movementForm, setMovementForm] = useState<MovementForm>(() => createEmptyMovementForm(data.products[0]?.id ?? ""));
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
  const suppliers = Array.from(new Set(data.products.map((product) => product.supplier).filter(Boolean)));
  const selectedMovementProduct = data.products.find((product) => product.id === movementForm.productId);

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
    const name = productForm.name.trim();
    const currentStock = Number(productForm.currentStock);
    const minStock = Number(productForm.minStock);
    const purchasePrice = Number(productForm.purchasePrice);
    const salePrice = Number(productForm.salePrice);

    if (!name) {
      addToast({
        title: "Укажите название позиции",
        description: "Название обязательно для учета товаров и расходников.",
        variant: "warning"
      });
      return;
    }

    if (![currentStock, minStock, purchasePrice, salePrice].every((value) => Number.isFinite(value) && value >= 0)) {
      addToast({
        title: "Проверьте числовые поля",
        description: "Остатки и цены не могут быть пустыми или отрицательными.",
        variant: "warning"
      });
      return;
    }

    updateProduct(selectedProduct.id, {
      name,
      type: productForm.type,
      category: productForm.category.trim(),
      currentStock,
      minStock,
      purchasePrice,
      salePrice,
      supplier: productForm.supplier.trim(),
      status: getProductStatus(currentStock, minStock)
    });
    setSelectedProduct(null);
  }

  function getDefaultMovementProductId() {
    const tabProducts =
      tab === "materials"
        ? data.products.filter((product) => product.type === "material")
        : tab === "products"
          ? data.products.filter((product) => product.type !== "material")
          : data.products;
    return tabProducts[0]?.id ?? data.products[0]?.id ?? "";
  }

  function openMovement(type: InventoryMovement["type"]) {
    const productId = getDefaultMovementProductId();
    if (!productId) {
      addToast({
        title: "Нет позиций для движения",
        description: "Сначала добавьте товар, расходник или запчасть.",
        variant: "warning"
      });
      return;
    }

    setMovementType(type);
    setMovementForm(createEmptyMovementForm(productId));
    setMovementOpen(true);
  }

  function saveMovement() {
    const product = data.products.find((item) => item.id === movementForm.productId);
    if (!product) {
      addToast({
        title: "Выберите позицию",
        description: "Движение должно относиться к конкретному товару, расходнику или запчасти.",
        variant: "warning"
      });
      return;
    }
    const quantity = Number(movementForm.quantity);
    const unitCost = Number(movementForm.unitCost);
    const isAdjustment = movementType === "adjustment";
    if (!Number.isFinite(quantity) || (isAdjustment ? quantity < 0 : quantity <= 0)) {
      addToast({
        title: isAdjustment ? "Укажите новый остаток" : "Укажите количество",
        description: isAdjustment ? "Новый остаток не может быть пустым или отрицательным." : "Количество должно быть больше нуля.",
        variant: "warning"
      });
      return;
    }

    if (movementType === "income" && movementForm.unitCost.trim() && (!Number.isFinite(unitCost) || unitCost < 0)) {
      addToast({
        title: "Проверьте закупочную цену",
        description: "Цена поступления не может быть отрицательной.",
        variant: "warning"
      });
      return;
    }

    if ((movementType === "writeOff" || movementType === "transfer") && quantity > product.currentStock) {
      addToast({
        title: movementType === "writeOff" ? "Нельзя списать больше остатка" : "Нельзя переместить больше остатка",
        description: `Сейчас по позиции "${product.name}" доступно ${product.currentStock} шт.`,
        variant: "warning"
      });
      return;
    }

    if (movementType === "adjustment" && quantity === product.currentStock) {
      addToast({
        title: "Остаток не изменился",
        description: "Для корректировки укажите фактический остаток, отличающийся от текущего.",
        variant: "warning"
      });
      return;
    }

    if (
      movementType === "transfer" &&
      movementForm.sourceLocation === movementForm.destinationLocation
    ) {
      addToast({
        title: "Выберите разные места",
        description: "Для перемещения нужны разные точки: откуда и куда.",
        variant: "warning"
      });
      return;
    }

    const nextStock =
      movementType === "income"
        ? product.currentStock + quantity
        : movementType === "writeOff"
          ? Math.max(0, product.currentStock - quantity)
          : movementType === "adjustment"
            ? quantity
            : product.currentStock;

    const comment = buildMovementComment(movementType, movementForm, product, quantity);

    addInventoryMovement({
      productId: product.id,
      type: movementType,
      quantity,
      date: getLocalDateKey(),
      comment
    });

    const productPatch: Partial<Product> = {
      currentStock: nextStock,
      status: getProductStatus(nextStock, product.minStock)
    };

    if (movementType === "income") {
      const supplier = movementForm.supplier.trim();
      if (supplier) {
        productPatch.supplier = supplier;
      }
      if (movementForm.unitCost.trim()) {
        productPatch.purchasePrice = unitCost;
      }
    }

    updateProduct(product.id, {
      ...productPatch
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
          {data.inventoryMovements.map((movement) => {
            const product = data.products.find((item) => item.id === movement.productId);
            return (
              <div key={movement.id} className="rounded-lg border border-border bg-card p-4">
                <p className="font-medium">{movement.comment}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {movementLabel(movement.type)} · {product?.name ?? "позиция удалена"} · {movementQuantityText(movement)} · {movement.date}
                </p>
              </div>
            );
          })}
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
              <Input type="number" min="0" value={productForm.currentStock} onChange={(event) => setProductForm({ ...productForm, currentStock: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Мин. остаток</Label>
              <Input type="number" min="0" value={productForm.minStock} onChange={(event) => setProductForm({ ...productForm, minStock: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Закупка</Label>
              <Input type="number" min="0" value={productForm.purchasePrice} onChange={(event) => setProductForm({ ...productForm, purchasePrice: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Продажа</Label>
              <Input type="number" min="0" value={productForm.salePrice} onChange={(event) => setProductForm({ ...productForm, salePrice: event.target.value })} />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        title={movementLabel(movementType)}
        description={movementDescriptions[movementType]}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setMovementOpen(false)}>Отмена</Button>
            <Button type="button" onClick={saveMovement}>Провести</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="movement-product">Позиция</Label>
            <Select id="movement-product" value={movementForm.productId} onChange={(event) => setMovementForm({ ...movementForm, productId: event.target.value })}>
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · остаток {product.currentStock} шт.
                </option>
              ))}
            </Select>
            {selectedMovementProduct ? (
              <p className="text-xs text-muted-foreground">
                Сейчас: {selectedMovementProduct.currentStock} шт. · минимум {selectedMovementProduct.minStock} шт.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="movement-quantity">{movementType === "adjustment" ? "Фактический остаток" : "Количество"}</Label>
            <Input
              id="movement-quantity"
              type="number"
              min={movementType === "adjustment" ? "0" : "1"}
              step="1"
              value={movementForm.quantity}
              onChange={(event) => setMovementForm({ ...movementForm, quantity: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {movementType === "adjustment"
                ? "Введите количество, которое реально осталось после пересчета."
                : "Введите количество единиц для операции."}
            </p>
          </div>
          {movementType === "income" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="movement-supplier">Поставщик</Label>
                <Input
                  id="movement-supplier"
                  list="movement-suppliers"
                  value={movementForm.supplier}
                  onChange={(event) => setMovementForm({ ...movementForm, supplier: event.target.value })}
                  placeholder={selectedMovementProduct?.supplier || "Например: Поставщик"}
                />
                <datalist id="movement-suppliers">
                  {suppliers.map((supplier) => (
                    <option key={supplier} value={supplier} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement-unit-cost">Цена закупки за ед.</Label>
                <Input
                  id="movement-unit-cost"
                  type="number"
                  min="0"
                  value={movementForm.unitCost}
                  onChange={(event) => setMovementForm({ ...movementForm, unitCost: event.target.value })}
                />
              </div>
            </div>
          ) : null}
          {movementType === "writeOff" ? (
            <div className="space-y-2">
              <Label htmlFor="movement-reason">Причина списания</Label>
              <Select id="movement-reason" value={movementForm.reason} onChange={(event) => setMovementForm({ ...movementForm, reason: event.target.value })}>
                {writeOffReasons.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </Select>
            </div>
          ) : null}
          {movementType === "transfer" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="movement-source">Откуда</Label>
                <Select id="movement-source" value={movementForm.sourceLocation} onChange={(event) => setMovementForm({ ...movementForm, sourceLocation: event.target.value })}>
                  {transferLocations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement-destination">Куда</Label>
                <Select id="movement-destination" value={movementForm.destinationLocation} onChange={(event) => setMovementForm({ ...movementForm, destinationLocation: event.target.value })}>
                  {transferLocations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="movement-comment">{movementType === "writeOff" ? "Детали списания" : "Комментарий"}</Label>
            <Textarea
              id="movement-comment"
              value={movementForm.comment}
              onChange={(event) => setMovementForm({ ...movementForm, comment: event.target.value })}
              placeholder={
                movementType === "transfer"
                  ? "Например: перенесли к рабочему месту мастера"
                  : movementType === "adjustment"
                    ? "Например: результат инвентаризации"
                    : "Короткое пояснение для журнала"
              }
            />
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

function createEmptyMovementForm(productId: string): MovementForm {
  return {
    productId,
    quantity: "1",
    comment: "",
    reason: writeOffReasons[0],
    sourceLocation: transferLocations[0],
    destinationLocation: transferLocations[1],
    supplier: "",
    unitCost: ""
  };
}

function buildMovementComment(
  type: InventoryMovement["type"],
  form: MovementForm,
  product: Product,
  quantity: number
) {
  const comment = form.comment.trim();
  if (type === "income") {
    const details = [
      `Поступление: ${product.name}`,
      `${quantity} шт.`,
      form.supplier.trim() ? `поставщик: ${form.supplier.trim()}` : "",
      form.unitCost.trim() ? `закупка: ${formatCurrency(Number(form.unitCost))} за ед.` : "",
      comment
    ].filter(Boolean);
    return details.join(" · ");
  }

  if (type === "writeOff") {
    const details = [
      `Списание: ${product.name}`,
      `${quantity} шт.`,
      `причина: ${form.reason}`,
      comment
    ].filter(Boolean);
    return details.join(" · ");
  }

  if (type === "adjustment") {
    const details = [
      `Корректировка: ${product.name}`,
      `было ${product.currentStock} шт.`,
      `стало ${quantity} шт.`,
      comment
    ].filter(Boolean);
    return details.join(" · ");
  }

  const details = [
    `Перемещение: ${product.name}`,
    `${quantity} шт.`,
    `${form.sourceLocation} -> ${form.destinationLocation}`,
    comment
  ].filter(Boolean);
  return details.join(" · ");
}

function movementQuantityText(movement: InventoryMovement) {
  return movement.type === "adjustment"
    ? `новый остаток ${movement.quantity} шт.`
    : `${movement.quantity} шт.`;
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
