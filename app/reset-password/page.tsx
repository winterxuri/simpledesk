"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ProductLogo } from "@/components/layout/product-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";

const schema = z
  .object({
    password: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string().min(6, "Минимум 6 символов")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const addToast = useAppStore((state) => state.addToast);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  useEffect(() => {
    let active = true;
    createSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!active) return;
        setSessionValid(Boolean(data.session));
        setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(values: FormValues) {
    const { error } = await createSupabaseBrowserClient().auth.updateUser({
      password: values.password
    });

    if (error) {
      addToast({
        title: "Не удалось сохранить пароль",
        description: error.message,
        variant: "error"
      });
      return;
    }

    addToast({
      title: "Пароль обновлён",
      description: "Войдите в аккаунт с новым паролем.",
      variant: "success"
    });
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex">
            <ProductLogo markClassName="h-8 w-8" wordmarkClassName="text-sm text-primary" />
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">Новый пароль</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Придумайте новый пароль для входа в SimpleDesk.
          </p>
        </div>

        {checkingSession ? (
          <p className="text-sm text-muted-foreground">Проверяем ссылку восстановления...</p>
        ) : !sessionValid ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              Ссылка недействительна или устарела. Запросите восстановление пароля ещё раз.
            </p>
            <Link href="/login" className="text-sm font-medium text-primary">
              Вернуться ко входу
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(submit)}>
            <div className="space-y-2">
              <Label>Новый пароль</Label>
              <Input type="password" {...register("password")} />
              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Повторите пароль</Label>
              <Input type="password" {...register("confirmPassword")} />
              {errors.confirmPassword ? (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Сохранить пароль
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
