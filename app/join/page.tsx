"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductLogo } from "@/components/layout/product-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  acceptEmployeeInvite,
  getEmployeeInvite,
  signInForInvite,
  signUpInvitedEmployee
} from "@/lib/backend/auth";
import { useAppStore } from "@/store/app-store";
import type { EmployeeInvite } from "@/types";

type Mode = "signup" | "signin";

export default function JoinPage() {
  const router = useRouter();
  const hydrateBackendWorkspace = useAppStore((state) => state.hydrateBackendWorkspace);
  const addToast = useAppStore((state) => state.addToast);
  const [token, setToken] = useState("");
  const [invite, setInvite] = useState<EmployeeInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const nextToken = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(nextToken);

    if (!nextToken) {
      setLoading(false);
      return;
    }

    getEmployeeInvite(nextToken)
      .then((result) => {
        setInvite(result);
        setName(result?.employeeName ?? "");
      })
      .catch((error) => {
        addToast({
          title: "Не удалось открыть приглашение",
          description: error instanceof Error ? error.message : "Проверьте ссылку.",
          variant: "error"
        });
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  async function acceptInvite() {
    const workspace = await acceptEmployeeInvite(token);
    if (!workspace) {
      throw new Error("Доступ принят, но рабочее пространство не загрузилось.");
    }

    hydrateBackendWorkspace(workspace);
    addToast({
      title: "Доступ подключен",
      description: "Открыт рабочий кабинет сотрудника.",
      variant: "success"
    });
    router.push("/dashboard");
  }

  async function submit() {
    if (!invite) {
      return;
    }

    if (!password || password.length < 6) {
      addToast({
        title: "Пароль слишком короткий",
        description: "Введите минимум 6 символов.",
        variant: "warning"
      });
      return;
    }

    if (mode === "signup" && name.trim().length < 2) {
      addToast({
        title: "Укажите имя",
        description: "Имя будет показано в рабочем пространстве.",
        variant: "warning"
      });
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const hasSession = await signUpInvitedEmployee({
          email: invite.email,
          name: name.trim(),
          password
        });

        if (!hasSession) {
          addToast({
            title: "Проверьте email",
            description: "Подтвердите регистрацию, затем вернитесь по этой ссылке и войдите.",
            variant: "warning"
          });
          setMode("signin");
          return;
        }
      } else {
        await signInForInvite(invite.email, password);
      }

      await acceptInvite();
    } catch (error) {
      addToast({
        title: mode === "signup" ? "Не удалось создать доступ" : "Не удалось войти",
        description: error instanceof Error ? error.message : "Проверьте email, пароль и срок действия приглашения.",
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inviteExpired = invite?.expiresAt ? new Date(invite.expiresAt).getTime() < Date.now() : false;
  const inviteUnavailable = !invite || invite.status !== "pending" || inviteExpired;

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
          <h1 className="mt-3 text-2xl font-semibold">Приглашение сотрудника</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Задайте пароль или войдите существующим паролем для этого email.
          </p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Загружаем приглашение...
          </div>
        ) : null}

        {!loading && inviteUnavailable ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Приглашение не найдено, уже использовано или срок действия истёк.
            </div>
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link href="/login">Перейти ко входу</Link>
            </Button>
          </div>
        ) : null}

        {!loading && invite && !inviteUnavailable ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium">{invite.companyName}</p>
              <p className="mt-1 text-muted-foreground">{invite.employeeName}</p>
              <p className="mt-1 text-muted-foreground">{invite.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "outline"}
                onClick={() => setMode("signup")}
              >
                Создать доступ
              </Button>
              <Button
                type="button"
                variant={mode === "signin" ? "default" : "outline"}
                onClick={() => setMode("signin")}
              >
                Уже есть пароль
              </Button>
            </div>

            {mode === "signup" ? (
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input readOnly value={invite.email} />
            </div>
            <div className="space-y-2">
              <Label>Пароль</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <Button type="button" className="w-full" disabled={submitting} onClick={submit}>
              {submitting ? "Подключаем..." : mode === "signup" ? "Создать доступ" : "Войти и принять приглашение"}
            </Button>
          </div>
        ) : null}
      </Card>
    </main>
  );
}
