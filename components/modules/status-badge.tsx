import { Badge, type BadgeProps } from "@/components/ui/badge";

const labels: Record<string, string> = {
  active: "активный",
  new: "новый",
  loyal: "постоянный",
  inactive: "давно не возвращался",
  attention: "требует внимания",
  planned: "запланирована",
  confirmed: "подтверждена",
  inProgress: "в работе",
  completed: "завершена",
  cancelled: "отменена",
  noShow: "неявка",
  ok: "достаточно",
  low: "заканчивается",
  critical: "критический остаток",
  out: "нет в наличии",
  free: "свободен",
  busy: "занят",
  maintenance: "обслуживание",
  unavailable: "недоступен",
  draft: "черновик",
  scheduled: "запланирована",
  ending: "скоро завершится",
  finished: "завершена",
  paused: "остановлена",
  waiting: "ожидает",
  done: "выполнена",
  overdue: "просрочена",
  enabled: "включён",
  hidden: "скрыт из меню",
  disabled: "отключён",
  owner: "владелец",
  admin: "администратор",
  employee: "сотрудник",
  connected: "подключено",
  disconnected: "не подключено",
  soon: "скоро",
  setup: "требует настройки"
};

const variants: Record<string, BadgeProps["variant"]> = {
  active: "success",
  loyal: "success",
  completed: "success",
  done: "success",
  ok: "success",
  free: "success",
  connected: "success",
  new: "default",
  planned: "default",
  confirmed: "default",
  scheduled: "default",
  enabled: "success",
  inProgress: "warning",
  low: "warning",
  ending: "warning",
  waiting: "warning",
  setup: "warning",
  attention: "danger",
  inactive: "warning",
  critical: "danger",
  out: "danger",
  unavailable: "danger",
  disabled: "danger",
  overdue: "danger",
  cancelled: "secondary",
  noShow: "danger",
  hidden: "secondary",
  paused: "secondary",
  finished: "secondary",
  draft: "secondary",
  disconnected: "secondary",
  soon: "secondary"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={variants[status] ?? "secondary"}>
      {labels[status] ?? status}
    </Badge>
  );
}
