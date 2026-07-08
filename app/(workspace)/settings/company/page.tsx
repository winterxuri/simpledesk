"use client";

import { useId, useState } from "react";
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

const timezoneOptions = [
  { value: "Europe/Moscow", label: "Москва UTC+3" },
  { value: "Asia/Yekaterinburg", label: "Екатеринбург UTC+5" },
  { value: "Asia/Novosibirsk", label: "Новосибирск UTC+7" },
  { value: "Asia/Krasnoyarsk", label: "Красноярск UTC+7" },
  { value: "Asia/Irkutsk", label: "Иркутск UTC+8" },
  { value: "Asia/Vladivostok", label: "Владивосток UTC+10" }
];

const currencyOptions = [
  { value: "RUB", label: "RUB - российский рубль" },
  { value: "KZT", label: "KZT - казахстанский тенге" },
  { value: "USD", label: "USD - доллар США" },
  { value: "EUR", label: "EUR - евро" }
];

const workDayOptions = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0");
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

export default function SettingsCompanyPage() {
  const company = useAppStore((state) => state.company);
  const updateCompany = useAppStore((state) => state.updateCompany);
  const updateTerminology = useAppStore((state) => state.updateTerminology);
  const addToast = useAppStore((state) => state.addToast);
  const [draft, setDraft] = useState(company);

  function save() {
    const trimmedName = draft.name.trim();
    const trimmedEmail = draft.email.trim();

    if (!trimmedName) {
      addToast({
        title: "Укажите название компании",
        description: "Название используется в шапке, отчетах и приглашениях сотрудников.",
        variant: "error"
      });
      return;
    }

    if (trimmedEmail && !emailPattern.test(trimmedEmail)) {
      addToast({
        title: "Проверьте email компании",
        description: "Введите адрес в формате name@example.ru или оставьте поле пустым.",
        variant: "error"
      });
      return;
    }

    if (draft.workDays.length === 0) {
      addToast({
        title: "Выберите рабочие дни",
        description: "Нужен хотя бы один день, чтобы корректно показывать расписание.",
        variant: "error"
      });
      return;
    }

    if (draft.workHours.start >= draft.workHours.end) {
      addToast({
        title: "Проверьте график работы",
        description: "Время начала должно быть раньше времени окончания.",
        variant: "error"
      });
      return;
    }

    const { terminology, ...companyDraft } = draft;
    const normalizedCompany = {
      ...companyDraft,
      name: trimmedName,
      logoUrl: companyDraft.logoUrl?.trim() || undefined,
      industry: companyDraft.industry.trim(),
      address: companyDraft.address.trim(),
      phone: companyDraft.phone.trim(),
      email: trimmedEmail
    };
    setDraft((current) => ({ ...current, ...normalizedCompany }));
    updateCompany(normalizedCompany);
    addToast({ title: "Настройки компании сохранены", variant: "success" });
  }

  function toggleWorkDay(day: string) {
    setDraft((current) => ({
      ...current,
      workDays: current.workDays.includes(day)
        ? current.workDays.filter((item) => item !== day)
        : [...current.workDays, day]
    }));
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
            <Field label="Сфера бизнеса" value={draft.industry} onChange={(value) => setDraft({ ...draft, industry: value })} />
            <Field label="Адрес" value={draft.address} onChange={(value) => setDraft({ ...draft, address: value })} />
            <Field label="Телефон" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
            <Field label="Email" value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
            <SelectField
              label="Часовой пояс"
              value={draft.timezone}
              options={timezoneOptions}
              onChange={(value) => setDraft({ ...draft, timezone: value })}
            />
            <SelectField
              label="Валюта"
              value={draft.currency}
              options={currencyOptions}
              onChange={(value) => setDraft({ ...draft, currency: value })}
            />
            <div className="space-y-2 md:col-span-2">
              <Label>Рабочие дни</Label>
              <div className="flex flex-wrap gap-2">
                {workDayOptions.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={draft.workDays.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleWorkDay(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="С"
                value={draft.workHours.start}
                options={timeOptions.map((time) => ({ value: time, label: time }))}
                onChange={(value) => setDraft({ ...draft, workHours: { ...draft.workHours, start: value } })}
              />
              <SelectField
                label="До"
                value={draft.workHours.end}
                options={timeOptions.map((time) => ({ value: time, label: time }))}
                onChange={(value) => setDraft({ ...draft, workHours: { ...draft.workHours, end: value } })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="business-template">Выбранный шаблон</Label>
              <Select
                id="business-template"
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
                <Label htmlFor={`terminology-${key}`}>{label}</Label>
                <Input
                  id={`terminology-${key}`}
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
  const inputId = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const selectId = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>{label}</Label>
      <Select id={selectId} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
