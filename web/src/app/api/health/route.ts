import { NextResponse } from "next/server";

/**
 * Проверка живости для Railway.
 *
 * Намеренно не трогает базу: healthcheck должен отвечать сразу после старта
 * процесса, иначе платформа сочтёт деплой неудачным и откатится на прошлый.
 * Доступность базы видно по самим страницам.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true });
}
