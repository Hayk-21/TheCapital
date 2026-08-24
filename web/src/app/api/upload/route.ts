import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const MAX_BYTES = 12 * 1024 * 1024; // 12 МБ до обработки
const MAX_DIMENSION = 2400; // больше на сайте всё равно не показывается

/**
 * Приём картинки из редактора: жмём в webp и кладём в базу.
 *
 * Не на диск: контейнер на хостинге пересоздаётся при каждом деплое, и всё
 * загруженное пропадало бы. Отдаёт файлы обратно /api/media/<id>.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужно войти" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Это не картинка" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файл больше 12 МБ" }, { status: 413 });
  }

  const input = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  let width: number | null = null;
  let height: number | null = null;

  try {
    const pipeline = sharp(input, { animated: false }).rotate();
    const meta = await pipeline.metadata();

    const resized =
      (meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION
        ? pipeline.resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
          })
        : pipeline;

    const result = await resized.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    output = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch (err) {
    console.error("Не удалось обработать картинку:", err);
    return NextResponse.json({ error: "Повреждённый файл" }, { status: 422 });
  }

  const media = await db.media.create({
    data: {
      // Адрес отдачи известен только после создания записи, поэтому
      // сначала заводим её с заглушкой, следом проставляем настоящий путь.
      path: "",
      filename: file.name.slice(0, 200),
      mimeType: "image/webp",
      width,
      height,
      size: output.byteLength,
      data: new Uint8Array(output),
    },
    select: { id: true, width: true, height: true },
  });

  const updated = await db.media.update({
    where: { id: media.id },
    data: { path: `/api/media/${media.id}` },
    select: { id: true, path: true, width: true, height: true },
  });

  return NextResponse.json({
    id: updated.id,
    path: updated.path,
    width: updated.width,
    height: updated.height,
  });
}
