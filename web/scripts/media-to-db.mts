/**
 * Перенос уже загруженных картинок с диска в базу.
 *
 * Записи Media ссылались на файлы в public/uploads, которых на сервере нет:
 * контейнер пересоздаётся при деплое. Скрипт читает файлы локально, кладёт
 * содержимое в базу и переписывает путь на /api/media/<id>.
 *
 *   npx tsx scripts/media-to-db.mts
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const list = await db.media.findMany({ select: { id: true, path: true, data: true } });
let moved = 0;
let missing = 0;

for (const m of list) {
  if (m.data) continue; // уже в базе
  const rel = m.path.replace(/^\//, "");
  const file = path.join(process.cwd(), "public", rel);
  try {
    const buf = await readFile(file);
    await db.media.update({
      where: { id: m.id },
      data: { data: new Uint8Array(buf), path: `/api/media/${m.id}` },
    });
    moved += 1;
    console.log(`перенесено: ${m.id} (${Math.round(buf.byteLength / 1024)} КБ)`);
  } catch {
    missing += 1;
    console.log(`файла нет на диске: ${m.path}`);
  }
}

console.log(`\nИтого: перенесено ${moved}, не найдено ${missing}, всего записей ${list.length}`);
await db.$disconnect();
