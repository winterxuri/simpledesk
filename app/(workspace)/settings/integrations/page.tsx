"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { AppIcon } from "@/lib/icons";

type IntegrationStatus = "connected" | "setup" | "disconnected" | "soon";
type IntegrationCategory = "communications" | "calendar" | "data" | "payments" | "automation";
type FieldType = "text" | "email" | "url" | "password" | "select" | "textarea";

type IntegrationField = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
};

type IntegrationEvent = {
  id: string;
  label: string;
  description: string;
};

type IntegrationDefinition = {
  id: string;
  name: string;
  icon: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
  purpose: string;
  mvpMode: string;
  fields: IntegrationField[];
  events: IntegrationEvent[];
  risks: string[];
  nextStep: string;
};

type IntegrationDraft = {
  enabled: boolean;
  fields: Record<string, string>;
  events: string[];
  notes: string;
  secretProvided: boolean;
  updatedAt?: string;
};

const categoryTabs = [
  { value: "all", label: "Все" },
  { value: "communications", label: "Сообщения" },
  { value: "calendar", label: "Календарь" },
  { value: "data", label: "Данные" },
  { value: "payments", label: "Оплата" },
  { value: "automation", label: "Автоматизация" }
];

const categoryLabels: Record<IntegrationCategory, string> = {
  communications: "Сообщения",
  calendar: "Календарь",
  data: "Данные",
  payments: "Оплата",
  automation: "Автоматизация"
};

const integrations: IntegrationDefinition[] = [
  {
    id: "telegram",
    name: "Telegram",
    icon: "Send",
    category: "communications",
    status: "setup",
    description: "Уведомления команде о записях, задачах и статусах ресурсов.",
    purpose: "Быстро доносить рабочие события владельцу, администраторам и сотрудникам без захода в систему.",
    mvpMode: "Тестовое сообщение уже отправляется через сервер. Bot Token хранится только в переменных окружения сервера.",
    fields: [
      { id: "chatId", label: "Chat ID или канал", type: "text", required: true, placeholder: "123456789 или -1001234567890", help: "Для личного чата сначала отправьте боту /start. Для канала можно указать @channel." },
      { id: "audience", label: "Кому отправлять", type: "select", required: true, options: [
        { value: "owners-admins", label: "Владельцу и администраторам" },
        { value: "responsible", label: "Ответственным сотрудникам" },
        { value: "all", label: "Всем сотрудникам" }
      ] }
    ],
    events: [
      { id: "appointment-created", label: "Новая запись", description: "Клиент записался или администратор создал запись." },
      { id: "appointment-cancelled", label: "Отмена записи", description: "Запись отменена, слот освобождён." },
      { id: "resource-status", label: "Статус ресурса", description: "Помещение или оборудование занято, неисправно или снова доступно." },
      { id: "daily-summary", label: "План дня", description: "Утренняя сводка по сменам, записям и задачам." }
    ],
    risks: [
      "Нужна защита от дублей, если событие сохранено повторно.",
      "Нельзя отправлять клиентские персональные данные в общий чат без согласия бизнеса."
    ],
    nextStep: "После теста подключить отправку к выбранным событиям приложения и хранить настройки компании в Supabase."
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "MessageCircle",
    category: "communications",
    status: "setup",
    description: "Подтверждения, напоминания и сообщения клиентам через официального провайдера.",
    purpose: "Снизить неявки и дать бизнесу понятный канал коммуникации с клиентом.",
    mvpMode: "Настройка отражает будущий сценарий. Реальная отправка требует провайдера, шаблонов и согласованных текстов.",
    fields: [
      { id: "provider", label: "Провайдер", type: "select", required: true, options: [
        { value: "waba", label: "WhatsApp Business API" },
        { value: "edna", label: "edna" },
        { value: "other", label: "Другой провайдер" }
      ] },
      { id: "senderPhone", label: "Номер отправителя", type: "text", required: true, placeholder: "+7 900 000-00-00" },
      { id: "templatePrefix", label: "Префикс шаблонов", type: "text", placeholder: "simpledesk_" }
    ],
    events: [
      { id: "client-confirmation", label: "Подтверждение записи", description: "Клиент получает дату, время и услугу." },
      { id: "client-reminder", label: "Напоминание", description: "Автоматическое сообщение за день или за несколько часов." },
      { id: "client-cancelled", label: "Отмена записи", description: "Клиент получает уведомление об отмене." }
    ],
    risks: [
      "Шаблоны WhatsApp должны быть заранее одобрены провайдером.",
      "Нужно хранить согласие клиента на рассылку и канал связи."
    ],
    nextStep: "Выбрать провайдера и описать шаблоны сообщений по нишам."
  },
  {
    id: "email",
    name: "Email",
    icon: "Mail",
    category: "communications",
    status: "connected",
    description: "Служебные письма, отчёты, восстановление доступа и приглашения сотрудников.",
    purpose: "Отправлять критичные системные сообщения и отчёты, которые не должны зависеть от мессенджеров.",
    mvpMode: "Авторизация и восстановление пароля уже идут через Supabase. Бизнес-письма пока представлены как сценарий настройки.",
    fields: [
      { id: "replyTo", label: "Email для ответов", type: "email", required: true, placeholder: "hello@company.ru" },
      { id: "senderName", label: "Имя отправителя", type: "text", required: true, placeholder: "SimpleDesk" },
      { id: "reportRecipients", label: "Получатели отчётов", type: "textarea", placeholder: "owner@company.ru, admin@company.ru" }
    ],
    events: [
      { id: "employee-invite", label: "Приглашение сотрудника", description: "Ссылка регистрации сотрудника." },
      { id: "weekly-report", label: "Еженедельный отчёт", description: "Выручка, записи, задачи и проблемные места." },
      { id: "security", label: "Безопасность", description: "Восстановление доступа и важные изменения аккаунта." }
    ],
    risks: [
      "Нужно настроить домен отправителя, SPF, DKIM и DMARC перед коммерческим запуском."
    ],
    nextStep: "Подключить провайдера транзакционной почты для бизнес-уведомлений."
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    icon: "CalendarDays",
    category: "calendar",
    status: "disconnected",
    description: "Синхронизация записей и смен с внешним календарём.",
    purpose: "Дать владельцу и сотрудникам привычный внешний календарь без ручного дублирования.",
    mvpMode: "Сейчас можно описать правила синхронизации. Реальный OAuth и двусторонняя синхронизация будут отдельным этапом.",
    fields: [
      { id: "accountEmail", label: "Google аккаунт", type: "email", required: true, placeholder: "owner@gmail.com" },
      { id: "calendarName", label: "Название календаря", type: "text", required: true, placeholder: "SimpleDesk записи" },
      { id: "syncMode", label: "Режим синхронизации", type: "select", required: true, options: [
        { value: "export-only", label: "Только экспорт из SimpleDesk" },
        { value: "two-way", label: "Двусторонняя синхронизация" }
      ] }
    ],
    events: [
      { id: "appointments", label: "Записи", description: "Создание, перенос и отмена записи." },
      { id: "shifts", label: "Смены", description: "Рабочие дни, выходные, отпуск и больничный." },
      { id: "tasks", label: "Задачи", description: "Задачи с датой выполнения." }
    ],
    risks: [
      "Двусторонняя синхронизация может создать конфликты и дубли.",
      "Нужно решить, кто главный источник правды: SimpleDesk или Google Calendar."
    ],
    nextStep: "Начать с режима «только экспорт», затем добавить обработку конфликтов."
  },
  {
    id: "csv",
    name: "Excel и CSV",
    icon: "FileSpreadsheet",
    category: "data",
    status: "connected",
    description: "Импорт и экспорт клиентов, товаров, продаж и отчётов.",
    purpose: "Упростить старт бизнеса в системе и выгрузку данных для бухгалтера или владельца.",
    mvpMode: "Экспорт/импорт отчётов уже есть частично. Здесь задаются правила будущего общего импорта.",
    fields: [
      { id: "delimiter", label: "Разделитель CSV", type: "select", required: true, options: [
        { value: "semicolon", label: "Точка с запятой" },
        { value: "comma", label: "Запятая" }
      ] },
      { id: "dateFormat", label: "Формат дат", type: "select", required: true, options: [
        { value: "yyyy-mm-dd", label: "2026-07-10" },
        { value: "dd.mm.yyyy", label: "10.07.2026" }
      ] },
      { id: "importScope", label: "Что импортировать", type: "select", required: true, options: [
        { value: "clients", label: "Клиенты" },
        { value: "inventory", label: "Расходники и товары" },
        { value: "full", label: "Клиенты, товары, продажи" }
      ] }
    ],
    events: [
      { id: "clients-import", label: "Импорт клиентов", description: "ФИО, телефон, email, источник, комментарий." },
      { id: "inventory-import", label: "Импорт расходников", description: "Товар, категория, поставщик, закупка, продажа, остаток." },
      { id: "reports-export", label: "Экспорт отчётов", description: "Финансы, продажи, записи и остатки." }
    ],
    risks: [
      "Нужна проверка дублей по телефону/email.",
      "Нужна предпросмотр-таблица перед фактическим импортом."
    ],
    nextStep: "Добавить мастер импорта с сопоставлением колонок."
  },
  {
    id: "payments",
    name: "Онлайн-оплата",
    icon: "CreditCard",
    category: "payments",
    status: "disconnected",
    description: "Ссылки на оплату, предоплата записи и статусы платежей.",
    purpose: "Фиксировать оплату, уменьшать неявки и автоматически закрывать долг клиента.",
    mvpMode: "Финансы и продажи уже учитывают оплату внутри системы. Реальные платёжные ссылки требуют провайдера и webhook.",
    fields: [
      { id: "provider", label: "Провайдер", type: "select", required: true, options: [
        { value: "yookassa", label: "ЮKassa" },
        { value: "cloudpayments", label: "CloudPayments" },
        { value: "tinkoff", label: "Т-Банк" },
        { value: "other", label: "Другой" }
      ] },
      { id: "shopId", label: "Shop ID", type: "text", required: true, placeholder: "shop_123" },
      { id: "secretKey", label: "Secret key", type: "password", required: true, placeholder: "Не сохраняется в браузере" }
    ],
    events: [
      { id: "payment-link", label: "Ссылка на оплату", description: "Создаётся из записи, продажи или долга клиента." },
      { id: "payment-paid", label: "Оплата прошла", description: "Финансы и продажа обновляются автоматически." },
      { id: "payment-refund", label: "Возврат", description: "Возврат отражается в продажах и финансах." }
    ],
    risks: [
      "Нужно строго связать платёж с записью, продажей и клиентом.",
      "Webhook должен быть идемпотентным, чтобы не задвоить выручку."
    ],
    nextStep: "Начать с одного провайдера и оплат по ссылке для записи."
  },
  {
    id: "lead-forms",
    name: "Формы и заявки",
    icon: "ClipboardList",
    category: "automation",
    status: "setup",
    description: "Приём заявок с сайта, рекламных форм и внешних страниц.",
    purpose: "Не терять входящие обращения и сразу превращать их в клиента, задачу или запись.",
    mvpMode: "Сейчас описывается правило обработки заявки. Реальный приём должен идти через server endpoint или webhook.",
    fields: [
      { id: "sourceName", label: "Источник заявок", type: "text", required: true, placeholder: "Сайт, VK, Avito, 2ГИС" },
      { id: "defaultAction", label: "Что создавать", type: "select", required: true, options: [
        { value: "client-task", label: "Клиента и задачу на контакт" },
        { value: "appointment-request", label: "Черновик записи" },
        { value: "client-only", label: "Только клиента" }
      ] },
      { id: "responsibleRule", label: "Ответственный", type: "select", required: true, options: [
        { value: "owner", label: "Владелец" },
        { value: "admin", label: "Администратор" },
        { value: "round-robin", label: "Распределять по очереди" }
      ] }
    ],
    events: [
      { id: "lead-received", label: "Заявка получена", description: "Пришли ФИО, телефон, комментарий и источник." },
      { id: "client-created", label: "Клиент создан", description: "Заявка превращена в карточку клиента." },
      { id: "task-created", label: "Задача создана", description: "Ответственному назначен контакт с клиентом." }
    ],
    risks: [
      "Нужна защита от спама и дублей по телефону/email.",
      "Нужно явно показывать источник заявки, чтобы бизнес понимал эффективность рекламы."
    ],
    nextStep: "Добавить публичный endpoint для входящих заявок и очередь обработки дублей."
  },
  {
    id: "webhooks",
    name: "Вебхуки",
    icon: "Cable",
    category: "automation",
    status: "disconnected",
    description: "Отправка событий SimpleDesk во внешние системы.",
    purpose: "Позволить бизнесу связать систему с CRM, BI, телефонией, ботами и внутренними процессами.",
    mvpMode: "Сейчас задаются endpoint и события. Реальная отправка должна выполняться сервером с повторными попытками.",
    fields: [
      { id: "endpoint", label: "Endpoint URL", type: "url", required: true, placeholder: "https://example.com/webhooks/simpledesk" },
      { id: "signingSecret", label: "Signing secret", type: "password", required: true, placeholder: "Не сохраняется в браузере" },
      { id: "retryPolicy", label: "Повторные попытки", type: "select", required: true, options: [
        { value: "none", label: "Не повторять" },
        { value: "standard", label: "3 попытки за 15 минут" },
        { value: "extended", label: "6 попыток за сутки" }
      ] }
    ],
    events: [
      { id: "client-created", label: "Клиент создан", description: "Новая карточка клиента." },
      { id: "appointment-changed", label: "Запись изменилась", description: "Создание, перенос, отмена, завершение." },
      { id: "sale-created", label: "Продажа создана", description: "Продажа товара, услуги или предоплата." },
      { id: "resource-alert", label: "Ресурс изменил статус", description: "Занят, неисправен, обслуживается или свободен." }
    ],
    risks: [
      "Нужна подпись запросов, журнал доставки и повторная отправка.",
      "Нельзя блокировать работу продукта, если внешний endpoint не отвечает."
    ],
    nextStep: "Добавить очередь доставки и журнал webhooks."
  },
  {
    id: "telephony",
    name: "Телефония",
    icon: "Phone",
    category: "communications",
    status: "soon",
    description: "Звонки, карточка клиента по номеру и история обращений.",
    purpose: "Показывать карточку клиента при входящем звонке и фиксировать историю контактов.",
    mvpMode: "Пока это roadmap-функция. Для теста нужно сначала понять, какие телефонии используют малые бизнесы.",
    fields: [],
    events: [
      { id: "incoming-call", label: "Входящий звонок", description: "Открыть карточку клиента по номеру." },
      { id: "missed-call", label: "Пропущенный звонок", description: "Создать задачу на обратный звонок." }
    ],
    risks: [
      "У разных провайдеров сильно отличаются API и сценарии звонков."
    ],
    nextStep: "Собрать список провайдеров у тестовых бизнесов."
  },
  {
    id: "api",
    name: "API",
    icon: "Braces",
    category: "automation",
    status: "soon",
    description: "Программный доступ к клиентам, записям, продажам и отчётам.",
    purpose: "Дать зрелым клиентам возможность строить свои сценарии поверх SimpleDesk.",
    mvpMode: "API рано открывать до стабилизации схемы данных и ролей.",
    fields: [],
    events: [
      { id: "read-data", label: "Чтение данных", description: "Клиенты, записи, товары, финансы и отчёты." },
      { id: "write-data", label: "Создание данных", description: "Заявки, клиенты, продажи и задачи." }
    ],
    risks: [
      "Нужны rate limits, scopes, audit log и отдельные API-ключи.",
      "Публичный API закрепляет схему данных, которую потом сложно менять."
    ],
    nextStep: "Вернуться после тестов с реальными бизнесами и стабилизации моделей данных."
  }
];

export default function IntegrationsPage() {
  const company = useAppStore((state) => state.company);
  const sessionMode = useAppStore((state) => state.sessionMode);
  const addToast = useAppStore((state) => state.addToast);
  const [category, setCategory] = useState("all");
  const [configs, setConfigs] = useState<Record<string, IntegrationDraft>>({});
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<IntegrationDefinition | null>(null);
  const [draft, setDraft] = useState<IntegrationDraft | null>(null);
  const [error, setError] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);

  const storageKey = useMemo(() => `simpledesk-integrations:${company.id}`, [company.id]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setConfigs(raw ? JSON.parse(raw) : {});
    } catch {
      setConfigs({});
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(configs));
  }, [configs, loaded, storageKey]);

  const filteredIntegrations = integrations.filter(
    (integration) => category === "all" || integration.category === category
  );
  const connectedCount = integrations.filter((integration) => getEffectiveStatus(integration, configs[integration.id]) === "connected").length;
  const setupCount = integrations.filter((integration) => {
    const status = getEffectiveStatus(integration, configs[integration.id]);
    return status === "setup" || status === "disconnected";
  }).length;
  const soonCount = integrations.filter((integration) => getEffectiveStatus(integration, configs[integration.id]) === "soon").length;

  function openIntegration(integration: IntegrationDefinition) {
    setSelected(integration);
    setDraft(createDraft(integration, configs[integration.id]));
    setError("");
  }

  function updateField(fieldId: string, value: string) {
    if (!draft) {
      return;
    }
    setDraft({
      ...draft,
      fields: {
        ...draft.fields,
        [fieldId]: value
      }
    });
  }

  function toggleEvent(eventId: string, checked: boolean) {
    if (!draft) {
      return;
    }
    setDraft({
      ...draft,
      events: checked
        ? Array.from(new Set([...draft.events, eventId]))
        : draft.events.filter((item) => item !== eventId)
    });
  }

  function saveSelected() {
    if (!selected || !draft) {
      return;
    }

    const validationError = validateDraft(selected, draft);
    if (validationError) {
      setError(validationError);
      addToast({
        title: "Проверьте настройку интеграции",
        description: validationError,
        variant: "warning"
      });
      return;
    }

    const publicFields = selected.fields.reduce<Record<string, string>>((result, field) => {
      if (field.type !== "password") {
        result[field.id] = draft.fields[field.id] ?? "";
      }
      return result;
    }, {});
    const secretWasProvided = selected.fields.some(
      (field) => field.type === "password" && Boolean(draft.fields[field.id]?.trim())
    );
    const nextDraft: IntegrationDraft = {
      enabled: draft.enabled,
      fields: publicFields,
      events: draft.events,
      notes: draft.notes.trim(),
      secretProvided: draft.secretProvided || secretWasProvided,
      updatedAt: new Date().toISOString()
    };

    setConfigs((current) => ({
      ...current,
      [selected.id]: nextDraft
    }));
    setSelected(null);
    setDraft(null);
    addToast({
      title: draft.enabled ? "Интеграция настроена" : "Черновик интеграции сохранён",
      description: selected.fields.some((field) => field.type === "password")
        ? "Секретные ключи не сохраняются в браузере. Для реального запуска нужен backend."
        : "Настройка сохранена локально для проверки сценария.",
      variant: "success"
    });
  }

  async function testIntegration(integration: IntegrationDefinition) {
    const status = getEffectiveStatus(integration, configs[integration.id]);
    if (status !== "connected") {
      addToast({
        title: "Интеграция ещё не активна",
        description: "Сначала сохраните настройку и включите интеграцию.",
        variant: "warning"
      });
      return;
    }
    if (integration.id !== "telegram") {
      addToast({
        title: `Тест: ${integration.name}`,
        description: "Для этой интеграции пока сохранён только черновик. Реальный backend ещё не подключён.",
        variant: "info"
      });
      return;
    }

    const chatId = configs.telegram?.fields.chatId?.trim();
    if (!chatId) {
      addToast({
        title: "Не указан Chat ID",
        description: "Откройте Telegram, заполните Chat ID, включите интеграцию и сохраните настройку.",
        variant: "warning"
      });
      return;
    }

    setTestingId(integration.id);
    try {
      const response = await fetch("/api/integrations/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId })
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Не удалось отправить тестовое сообщение.");
      }

      addToast({
        title: "Telegram подключён",
        description: "Тестовое сообщение доставлено в выбранный чат.",
        variant: "success"
      });
    } catch (testError) {
      addToast({
        title: "Тест Telegram не прошёл",
        description: testError instanceof Error ? testError.message : "Неизвестная ошибка.",
        variant: "warning"
      });
    } finally {
      setTestingId(null);
    }
  }

  function disableIntegration(integration: IntegrationDefinition) {
    setConfigs((current) => ({
      ...current,
      [integration.id]: {
        ...createDraft(integration, current[integration.id]),
        enabled: false,
        updatedAt: new Date().toISOString()
      }
    }));
    addToast({
      title: "Интеграция отключена",
      description: `${integration.name} больше не считается активной в тестовой настройке.`,
      variant: "info"
    });
  }

  return (
    <div>
      <PageHeader
        title="Интеграции"
        description="Настройте внешние подключения. Telegram уже поддерживает реальное тестовое сообщение, остальные интеграции пока работают как безопасные черновики."
        actions={
          <Button type="button" variant="outline" asChild>
            <Link href="/feedback">
              <AppIcon name="Bug" className="h-4 w-4" />
              Сообщить о баге
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric label="Активные или встроенные" value={String(connectedCount)} description="Готовы для тестового сценария" />
        <Metric label="Требуют настройки" value={String(setupCount)} description="Нужны правила, провайдеры или ключи" />
        <Metric label="Позже" value={String(soonCount)} description="Лучше не запускать до тестов" />
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs items={categoryTabs} value={category} onValueChange={setCategory} />
        <p className="text-sm text-muted-foreground">
          {sessionMode === "registered"
            ? "Рабочие данные компании синхронизируются с Supabase, но черновики интеграций пока хранятся только в браузере."
            : "В демо-режиме настройки интеграций остаются локальными."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredIntegrations.map((integration) => {
          const config = configs[integration.id];
          const status = getEffectiveStatus(integration, config);
          return (
            <Card key={integration.id} className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <AppIcon name={integration.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{integration.name}</p>
                      <Badge variant="outline">{categoryLabels[integration.category]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <InfoLine label="Зачем" value={integration.purpose} />
                <InfoLine label="MVP" value={integration.mvpMode} />
                {config?.updatedAt ? (
                  <InfoLine label="Черновик" value={`обновлён ${formatDateTime(config.updatedAt)}`} />
                ) : null}
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button
                  type="button"
                  variant={status === "connected" ? "outline" : "default"}
                  disabled={integration.status === "soon"}
                  onClick={() => openIntegration(integration)}
                >
                  {integration.status === "soon" ? "Позже" : status === "connected" ? "Открыть" : "Настроить"}
                </Button>
                {integration.status !== "soon" ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={testingId === integration.id}
                    onClick={() => void testIntegration(integration)}
                  >
                    {testingId === integration.id ? "Отправка..." : "Тест"}
                  </Button>
                ) : null}
                {config?.enabled && integration.status !== "connected" ? (
                  <Button type="button" variant="ghost" onClick={() => disableIntegration(integration)}>
                    Отключить
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold">Что важно перед реальным подключением</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <InfoBox
            title="Секреты только на сервере"
            text="Bot Token, payment secret и signing secret нельзя хранить в localStorage или отдавать в клиентский JavaScript."
          />
          <InfoBox
            title="События должны быть идемпотентны"
            text="Повторная отправка webhook или платежного события не должна создавать двойную продажу, оплату или уведомление."
          />
          <InfoBox
            title="Начинать нужно с простого"
            text="Для теста лучше первыми запускать Email, CSV, Telegram-уведомления и экспорт календаря, а не сложную двустороннюю синхронизацию."
          />
        </div>
      </Card>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setDraft(null);
            setError("");
          }
        }}
        title={selected ? `Интеграция: ${selected.name}` : "Интеграция"}
        description={selected?.mvpMode}
        className="max-w-3xl"
        footer={
          selected?.status === "soon" ? (
            <Button type="button" onClick={() => setSelected(null)}>
              Закрыть
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                Отмена
              </Button>
              <Button type="button" onClick={saveSelected}>
                Сохранить
              </Button>
            </>
          )
        }
      >
        {selected && draft ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow label="Назначение" value={selected.purpose} />
              <InfoRow label="Следующий backend-шаг" value={selected.nextStep} />
            </div>

            {selected.status !== "soon" ? (
              <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-3">
                <span>
                  <span className="block text-sm font-medium">Считать интеграцию активной в тестовом режиме</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Это не отправляет реальные сообщения и не подключает внешний API.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-primary"
                  checked={draft.enabled}
                  onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
                />
              </label>
            ) : null}

            {selected.fields.length ? (
              <div>
                <h3 className="text-sm font-semibold">Поля настройки</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {selected.fields.map((field) => (
                    <FieldControl
                      key={field.id}
                      field={field}
                      value={draft.fields[field.id] ?? ""}
                      secretProvided={draft.secretProvided}
                      onChange={(value) => updateField(field.id, value)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="text-sm font-semibold">События</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {selected.events.map((event) => (
                  <Checkbox
                    key={event.id}
                    checked={draft.events.includes(event.id)}
                    onChange={(changeEvent) => toggleEvent(event.id, changeEvent.currentTarget.checked)}
                    label={event.label}
                    description={event.description}
                    disabled={selected.status === "soon"}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Внутренняя заметка</Label>
              <Textarea
                value={draft.notes}
                placeholder="Например: подключать после выбора провайдера, согласовать тексты уведомлений с владельцем."
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {error}
              </div>
            ) : null}

            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <h3 className="text-sm font-semibold">Риски</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {selected.risks.map((risk) => (
                  <li key={risk}>• {risk}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function Metric({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}: </span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function InfoBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
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

function FieldControl({
  field,
  value,
  secretProvided,
  onChange
}: {
  field: IntegrationField;
  value: string;
  secretProvided: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={field.type === "textarea" ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <Label>{field.label}{field.required ? " *" : ""}</Label>
      {field.type === "select" ? (
        <Select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Выберите вариант</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      ) : field.type === "textarea" ? (
        <Textarea value={value} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <Input
          type={field.type}
          value={value}
          placeholder={field.type === "password" && secretProvided ? "Секрет уже вводился для черновика" : field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
    </div>
  );
}

function createDraft(integration: IntegrationDefinition, current?: IntegrationDraft): IntegrationDraft {
  const fields = integration.fields.reduce<Record<string, string>>((result, field) => {
    result[field.id] = current?.fields[field.id] ?? getDefaultFieldValue(field);
    return result;
  }, {});

  return {
    enabled: current?.enabled ?? integration.status === "connected",
    fields,
    events: current?.events.length ? current.events : integration.events.map((event) => event.id),
    notes: current?.notes ?? "",
    secretProvided: current?.secretProvided ?? false,
    updatedAt: current?.updatedAt
  };
}

function getDefaultFieldValue(field: IntegrationField) {
  return field.type === "select" ? field.options?.[0]?.value ?? "" : "";
}

function getEffectiveStatus(integration: IntegrationDefinition, config?: IntegrationDraft): IntegrationStatus {
  if (integration.status === "soon") {
    return "soon";
  }
  if (config?.enabled || integration.status === "connected") {
    return "connected";
  }
  if (config) {
    return "setup";
  }
  return integration.status;
}

function validateDraft(integration: IntegrationDefinition, draft: IntegrationDraft) {
  if (integration.status === "soon") {
    return "";
  }
  if (!draft.events.length) {
    return "Выберите хотя бы одно событие, иначе интеграция ничего не будет делать.";
  }

  for (const field of integration.fields) {
    const value = draft.fields[field.id]?.trim() ?? "";
    if (field.required && field.type === "password" && draft.enabled && !value && !draft.secretProvided) {
      return `Введите ${field.label.toLowerCase()} для активной интеграции.`;
    }
    if (field.required && field.type !== "password" && !value) {
      return `Заполните поле «${field.label}».`;
    }
    if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `Поле «${field.label}» должно быть корректным email.`;
    }
    if (value && field.type === "url" && !/^https:\/\/.+\..+/.test(value)) {
      return `Поле «${field.label}» должно быть HTTPS-ссылкой.`;
    }
  }

  return "";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
