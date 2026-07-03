"use client";

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
import { signUpOwner } from "@/lib/backend/auth";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  name: z.string().min(2, "Введите имя"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  companyName: z.string().min(2, "Введите название компании"),
  terms: z.boolean().refine(Boolean, "Нужно согласиться с условиями")
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAppStore((state) => state.registerUser);
  const addToast = useAppStore((state) => state.addToast);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      companyName: "",
      terms: false
    }
  });

  async function submit(values: FormValues) {
    try {
      const result = await signUpOwner(values);

      if (result.requiresEmailConfirmation) {
        addToast({
          title: "Проверьте email",
          description:
            "Подтвердите почту по ссылке из письма, затем войдите в аккаунт.",
          variant: "warning"
        });
        router.push("/login");
        return;
      }

      registerUser({
        name: values.name,
        email: values.email,
        companyName: values.companyName,
        companyId: result.companyId,
        ownerEmployeeId: result.ownerEmployeeId
      });

      addToast({
        title: "Аккаунт создан",
        description: "Компания создана в Supabase, осталось пройти настройку.",
        variant: "success"
      });
      router.push("/onboarding");
    } catch (error) {
      addToast({
        title: "Не удалось зарегистрироваться",
        description:
          error instanceof Error ? error.message : "Проверьте настройки Supabase и попробуйте снова.",
        variant: "error"
      });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex">
            <ProductLogo
              markClassName="h-8 w-8"
              wordmarkClassName="text-sm text-primary"
            />
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
            <span>
              Согласен с{" "}
              <Link href="/legal/terms" className="font-medium text-primary">
                условиями использования
              </Link>
              ,{" "}
              <Link href="/legal/privacy" className="font-medium text-primary">
                политикой конфиденциальности
              </Link>
              {" "}и{" "}
              <Link href="/legal/personal-data" className="font-medium text-primary">
                согласием на обработку персональных данных
              </Link>
            </span>
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
