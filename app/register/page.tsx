"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCT_NAME } from "@/config/product";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  name: z.string().min(2, "Введите имя"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  companyName: z.string().min(2, "Введите название компании"),
  terms: z.literal(true, {
    errorMap: () => ({ message: "Нужно согласиться с условиями" })
  })
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAppStore((state) => state.registerUser);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "Алексей",
      email: "alexey@example.ru",
      password: "demo123",
      companyName: "Студия на Петровке",
      terms: true
    }
  });

  function submit(values: FormValues) {
    registerUser(values);
    router.push("/onboarding");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-primary">
            {PRODUCT_NAME}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">Регистрация</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            После регистрации откроется мастер настройки бизнеса.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="space-y-2">
            <Label>Имя</Label>
            <Input {...register("name")} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Пароль</Label>
            <Input type="password" {...register("password")} />
            {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Название компании</Label>
            <Input {...register("companyName")} />
            {errors.companyName ? (
              <p className="text-xs text-destructive">{errors.companyName.message}</p>
            ) : null}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register("terms")} />
            <span>Согласен с условиями демо-использования</span>
          </label>
          {errors.terms ? <p className="text-xs text-destructive">{errors.terms.message}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Зарегистрироваться
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-primary">
            Войти
          </Link>
        </p>
      </Card>
    </main>
  );
}
