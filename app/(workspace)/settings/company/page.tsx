"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/modules/page-header";
import { BUSINESS_TEMPLATES } from "@/config/templates";
import { useAppStore } from "@/store/app-store";

const terminologyKeys = [
  ["appointment", "Запись / заказ / визит"],
  ["client", "Клиент / пациент / гость"],
  ["employee", "Мастер / специалист / сотрудник"],
  ["service", "Услуга / товар / работа"],
  ["resource", "Ресурс / кабинет / пост"],
  ["product", "Товар / запчасть"],
  ["material", "Расходник / ингредиент"]
] as const;

export default function SettingsCompanyPage() {
  const company = useAppStore((state) => state.company);
  const updateCompany = useAppStore((state) => state.updateCompany);
  const updateTerminology = useAppStore((state) => state.updateTerminology);
  const addToast = useAppStore((state) => state.addToast);
  const [draft, setDraft] = useState(company);

  function save() {
    const { terminology, ...companyDraft } = draft;
    updateCompany(companyDraft);
    addToast({ title: "Настройки компании сохранены", variant: "success" });
  }

  return (
    <div>
      <PageHeader
        title="Настройки компании"
        description="Основные данные, график работы, валюта, часовой пояс и терминология."
        actions={<Button type="button" onClick={save}>Сохранить</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card className="p-5">
          <h2 className="font-semibold">Профиль компании</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Название" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
            <Field label="Логотип" value={draft.logoUrl ?? ""} onChange={(value) => setDraft({ ...draft, logoUrl: value })} placeholder="URL логотипа" />
            <Field label="Сфера бизнеса" value={draft.industry} onChange={(value) => setDraft({ ...draft, industry: value })} />
            <Field label="Адрес" value={draft.address} onChange={(value) => setDraft({ ...draft, address: value })} />
            <Field label="Телефон" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
            <Field label="Email" value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
            <Field label="Часовой пояс" value={draft.timezone} onChange={(value) => setDraft({ ...draft, timezone: value })} />
            <Field label="Валюта" value={draft.currency} onChange={(value) => setDraft({ ...draft, currency: value })} />
            <Field label="Рабочие дни" value={draft.workDays.join(", ")} onChange={(value) => setDraft({ ...draft, workDays: value.split(",").map((item) => item.trim()) })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="С" value={draft.workHours.start} onChange={(value) => setDraft({ ...draft, workHours: { ...draft.workHours, start: value } })} />
              <Field label="До" value={draft.workHours.end} onChange={(value) => setDraft({ ...draft, workHours: { ...draft.workHours, end: value } })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Выбранный шаблон</Label>
              <Select
                value={draft.businessTemplateId}
                onChange={(event) => setDraft({ ...draft, businessTemplateId: event.target.value })}
              >
                {BUSINESS_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>{template.title}</option>
                ))}
              </Select>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Терминология</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Можно заменить названия сущностей под привычный язык бизнеса.
          </p>
          <div className="mt-5 space-y-4">
            {terminologyKeys.map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={company.terminology[key] ?? ""}
                  onChange={(event) => updateTerminology(key, event.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}
