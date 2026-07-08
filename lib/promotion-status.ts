import type { Promotion, PromotionStatus } from "@/types";

export type PromotionManualMode = "auto" | "draft" | "paused";

export function getPromotionManualMode(status: PromotionStatus): PromotionManualMode {
  if (status === "draft" || status === "paused") {
    return status;
  }
  return "auto";
}

export function resolvePromotionStatus({
  startDate,
  endDate,
  manualMode,
  today
}: {
  startDate?: string;
  endDate?: string;
  manualMode: PromotionManualMode;
  today: string;
}): PromotionStatus {
  if (manualMode === "draft" || manualMode === "paused") {
    return manualMode;
  }

  if (!startDate || !endDate) {
    return "draft";
  }

  if (today < startDate) {
    return "scheduled";
  }

  if (today > endDate) {
    return "finished";
  }

  return daysBetween(today, endDate) <= 3 ? "ending" : "active";
}

export function getPromotionDisplayStatus(promotion: Promotion, today: string) {
  if (!promotion.startDate || !promotion.endDate) {
    return promotion.status;
  }

  return resolvePromotionStatus({
    startDate: promotion.startDate,
    endDate: promotion.endDate,
    manualMode: getPromotionManualMode(promotion.status),
    today
  });
}

function daysBetween(start: string, end: string) {
  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T00:00:00`).getTime();
  return Math.round((endTime - startTime) / 86_400_000);
}
