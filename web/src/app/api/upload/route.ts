import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const MAX_BYTES = 12 * 1024 * 1024; // 12 МБ до обработки
const MAX_DIMENSION = 2400; // больше на сайте всё равно не показывается

/**
 * Приём картинки из редактора: жмём в webp, кладём в public/uploads
 * и заводим запись Media.
 *
 * При переезде в облако меняется только этот файл: вместо writeFile —
 * загрузка в хранилище, а в базу пишется его URL.
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

  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const filename = `${randomUUID()}.webp`;
  const relative = `/uploads/${folder}/${filename}`;
  const absolute = path.join(process.cwd(), "public", "uploads", folder, filename);

  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, output);

  const media = await db.media.create({
    data: {
      path: relative,
      filename: file.name.slice(0, 200),
      mimeType: "image/webp",
      width,
      height,
      size: output.byteLength,
    },
  });

  return NextResponse.json({
    id: media.id,
    path: media.path,
    width: media.width,
    height: media.height,
  });
}
