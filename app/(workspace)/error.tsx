"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/modules/empty-state";

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      icon="ShieldCheck"
      title="Что-то пошло не так"
      description="Это демонстрационное error-состояние. Попробуйте перезагрузить текущий раздел."
      actionLabel="Повторить"
      onAction={reset}
    />
  );
}
