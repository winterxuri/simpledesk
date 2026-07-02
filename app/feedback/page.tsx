"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicSite } from "@/components/layout/public-site";
import { AppIcon } from "@/lib/icons";
import { useAppStore } from "@/store/app-store";

export default function FeedbackPage() {
  const addToast = useAppStore((state) => state.addToast);
  const [type, setType] = useState<"bug" | "idea">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");

  function submit() {
    if (!title.trim() || !description.trim()) {
      addToast({
        title: "Заполните обязательные поля",
        description: "Нужны заголовок и описание обращения.",
        variant: "warning"
      });
      return;
    }

    const saved = {
      type,
      title: title.trim(),
      description: description.trim(),
      contact: contact.trim(),
      createdAt: new Date().toISOString()
    };
    const current = JSON.parse(localStorage.getItem("simpledesk-feedback-drafts") ?? "[]") as unknown[];
    localStorage.setItem("simpledesk-feedback-drafts", JSON.stringify([saved, ...current].slice(0, 20)));

    setTitle("");
    setDescription("");
    setContact("");
    addToast({
      title: "Обращение сохранено",
      description: "Пока форма сохраняет обращение локально. Следующий шаг - подключить отправку в Telegram, email или Supabase.",
      variant: "success"
    });
  }

  return (
    <PublicSite>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[0.9fr_0.8fr] lg:items-center">
          <div>
            <Badge variant="secondary" className="gap-2">
              <AppIcon name="Send" className="h-4 w-4" />
              Обратная связь SimpleDesk
            </Badge>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-normal md:text-7xl">
              Сообщить о баге или идее без лишних шагов.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-muted-foreground">
              Используйте эту форму, если нашли проблему, хотите предложить
              улучшение или передать команде контекст по работе продукта.
            </p>
          </div>

          <Card className="p-6">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Перед отправкой</p>
            <div className="mt-5 space-y-3">
              {[
                "Короткий заголовок помогает быстрее понять проблему.",
                "В описании лучше указать, где именно это произошло и что ожидали увидеть.",
                "Контакт можно не оставлять, но с ним легче уточнить детали."
              ].map((text) => (
                <div key={text} className="rounded-lg border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
                  {text}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <Card className="p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <Label>Тип обращения</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={type === "bug" ? activeTypeClass : inactiveTypeClass}
                  onClick={() => setType("bug")}
                >
                  <AppIcon name="Bug" className="h-5 w-5" />
                  Баг
                </button>
                <button
                  type="button"
                  className={type === "idea" ? activeTypeClass : inactiveTypeClass}
                  onClick={() => setType("idea")}
                >
                  <AppIcon name="Lightbulb" className="h-5 w-5" />
                  Предложение
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Заголовок *</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Краткое описание проблемы или идеи"
              />
            </div>

            <div className="space-y-2">
              <Label>Описание *</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Подробно опишите проблему или ваше предложение..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Контакт <span className="text-muted-foreground">(опционально)</span></Label>
              <Input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Telegram, email или другой способ связи"
              />
            </div>

            <Button type="button" className="w-full" onClick={submit}>
              <AppIcon name="Send" className="h-4 w-4" />
              Отправить
            </Button>
          </div>
        </Card>
      </section>
    </PublicSite>
  );
}

const baseTypeClass = "flex h-14 items-center justify-center gap-3 rounded-lg border px-4 text-sm font-semibold transition-colors";
const activeTypeClass = `${baseTypeClass} border-primary bg-accent text-accent-foreground`;
const inactiveTypeClass = `${baseTypeClass} border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground`;
