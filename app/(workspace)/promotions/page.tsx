"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormDrawer } from "@/components/modules/form-drawer";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Promotion } from "@/types";

function buildPeriod(startDate: string, endDate: string) {
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `с ${formatDate(startDate)}`;
  }
  if (endDate) {
    return `до ${formatDate(endDate)}`;
  }
  return "период не указан";
}

const emptyPromotionForm = {
  name: "",
  description: "",
  discount: "10",
  audience: "",
  promocode: "",
  startDate: "",
  endDate: ""
};

export default function PromotionsPage() {
  const promotions = useAppStore((state) => state.data.promotions);
  const addPromotion = useAppStore((state) => state.addPromotion);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [form, setForm] = useState(emptyPromotionForm);

  function save() {
    addPromotion({
      name: form.name || "Новая акция",
      period: buildPeriod(form.startDate, form.endDate),
      status: "draft",
      conditions: [
        `${form.discount || "0"}% для аудитории: ${form.audience || "все клиенты"}`,
        form.promocode ? `промокод ${form.promocode}` : null
      ].filter(Boolean).join(", "),
      description: form.description || "Черновик акции."
    });
    setForm(emptyPromotionForm);
    setCreateOpen(false);
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
          <button key={promotion.id} type="button" className="text-left" onClick={() => setSelected(promotion)}>
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
          {[
            ["name", "Название"],
            ["discount", "Скидка, %"],
            ["audience", "Целевая аудитория"],
            ["promocode", "Промокод"]
          ].map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
            </div>
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Дата начала</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Дата окончания</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Описание и каналы продвижения</Label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <Button type="button" className="w-full" onClick={save}>Сохранить</Button>
        </div>
      </FormDrawer>

      <Drawer open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} title={selected?.name ?? "Акция"} description="Статистика кампании">
        {selected ? (
          <div className="space-y-4">
            <StatusBadge status={selected.status} />
            <p className="text-sm text-muted-foreground">{selected.description}</p>
            <Metric label="Период" value={selected.period} />
            <Metric label="Условия" value={selected.conditions} />
            <Metric label="Использований" value={String(selected.usageCount)} />
            <Metric label="Выручка" value={formatCurrency(selected.revenue)} />
            <Metric label="Новые клиенты" value={String(selected.newClients)} />
            <Metric label="Эффективность" value={`${selected.efficiency}%`} />
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
