"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/modules/page-header";
import { buildAIResponse } from "@/lib/mock-ai";
import { useAppStore } from "@/store/app-store";
import type { AIMessage } from "@/types";

const prompts = [
  "Что требует моего внимания сегодня?",
  "Какие товары скоро закончатся?",
  "Какие клиенты давно не возвращались?",
  "Какая акция самая эффективная?",
  "Почему снизилась выручка?",
  "У кого из сотрудников низкая загрузка?",
  "Составь отчёт за неделю",
  "Подготовь список закупки"
];

export default function AIAssistantPage() {
  const data = useAppStore((state) => state.data);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Готов анализировать клиентов, записи, остатки, задачи, акции и финансы текущей компании.",
      createdAt: new Date().toISOString()
    }
  ]);

  function ask(prompt: string) {
    const response = buildAIResponse(prompt, data);
    const now = new Date().toISOString();
    setMessages((current) => [
      ...current,
      { id: `u-${now}`, role: "user", content: prompt, createdAt: now },
      {
        id: `a-${now}`,
        role: "assistant",
        content: response.content,
        metrics: response.metrics,
        recommendations: response.recommendations,
        actions: response.actions,
        createdAt: now
      }
    ]);
    setInput("");
  }

  return (
    <div>
      <PageHeader
        title="AI-помощник"
        description="Mock-AI визуально работает только с локальными данными текущей компании."
      />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="p-5">
          <h2 className="font-semibold">Быстрые запросы</h2>
          <div className="mt-4 grid gap-2">
            {prompts.map((prompt) => (
              <Button key={prompt} type="button" variant="outline" className="justify-start text-left" onClick={() => ask(prompt)}>
                {prompt}
              </Button>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            AI использует только данные, доступные вашему аккаунту в системе.
            Любое изменение данных требует подтверждения пользователя.
          </p>
        </Card>
        <Card className="flex min-h-[640px] flex-col p-5">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[80%] rounded-lg bg-primary p-3 text-sm text-primary-foreground"
                    : "max-w-[86%] rounded-lg border border-border bg-background p-4 text-sm"
                }
              >
                <p>{message.content}</p>
                {message.metrics?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.metrics.map((metric) => (
                      <Badge key={metric} variant="secondary">{metric}</Badge>
                    ))}
                  </div>
                ) : null}
                {message.recommendations?.length ? (
                  <div className="mt-3">
                    <p className="font-medium">Рекомендации</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                      {message.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
                    </ul>
                  </div>
                ) : null}
                {message.actions?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.actions.map((action) => (
                      <Button key={action} type="button" variant="secondary" size="sm">
                        {action}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <form
            className="mt-5 flex gap-2 border-t border-border pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (input.trim()) ask(input.trim());
            }}
          >
            <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Напишите вопрос по данным компании" />
            <Button type="submit" size="icon" aria-label="Отправить">
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
