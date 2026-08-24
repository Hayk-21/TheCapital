import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Отдача картинки из базы.
 *
 * Файлы лежат в Postgres, а не на диске: контейнер на хостинге пересоздаётся
 * при каждом деплое и всё загруженное пропадало бы. Содержимое неизменяемо —
 * при замене фото создаётся новая запись с новым id, поэтому кешируем навсегда.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const media = await db.media.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });

  if (!media?.data) return new NextResponse("Не найдено", { status: 404 });

  return new NextResponse(Buffer.from(media.data), {
    headers: {
      "Content-Type": media.mimeType || "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
