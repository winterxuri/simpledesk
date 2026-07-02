"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function IntegrationsPage() {
  const [selected, setSelected] = useState<(typeof integrations)[number] | null>(null);

  return (
    <div>
      <PageHeader
        title="Интеграции"
        description="Демонстрационный каталог подключений. Реальные внешние API пока не используются."
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
              {integration.status === "connected" ? "Настроить" : "Подключить"}
            </Button>
          </Card>
        ))}
      </div>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? `Подключение: ${selected.name}` : "Подключение"}
        description="Mock-настройки не отправляются во внешние сервисы."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSelected(null)}>Отмена</Button>
            <Button type="button" onClick={() => setSelected(null)}>Сохранить настройки</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ключ доступа</Label>
            <Input placeholder="demo-token-123" />
          </div>
          <div className="space-y-2">
            <Label>Название подключения</Label>
            <Input defaultValue={selected?.name} />
          </div>
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input placeholder="https://example.ru/webhook" />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
