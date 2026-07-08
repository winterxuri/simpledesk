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
import {
  getPromotionDisplayStatus,
  getPromotionManualMode,
  resolvePromotionStatus,
  type PromotionManualMode
} from "@/lib/promotion-status";
import { formatCurrency, formatDate, getLocalDateKey } from "@/lib/utils";
import type { Promotion } from "@/types";

const manualStatusOptions: { value: PromotionManualMode; label: string }[] = [
  { value: "auto", label: "Автоматически по датам" },
  { value: "draft", label: "Черновик" },
  { value: "paused", label: "На паузе" }
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
    manualStatus: "auto" as PromotionManualMode
  };
}

function promotionToForm(promotion: Promotion) {
  const parsed = parsePromotionConditions(promotion.conditions);
  return {
    name: promotion.name,
    description: promotion.description,
    discount: parsed.discount,
    audience: parsed.audience,
    promocode: parsed.promocode,
    startDate: promotion.startDate ?? "",
    endDate: promotion.endDate ?? "",
    manualStatus: getPromotionManualMode(promotion.status)
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
    discount,
    startDate,
    endDate
  }: {
    name: string;
    discount: string;
    startDate: string;
    endDate: string;
  }, { allowPastDates = false }: { allowPastDates?: boolean } = {}) {
    if (!name.trim()) {
      addToast({
        title: "Укажите название акции",
        description: "Название нужно для списка акций, отчётов и поиска.",
        variant: "warning"
      });
      return false;
    }

    const discountValue = Number(discount);
    if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
      addToast({
        title: "Проверьте скидку",
        description: "Скидка должна быть числом от 1 до 100%.",
        variant: "warning"
      });
      return false;
    }

    if (!startDate || !endDate) {
      addToast({
        title: "Укажите период акции",
        description: "Дата начала и дата окончания обязательны для автоматического статуса.",
        variant: "warning"
      });
      return false;
    }

    if (!allowPastDates && startDate < today) {
      addToast({
        title: "Дата начала уже прошла",
        description: "Акцию можно запланировать только на сегодня или будущую дату.",
        variant: "warning"
      });
      return false;
    }

    if (!allowPastDates && endDate < today) {
      addToast({
        title: "Дата окончания уже прошла",
        description: "Выберите сегодняшнюю или будущую дату окончания.",
        variant: "warning"
      });
      return false;
    }

    if (endDate < startDate) {
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

    const status = resolvePromotionStatus({
      startDate: form.startDate,
      endDate: form.endDate,
      manualMode: form.manualStatus,
      today
    });

    addPromotion({
      name: form.name.trim(),
      period: buildPeriod(form.startDate, form.endDate),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status,
      conditions: buildPromotionConditions(form.discount, form.audience, form.promocode),
      description: form.description.trim()
    });
    setForm(createEmptyPromotionForm());
    setCreateOpen(false);
  }

  function saveSelected() {
    if (!selected || !validatePromotion(editForm, { allowPastDates: true })) {
      return;
    }

    const status = resolvePromotionStatus({
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      manualMode: editForm.manualStatus,
      today
    });

    const patch: Partial<Promotion> = {
      name: editForm.name.trim(),
      period: buildPeriod(editForm.startDate, editForm.endDate),
      startDate: editForm.startDate || undefined,
      endDate: editForm.endDate || undefined,
      status,
      conditions: buildPromotionConditions(editForm.discount, editForm.audience, editForm.promocode),
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
        {promotions.map((promotion) => {
          const displayStatus = getPromotionDisplayStatus(promotion, today);
          return (
            <button key={promotion.id} type="button" className="text-left" onClick={() => openPromotion({ ...promotion, status: displayStatus })}>
              <Card className="h-full p-5 transition-colors hover:bg-muted/35">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{promotion.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{buildPeriod(promotion.startDate ?? "", promotion.endDate ?? "", promotion.period)}</p>
                  </div>
                  <StatusBadge status={displayStatus} />
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
          );
        })}
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
              <Input type="number" min="1" max="100" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Режим</Label>
              <Select value={form.manualStatus} onChange={(event) => setForm({ ...form, manualStatus: event.target.value as PromotionManualMode })}>
                {manualStatusOptions.map((option) => (
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
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Итоговый статус после сохранения:{" "}
            <span className="font-medium text-foreground">
              {getPromotionStatusLabel(resolvePromotionStatus({
                startDate: form.startDate,
                endDate: form.endDate,
                manualMode: form.manualStatus,
                today
              }))}
            </span>
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
                <Label>Режим</Label>
                <Select value={editForm.manualStatus} onChange={(event) => setEditForm({ ...editForm, manualStatus: event.target.value as PromotionManualMode })}>
                  {manualStatusOptions.map((option) => (
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
                  value={editForm.startDate}
                  onChange={(event) => setEditForm({ ...editForm, startDate: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Дата окончания</Label>
                <Input
                  type="date"
                  min={editForm.startDate || undefined}
                  value={editForm.endDate}
                  onChange={(event) => setEditForm({ ...editForm, endDate: event.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Скидка, %</Label>
                <Input type="number" min="1" max="100" value={editForm.discount} onChange={(event) => setEditForm({ ...editForm, discount: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Целевая аудитория</Label>
                <Input value={editForm.audience} onChange={(event) => setEditForm({ ...editForm, audience: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Промокод</Label>
                <Input value={editForm.promocode} onChange={(event) => setEditForm({ ...editForm, promocode: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Итоговый статус после сохранения:{" "}
              <span className="font-medium text-foreground">
                {getPromotionStatusLabel(resolvePromotionStatus({
                  startDate: editForm.startDate,
                  endDate: editForm.endDate,
                  manualMode: editForm.manualStatus,
                  today
                }))}
              </span>
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

function buildPromotionConditions(discount: string, audience: string, promocode: string) {
  return [
    `${Number(discount)}%`,
    `аудитория: ${audience.trim() || "все клиенты"}`,
    promocode.trim() ? `промокод ${promocode.trim()}` : null
  ].filter(Boolean).join(", ");
}

function parsePromotionConditions(conditions: string) {
  const discount = conditions.match(/(\d+(?:[.,]\d+)?)\s*%/)?.[1]?.replace(",", ".") ?? "10";
  const audience = conditions.match(/аудитори[яи]:\s*([^,]+)/i)?.[1]?.trim() ?? "";
  const promocode = conditions.match(/промокод\s*([^,]+)/i)?.[1]?.trim() ?? "";

  return {
    discount,
    audience: audience === "все клиенты" ? "" : audience,
    promocode
  };
}

function getPromotionStatusLabel(status: Promotion["status"]) {
  if (status === "draft") return "Черновик";
  if (status === "paused") return "На паузе";
  if (status === "scheduled") return "Запланирована";
  if (status === "ending") return "Скоро завершится";
  if (status === "finished") return "Завершена";
  return "Активна";
}
