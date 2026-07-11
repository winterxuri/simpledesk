"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { ProductLogo } from "@/components/layout/product-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { getBusinessTemplate } from "@/config/templates";
import { MODULES } from "@/config/modules";
import { getModuleTitle, isRequiredModule, withRequiredModules } from "@/config/navigation";
import { completeBackendOnboarding } from "@/lib/backend/auth";
import { useAppStore } from "@/store/app-store";
import { AppIcon } from "@/lib/icons";
import type { ModuleCode } from "@/types";

const workOptions = [
  "предварительная запись",
  "заказы",
  "продажа товаров",
  "оказание услуг",
  "бронирование помещений или оборудования",
  "постоянные клиенты",
  "разовые посетители"
];

const accountingOptions = [
  "товары",
  "расходные материалы",
  "оборудование",
  "помещения",
  "рабочие места",
  "поставщиков",
  "сертификаты и абонементы"
];

const TEMPLATE_ID = "beauty";

export default function OnboardingPage() {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const user = useAppStore((state) => state.user);
  const company = useAppStore((state) => state.company);
  const role = useAppStore((state) => state.role);
  const sessionMode = useAppStore((state) => state.sessionMode);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const addToast = useAppStore((state) => state.addToast);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [work, setWork] = useState<string[]>([]);
  const [accounting, setAccounting] = useState<string[]>([]);
  const [team, setTeam] = useState({
    count: "6",
    roles: true,
    schedule: true,
    financeAccess: true
  });
  const [selectedModules, setSelectedModules] = useState<ModuleCode[]>(
    withRequiredModules(getBusinessTemplate(TEMPLATE_ID).activeModules)
  );

  const template = useMemo(() => getBusinessTemplate(TEMPLATE_ID), []);
  const progress = Math.round((step / 5) * 100);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!user || sessionMode === "none") {
      router.replace("/login");
      return;
    }

    if (role !== "owner") {
      addToast({
        title: "Onboarding доступен только владельцу",
        description: "Сотрудники и администраторы работают в уже настроенном пространстве.",
        variant: "info"
      });
      router.replace("/dashboard");
      return;
    }

    if (sessionMode === "registered" && onboardingComplete) {
      router.replace("/settings/modules");
    }
  }, [addToast, hasHydrated, onboardingComplete, role, router, sessionMode, user]);

  function toggleList(value: string, list: string[], setter: (value: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function finish() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const safeSelectedModules = withRequiredModules(selectedModules);
      if (sessionMode === "registered") {
        await completeBackendOnboarding(
          {
            ...company,
            businessTemplateId: TEMPLATE_ID
          },
          safeSelectedModules
        );
      }
      completeOnboarding(TEMPLATE_ID, safeSelectedModules);
      router.push("/dashboard");
    } catch (error) {
      addToast({
        title: "Не удалось сохранить настройку",
        description:
          error instanceof Error
            ? error.message
            : "Проверьте соединение с Supabase и попробуйте снова.",
        variant: "error"
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (
    !hasHydrated ||
    !user ||
    sessionMode === "none" ||
    role !== "owner" ||
    (sessionMode === "registered" && onboardingComplete)
  ) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="inline-flex">
              <ProductLogo
                markClassName="h-8 w-8"
                wordmarkClassName="text-sm text-primary"
              />
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Настройка салона</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              5 коротких шагов, чтобы оставить только нужные разделы и термины.
            </p>
          </div>
          <div className="min-w-64">
            <div className="mb-2 flex justify-between text-sm text-muted-foreground">
              <span>Шаг {step} из 5</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </div>

        <Card className="p-5 md:p-6">
          {step === 1 ? (
            <section>
              <h2 className="text-xl font-semibold">Как бизнес работает с клиентами</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {workOptions.map((option) => (
                  <Checkbox
                    key={option}
                    checked={work.includes(option)}
                    onChange={() => toggleList(option, work, setWork)}
                    label={option}
                    description="Можно выбрать несколько вариантов"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <h2 className="text-xl font-semibold">Что нужно учитывать</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {accountingOptions.map((option) => (
                  <Checkbox
                    key={option}
                    checked={accounting.includes(option)}
                    onChange={() => toggleList(option, accounting, setAccounting)}
                    label={option}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section>
              <h2 className="text-xl font-semibold">Команда</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Количество сотрудников</label>
                  <Input
                    type="number"
                    min="1"
                    value={team.count}
                    onChange={(event) => setTeam({ ...team, count: event.target.value })}
                  />
                </div>
                {[
                  ["roles", "Есть разные роли"],
                  ["schedule", "Нужно отдельное расписание сотрудников"],
                  ["financeAccess", "Нужно ограничивать доступ к финансам"]
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <span className="text-sm font-medium">{label}</span>
                    <Switch
                      checked={team[key as keyof typeof team] === true}
                      onCheckedChange={(checked) => setTeam({ ...team, [key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section>
              <h2 className="text-xl font-semibold">Необходимые функции</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Рекомендации сформированы по шаблону "{template.title}".
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {MODULES.map((module) => {
                  const required = isRequiredModule(module.code);
                  const checked = required || selectedModules.includes(module.code);
                  const recommended = template.activeModules.includes(module.code);
                  return (
                    <div key={module.code} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <AppIcon name={module.icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{getModuleTitle(module.code, TEMPLATE_ID)}</p>
                            {recommended ? (
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                рекомендовано
                              </span>
                            ) : null}
                            {required ? (
                              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                обязательно
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={checked}
                        disabled={required || module.plan === "pro"}
                        label={`Включить модуль ${getModuleTitle(module.code, TEMPLATE_ID)}`}
                        onCheckedChange={(value) =>
                          setSelectedModules((current) =>
                            value
                              ? [...new Set([...current, module.code])]
                              : current.filter((code) => code !== module.code)
                          )
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {step === 5 ? (
            <section>
              <h2 className="text-xl font-semibold">Готовая конфигурация</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm text-muted-foreground">Ниша</p>
                    <p className="mt-1 font-semibold">{template.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{template.sampleFocus}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm text-muted-foreground">Термины</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(template.terminology).slice(0, 6).map(([key, value]) => (
                        <span key={key} className="rounded-md bg-muted px-2 py-1 text-sm">
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm text-muted-foreground">Меню</p>
                    <div className="mt-3 space-y-2">
                      {selectedModules.slice(0, 8).map((code) => (
                        <div key={code} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          {getModuleTitle(code, TEMPLATE_ID)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="font-medium">Демонстрационный вид главной страницы</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {["Выручка", "Записи", "Клиенты"].map((label, index) => (
                      <div key={label} className="rounded-lg border border-border bg-card p-3">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-2 text-lg font-semibold">
                          {index === 0 ? "78 400 ₽" : index === 1 ? "18" : "6"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg border border-border bg-card p-4">
                    <p className="font-medium">Требует внимания</p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>Несколько клиентов не подтвердили {template.terminology.appointment}</li>
                      <li>Заканчиваются {template.terminology.material}</li>
                      <li>Есть просроченные задачи</li>
                    </ul>
                  </div>
                  <div className="mt-4 rounded-lg border border-border bg-card p-4">
                    <p className="font-medium">Операционная подсказка</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Система подсветит клиентов без повторной записи, низкие остатки и просроченные задачи.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1 || isSaving}
              onClick={() => setStep((current) => Math.max(1, current - 1))}
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <div className="flex gap-2">
              {step === 5 ? (
                <>
                  <Button type="button" variant="outline" disabled={isSaving} onClick={() => setStep(4)}>
                    Изменить настройки
                  </Button>
                  <Button type="button" disabled={isSaving} onClick={finish}>
                    {isSaving ? "Сохраняем..." : "Запустить рабочее пространство"}
                  </Button>
                </>
              ) : (
                <Button type="button" disabled={isSaving} onClick={() => setStep((current) => current + 1)}>
                  Далее
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
