"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormDrawer } from "@/components/modules/form-drawer";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatCurrency, formatDate, getLocalDateKey } from "@/lib/utils";
import type { Promotion, PromotionStatus } from "@/types";

const statusOptions: { value: PromotionStatus; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "scheduled", label: "Запланирована" },
  { value: "active", label: "Активна" },
  { value: "paused", label: "Пауза" },
  { value: "ending", label: "Скоро завершится" },
  { value: "finished", label: "Завершена" }
];

function buildPeriod(startDate: string, endDate: string, fallback = "") {
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `с ${formatDate(startDate)}`;
  }
  if (endDate) {
    return `до ${formatDate(endDate)}`;
  }
  return fallback || "период не указан";
}

function createEmptyPromotionForm() {
  return {
    name: "",
    description: "",
    discount: "10",
    audience: "",
    promocode: "",
    startDate: "",
    endDate: "",
    status: "draft" as PromotionStatus,
    periodText: ""
  };
}

function promotionToForm(promotion: Promotion) {
  return {
    name: promotion.name,
    description: promotion.description,
    discount: "",
    audience: "",
    promocode: "",
    startDate: promotion.startDate ?? "",
    endDate: promotion.endDate ?? "",
    status: promotion.status,
    periodText: promotion.period,
    conditions: promotion.conditions
  };
}

export default function PromotionsPage() {
  const promotions = useAppStore((state) => state.data.promotions);
  const addPromotion = useAppStore((state) => state.addPromotion);
  const updatePromotion = useAppStore((state) => state.updatePromotion);
  const addToast = useAppStore((state) => state.addToast);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [form, setForm] = useState(createEmptyPromotionForm);
  const [editForm, setEditForm] = useState(() => promotionToForm({
    id: "",
    name: "",
    period: "",
    status: "draft",
    conditions: "",
    usageCount: 0,
    revenue: 0,
    newClients: 0,
    efficiency: 0,
    description: ""
  }));
  const today = getLocalDateKey();

  function validatePromotion({
    name,
    startDate,
    endDate
  }: {
    name: string;
    startDate: string;
    endDate: string;
  }) {
    if (!name.trim()) {
      addToast({
        title: "Укажите название акции",
        description: "Название нужно для списка акций, отчётов и поиска.",
        variant: "warning"
      });
      return false;
    }

    if (startDate && startDate < today) {
      addToast({
        title: "Дата начала уже прошла",
        description: "Акцию можно запланировать только на сегодня или будущую дату.",
        variant: "warning"
      });
      return false;
    }

    if (endDate && endDate < today) {
      addToast({
        title: "Дата окончания уже прошла",
        description: "Выберите сегодняшнюю или будущую дату окончания.",
        variant: "warning"
      });
      return false;
    }

    if (startDate && endDate && endDate < startDate) {
      addToast({
        title: "Период акции некорректный",
        description: "Дата окончания не может быть раньше даты начала.",
        variant: "warning"
      });
      return false;
    }

    return true;
  }

  function openPromotion(promotion: Promotion) {
    setSelected(promotion);
    setEditForm(promotionToForm(promotion));
  }

  function save() {
    if (!validatePromotion(form)) {
      return;
    }

    addPromotion({
      name: form.name.trim(),
      period: buildPeriod(form.startDate, form.endDate),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
      conditions: [
        `${form.discount || "0"}% для аудитории: ${form.audience.trim() || "все клиенты"}`,
        form.promocode.trim() ? `промокод ${form.promocode.trim()}` : null
      ].filter(Boolean).join(", "),
      description: form.description.trim()
    });
    setForm(createEmptyPromotionForm());
    setCreateOpen(false);
  }

  function saveSelected() {
    if (!selected || !validatePromotion(editForm)) {
      return;
    }

    const patch: Partial<Promotion> = {
      name: editForm.name.trim(),
      period: buildPeriod(editForm.startDate, editForm.endDate, editForm.periodText.trim()),
      startDate: editForm.startDate || undefined,
      endDate: editForm.endDate || undefined,
      status: editForm.status,
      conditions: editForm.conditions.trim(),
      description: editForm.description.trim()
    };

    updatePromotion(selected.id, patch);
    setSelected({ ...selected, ...patch });
    addToast({
      title: "Акция обновлена",
      description: "Изменения сохранены в карточке акции.",
      variant: "success"
    });
  }

  return (
    <div>
      <PageHeader
        title="Акции"
        description="Планирование промо-кампаний, условия, каналы и статистика эффективности."
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Новая акция
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((promotion) => (
          <button key={promotion.id} type="button" className="text-left" onClick={() => openPromotion(promotion)}>
            <Card className="h-full p-5 transition-colors hover:bg-muted/35">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{promotion.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{promotion.period}</p>
                </div>
                <StatusBadge status={promotion.status} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{promotion.conditions}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Использований" value={String(promotion.usageCount)} />
                <Metric label="Выручка" value={formatCurrency(promotion.revenue)} />
                <Metric label="Новые клиенты" value={String(promotion.newClients)} />
                <Metric label="Эффективность" value={`${promotion.efficiency}%`} />
              </div>
            </Card>
          </button>
        ))}
      </div>

      <FormDrawer open={createOpen} onOpenChange={setCreateOpen} title="Новая акция" description="Заполните условия и период действия акции.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Скидка, %</Label>
              <Input type="number" min="0" max="100" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PromotionStatus })}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Дата начала</Label>
              <Input
                type="date"
                min={today}
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Дата окончания</Label>
              <Input
                type="date"
                min={form.startDate || today}
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Целевая аудитория</Label>
              <Input value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Промокод</Label>
              <Input value={form.promocode} onChange={(event) => setForm({ ...form, promocode: event.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Описание и каналы продвижения</Label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <Button type="button" className="w-full" onClick={save}>Сохранить</Button>
        </div>
      </FormDrawer>

      <Drawer open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} title={selected?.name ?? "Акция"} description="Карточка и статистика кампании">
        {selected ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value as PromotionStatus })}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Дата начала</Label>
                <Input
                  type="date"
                  min={today}
                  value={editForm.startDate}
                  onChange={(event) => setEditForm({ ...editForm, startDate: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Дата окончания</Label>
                <Input
                  type="date"
                  min={editForm.startDate || today}
                  value={editForm.endDate}
                  onChange={(event) => setEditForm({ ...editForm, endDate: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Период текстом</Label>
              <Input value={editForm.periodText} onChange={(event) => setEditForm({ ...editForm, periodText: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Условия</Label>
              <Textarea value={editForm.conditions} onChange={(event) => setEditForm({ ...editForm, conditions: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />
            </div>
            <Button type="button" className="w-full" onClick={saveSelected}>Сохранить изменения</Button>

            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Период" value={selected.period} />
              <Metric label="Использований" value={String(selected.usageCount)} />
              <Metric label="Выручка" value={formatCurrency(selected.revenue)} />
              <Metric label="Новые клиенты" value={String(selected.newClients)} />
              <Metric label="Эффективность" value={`${selected.efficiency}%`} />
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
