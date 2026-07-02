# SimpleDesk frontend prototype

SimpleDesk — рабочая платформа для малого бизнеса. Это кликабельный frontend-прототип CRM/операционной системы: клиенты, записи, сотрудники, ресурсы, товары, акции, задачи и отчеты. Интерфейс на русском языке, текущие demo-данные сохраняются в `localStorage`.

## Backend-стек

- Next.js App Router + TypeScript.
- Supabase PostgreSQL + Supabase Auth.
- Row Level Security по `company_id`.
- Zustand остается для UI-состояния, бизнес-данные постепенно переносятся в Supabase.

Supabase client/server helper'ы находятся в `lib/supabase`. Root middleware будет включен на этапе реального auth-flow, когда login/register перестанут быть demo-экранами.

## Запуск

```bash
pnpm install
pnpm dev
```

После запуска откройте `http://localhost:3000`.

Для подключения Supabase создайте `.env.local` по примеру `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Supabase

Первичная схема MVP лежит в:

```text
supabase/migrations/0001_initial_schema.sql
```

Чтобы применить ее вручную:

1. Откройте Supabase Dashboard.
2. Перейдите в SQL Editor.
3. Вставьте содержимое файла миграции.
4. Выполните SQL.

Схема создает multi-tenant таблицы с `company_id` и включает Row Level Security:

- компании и участники;
- модули компании;
- клиенты;
- сотрудники;
- записи;
- ресурсы;
- товары и движения склада;
- акции;
- задачи и чек-листы;
- финансовые операции;
- уведомления.

## Vercel

После загрузки проекта в GitHub:

1. Import Project в Vercel.
2. Выберите репозиторий `simpledesk`.
3. Добавьте Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

4. Запустите Deploy.

## Реализованные страницы

- `/` - короткий лендинг продукта.
- `/login`, `/register`, `/onboarding` - демо-вход, регистрация и мастер настройки.
- `/dashboard`, `/calendar`, `/clients`, `/clients/[id]`.
- `/employees`, `/inventory`, `/resources`, `/promotions`, `/tasks`.
- `/analytics`.
- `/settings`, `/settings/modules`, `/settings/navigation`, `/settings/company`, `/settings/integrations`.

## Что есть в прототипе

- Next.js App Router, TypeScript, Tailwind CSS, shadcn-style компоненты.
- Lucide Icons, Recharts, React Hook Form, Zod, Zustand, date-fns.
- Динамические шаблоны ниш: салон красоты, автосервис, кофейня, магазин, универсальный бизнес.
- Динамическое меню по активным модулям, скрытие и отключение модулей.
- Переключатель светлой/тёмной темы и демо-роль: владелец, администратор, сотрудник.
- Mock-данные: клиенты, сотрудники, записи, товары, движения склада, ресурсы, акции, задачи, финансы, уведомления.
- Быстрое создание, панель уведомлений, route loading/error состояния.

## Mock-реализации для замены backend

- Авторизация и регистрация: пока demo-реализация в `store/app-store.ts`, далее переносится на Supabase Auth.
- Сохранение компании, модулей, меню и данных: Zustand persist + `localStorage`.
- Демонстрационные данные: `data/demo-data.ts`.
- Интеграции и платежи: только визуальные формы в `/settings/integrations`.

## Как подключать backend

1. Заменить actions в `store/app-store.ts` на запросы к Supabase/Server Actions и оставить Zustand как клиентский UI-state.
2. Перенести генерацию demo-данных из `data/demo-data.ts` в seed-данные backend.
3. Подключить настоящую авторизацию и хранить `User`, `Company`, `CompanyModule` на сервере.
