"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { buildAIResponse } from "@/lib/mock-ai";
import { useAppStore } from "@/store/app-store";
import type { AIMessage } from "@/types";

const quickPrompts = [
  "Что требует моего внимания сегодня?",
  "Какие товары скоро закончатся?",
  "Какие клиенты давно не возвращались?",
  "Какая акция самая эффективная?"
];

export function AIAssistantPanel() {
  const open = useAppStore((state) => state.aiPanelOpen);
  const setOpen = useAppStore((state) => state.setAiPanelOpen);
  const data = useAppStore((state) => state.data);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "ai-welcome",
      role: "assistant",
      content:
        "Я могу подсказать, что требует внимания, какие клиенты давно не возвращались и какие товары пора заказать.",
      createdAt: new Date().toISOString()
    }
  ]);

  function ask(prompt: string) {
    const response = buildAIResponse(prompt, data);
    const now = new Date().toISOString();
    setMessages((current) => [
      ...current,
      { id: `user-${now}`, role: "user", content: prompt, createdAt: now },
      {
        id: `ai-${now}`,
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
    <Drawer
      open={open}
      onOpenChange={setOpen}
      title="AI-помощник"
      description="Ответы строятся на демонстрационных данных текущей компании."
    >
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => ask(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
      <div className="mt-5 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-lg bg-primary p-3 text-sm text-primary-foreground"
                : "max-w-[92%] rounded-lg border border-border bg-background p-4 text-sm"
            }
          >
            <p>{message.content}</p>
            {message.metrics?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.metrics.map((metric) => (
                  <Badge key={metric} variant="secondary">
                    {metric}
                  </Badge>
                ))}
              </div>
            ) : null}
            {message.recommendations?.length ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-muted-foreground">
                {message.recommendations.map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
              </ul>
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
      <div className="sticky bottom-0 mt-5 border-t border-border bg-card pt-4">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (input.trim()) {
              ask(input.trim());
            }
          }}
        >
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Спросите о клиентах, складе или выручке"
          />
          <Button type="submit" size="icon" aria-label="Отправить">
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          AI использует только данные, доступные вашему аккаунту в системе.
          Изменения требуют подтверждения пользователя.
        </p>
      </div>
    </Drawer>
  );
}
