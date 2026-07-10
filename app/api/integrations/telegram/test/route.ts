import { request as httpsRequest } from "node:https";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TelegramResponse = { ok: boolean; description?: string };

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Войдите в рабочий аккаунт." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("company_members")
    .select("role, companies(name)")
    .eq("user_id", userData.user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      { error: "Тестировать интеграции может только владелец компании." },
      { status: 403 }
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "На сервере не задан TELEGRAM_BOT_TOKEN." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const chatId =
    typeof body === "object" && body !== null && "chatId" in body
      ? String(body.chatId).trim()
      : "";

  if (!/^(@[A-Za-z][A-Za-z0-9_]{4,31}|-?\d{5,20})$/.test(chatId)) {
    return NextResponse.json(
      { error: "Укажите корректный Chat ID или публичный канал в формате @channel." },
      { status: 400 }
    );
  }

  const companies = membership.companies;
  const company = Array.isArray(companies) ? companies[0] : companies;
  const companyName = company?.name ?? "Компания";

  try {
    const result = await sendTelegramMessage(token, {
        chat_id: chatId,
        text: `SimpleDesk: тестовая интеграция подключена для компании «${companyName}».`,
        disable_web_page_preview: true
    });

    if (!result.ok) {
      return NextResponse.json({ error: getTelegramErrorMessage(result.description) }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "TELEGRAM_TIMEOUT"
        ? "Telegram не ответил за 10 секунд. Повторите тест."
        : "Не удалось соединиться с Telegram. Проверьте интернет и повторите тест.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function sendTelegramMessage(token: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  return new Promise<TelegramResponse>((resolve, reject) => {
    const telegramRequest = httpsRequest(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/sendMessage`,
        method: "POST",
        family: 4,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        },
        timeout: 10_000
      },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          try {
            resolve(JSON.parse(responseBody) as TelegramResponse);
          } catch {
            reject(new Error("TELEGRAM_INVALID_RESPONSE"));
          }
        });
      }
    );

    telegramRequest.on("timeout", () => {
      telegramRequest.destroy(new Error("TELEGRAM_TIMEOUT"));
    });
    telegramRequest.on("error", reject);
    telegramRequest.end(body);
  });
}

function getTelegramErrorMessage(description?: string) {
  const normalized = description?.toLowerCase() ?? "";

  if (normalized.includes("chat not found")) {
    return "Telegram не нашёл чат. Сначала напишите боту /start, затем проверьте Chat ID.";
  }
  if (normalized.includes("bot was blocked")) {
    return "Бот заблокирован в этом чате. Разблокируйте его и повторите тест.";
  }
  if (normalized.includes("not enough rights") || normalized.includes("administrator rights")) {
    return "У бота недостаточно прав для отправки сообщений в этот канал или группу.";
  }
  if (normalized.includes("unauthorized")) {
    return "Telegram отклонил Bot Token. Создайте новый токен через BotFather.";
  }

  return description
    ? `Telegram отклонил запрос: ${description}`
    : "Telegram отклонил запрос без описания ошибки.";
}
