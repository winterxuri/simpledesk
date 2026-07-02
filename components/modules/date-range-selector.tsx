"use client";

import { Tabs } from "@/components/ui/tabs";

const ranges = [
  { value: "today", label: "Сегодня" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "custom", label: "Период" }
];

export function DateRangeSelector({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <Tabs items={ranges} value={value} onValueChange={onChange} />;
}
