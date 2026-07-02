"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCT_NAME } from "@/config/product";
import { signInUser } from "@/lib/backend/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  remember: z.boolean().optional()
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const startDemoSession = useAppStore((state) => state.startDemoSession);
  const hydrateBackendWorkspace = useAppStore((state) => state.hydrateBackendWorkspace);
  const addToast = useAppStore((state) => state.addToast);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      remember: true
    }
  });

  async function submit(values: FormValues) {
    try {
      const workspace = await signInUser(values.email, values.password);
      if (!workspace) {
        addToast({
          title: "Аккаунт найден, но компания не настроена",
          description: "Завершите регистрацию или проверьте подтверждение email в Supabase.",
          variant: "warning"
        });
        return;
      }

      hydrateBackendWorkspace(workspace);
      addToast({
        title: "Вход выполнен",
        description: "Открыто рабочее пространство SimpleDesk.",
        variant: "success"
      });
      router.push(workspace.onboardingComplete ? "/dashboard" : "/onboarding");
    } catch (error) {
      addToast({
        title: "Не удалось войти",
        description:
          error instanceof Error ? error.message : "Проверьте email и пароль.",
        variant: "error"
      });
    }
  }

  function openDemo() {
    startDemoSession();
    addToast({
      title: "Вход выполнен",
      description: "Открыт демо-кабинет с локальными данными.",
      variant: "success"
    });
    router.push("/dashboard");
  }

  async function restorePassword() {
    const email = getValues("email");
    if (!email) {
      addToast({
        title: "Введите email",
        description: "Укажите почту в поле выше, чтобы получить ссылку восстановления.",
        variant: "warning"
      });
      return;
    }

    const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });
    addToast(
      error
        ? {
            title: "Не удалось отправить письмо",
            description: error.message,
            variant: "error"
          }
        : {
            title: "Письмо отправлено",
            description: "Проверьте почту и перейдите по ссылке восстановления.",
            variant: "success"
          }
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-primary">
            {PRODUCT_NAME}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">Вход</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Введите данные или откройте демо-режим.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Пароль</Label>
            <Input type="password" {...register("password")} />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-primary" {...register("remember")} />
              Запомнить меня
            </label>
            <button type="button" className="text-primary" onClick={restorePassword}>
              Восстановить пароль
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Войти
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={openDemo}
          >
            Войти в демо-режиме
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-medium text-primary">
            Перейти к регистрации
          </Link>
        </p>
      </Card>
    </main>
  );
}
