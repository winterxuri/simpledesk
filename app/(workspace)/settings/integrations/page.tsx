"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { AppIcon } from "@/lib/icons";

const integrations = [
  { name: "Telegram", icon: "Send", status: "connected", description: "Уведомления и подтверждение записей" },
  { name: "WhatsApp", icon: "MessageCircle", status: "setup", description: "Сообщения клиентам через официальный провайдер" },
  { name: "Email", icon: "Mail", status: "connected", description: "Письма, отчеты и восстановление доступа" },
  { name: "Google Calendar", icon: "CalendarDays", status: "disconnected", description: "Синхронизация расписания" },
  { name: "Excel и CSV", icon: "Download", status: "connected", description: "Импорт и экспорт таблиц" },
  { name: "Телефония", icon: "Phone", status: "soon", description: "Звонки и карточка клиента по номеру" },
  { name: "Онлайн-оплата", icon: "CreditCard", status: "disconnected", description: "Ссылки на оплату и статусы платежей" },
  { name: "Вебхуки", icon: "Cable", status: "disconnected", description: "События для внешних систем" },
  { name: "API", icon: "Braces", status: "soon", description: "Доступ к данным по REST API" }
];

const statusLabels: Record<string, string> = {
  connected: "Демо-подключение",
  setup: "Требует настройки",
  disconnected: "Не подключено",
  soon: "Скоро"
};

export default function IntegrationsPage() {
  const [selected, setSelected] = useState<(typeof integrations)[number] | null>(null);

  return (
    <div>
      <PageHeader
        title="Интеграции"
        description="Демонстрационный каталог подключений. Реальные внешние API и сохранение токенов пока не используются."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.name} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <AppIcon name={integration.icon} className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{integration.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
                </div>
              </div>
              <StatusBadge status={integration.status} />
            </div>
            <Button type="button" variant="outline" className="mt-5 w-full" disabled={integration.status === "soon"} onClick={() => setSelected(integration)}>
              {integration.status === "soon" ? "Скоро" : "Посмотреть"}
            </Button>
          </Card>
        ))}
      </div>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? `Интеграция: ${selected.name}` : "Интеграция"}
        description="Это демонстрационная карточка. Подключение и токены сейчас не сохраняются."
        footer={
          <Button type="button" onClick={() => setSelected(null)}>Закрыть</Button>
        }
      >
        {selected ? (
          <div className="space-y-3">
            <InfoRow label="Название" value={selected.name} />
            <InfoRow label="Статус" value={statusLabels[selected.status] ?? selected.status} />
            <InfoRow label="Назначение" value={selected.description} />
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Реальное подключение потребует отдельного экрана авторизации, проверки прав и безопасного хранения ключей.
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
