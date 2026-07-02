import type { DemoData } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function buildAIResponse(prompt: string, data: DemoData) {
  const lowStock = data.products.filter((product) =>
    ["low", "critical", "out"].includes(product.status)
  );
  const overdueTasks = data.tasks.filter((task) => task.status === "overdue");
  const inactiveClients = data.clients.filter((client) =>
    ["inactive", "attention"].includes(client.status)
  );
  const income = data.financialOperations
    .filter((operation) => operation.type === "income")
    .reduce((sum, operation) => sum + operation.amount, 0);
  const expenses = data.financialOperations
    .filter((operation) => operation.type === "expense")
    .reduce((sum, operation) => sum + operation.amount, 0);
  const bestPromotion = [...data.promotions].sort(
    (a, b) => b.efficiency - a.efficiency
  )[0];

  const normalized = prompt.toLowerCase();

  if (normalized.includes("товар") || normalized.includes("законч")) {
    return {
      content: `${lowStock.length} позиций требуют закупки. Самые срочные: ${lowStock
        .slice(0, 3)
        .map((product) => product.name)
        .join(", ")}.`,
      metrics: [
        `${lowStock.length} позиций ниже нормы`,
        `${data.products.filter((product) => product.status === "out").length} позиций отсутствуют`
      ],
      recommendations: [
        "Сформировать закупку по критическим остаткам",
        "Проверить минимальные остатки для часто используемых позиций"
      ],
      actions: ["Подготовить список закупки", "Открыть остатки"]
    };
  }

  if (normalized.includes("акци")) {
    return {
      content: `Самая эффективная акция: "${bestPromotion.name}" с эффективностью ${bestPromotion.efficiency}% и выручкой ${formatCurrency(bestPromotion.revenue)}.`,
      metrics: [
        `${bestPromotion.usageCount} использований`,
        `${bestPromotion.newClients} новых клиентов`
      ],
      recommendations: [
        "Продлить кампанию для похожей аудитории",
        "Подготовить сегмент клиентов для повторного предложения"
      ],
      actions: ["Открыть акции", "Создать задачу"]
    };
  }

  if (normalized.includes("выруч") || normalized.includes("отчет")) {
    return {
      content: `За последние 30 дней выручка составила ${formatCurrency(
        income
      )}. Расходы: ${formatCurrency(expenses)}. Основной рост дают повторные клиенты и услуги с высоким средним чеком.`,
      metrics: [
        `Выручка: ${formatCurrency(income)}`,
        `Расходы: ${formatCurrency(expenses)}`,
        `Прибыль: ${formatCurrency(income - expenses)}`
      ],
      recommendations: [
        "Усилить работу с повторными клиентами",
        "Проверить дни с низкой загрузкой сотрудников"
      ],
      actions: ["Посмотреть отчет", "Подготовить рассылку"]
    };
  }

  if (normalized.includes("клиент")) {
    return {
      content: `${inactiveClients.length} клиентов давно не возвращались или требуют внимания. У 12 клиентов типичный интервал возврата 30-40 дней уже прошел.`,
      metrics: [
        `${inactiveClients.length} клиентов в зоне риска`,
        `${data.clients.filter((client) => client.status === "loyal").length} постоянных клиентов`
      ],
      recommendations: [
        "Сделать персональное предложение",
        "Создать задачу администратору на обзвон"
      ],
      actions: ["Открыть список клиентов", "Подготовить рассылку"]
    };
  }

  return {
    content: `Сегодня внимания требуют ${lowStock.length} позиций склада, ${overdueTasks.length} просроченные задачи и ${inactiveClients.length} клиентов без повторного обращения.`,
    metrics: [
      `${data.appointments.length} записей и заказов в базе`,
      `${overdueTasks.length} просроченные задачи`,
      `${lowStock.length} складских предупреждений`
    ],
    recommendations: [
      "Начать с подтверждения ближайших записей",
      "Сформировать закупку по критическим остаткам",
      "Подготовить предложение клиентам без повторного визита"
    ],
    actions: ["Создать задачу", "Открыть клиентов", "Подготовить список закупки"]
  };
}
