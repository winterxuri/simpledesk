# SimpleDesk

SimpleDesk — рабочая платформа для малого бизнеса: клиенты, записи, сотрудники, ресурсы, товары, акции, задачи и отчеты. Интерфейс на русском языке. Демо-режим работает локально, зарегистрированные компании используют Supabase Auth и Supabase PostgreSQL.

## Backend-стек

- Next.js App Router + TypeScript.
- Supabase PostgreSQL + Supabase Auth.
- Row Level Security по `company_id`.
- Zustand остается для UI-состояния, бизнес-данные постепенно переносятся в Supabase.

Supabase client/server helper'ы находятся в `lib/supabase`, бизнес-синхронизация - в `lib/backend`.

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

Если база уже была создана по первой схеме, дополнительно примените:

```text
supabase/migrations/0002_backend_phase_one.sql
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
- `/login`, `/register`, `/onboarding` - вход, регистрация владельца, демо-вход и мастер настройки.
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
- Демо-данные: клиенты, сотрудники, записи, товары, движения склада, ресурсы, акции, задачи, финансы, уведомления.
- Быстрое создание, панель уведомлений, route loading/error состояния.

## Текущая backend-модель

- Регистрация владельца и вход подключены к Supabase Auth.
- После регистрации создаются компания, владелец, участник компании и модули.
- Клиенты, записи, сотрудники, товары, движения склада, акции, задачи и финансовые операции синхронизируются в Supabase для зарегистрированных компаний.
- Демо-режим и fallback при подтверждении email используют Zustand persist + `localStorage`.
- Демонстрационные данные: `data/demo-data.ts`; начальные пустые данные для реального аккаунта: `data/initial-data.ts`.
- Интеграции и платежи: только визуальные формы в `/settings/integrations`.

## Следующие backend-шаги

1. Реализовать приглашения сотрудников по email на базе `employee_invites`.
2. Перенести backend-запись в Server Actions там, где понадобится service-role логика.
3. Добавить полноценную загрузку чек-листов задач и детальные права доступа.
