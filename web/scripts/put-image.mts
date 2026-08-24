/**
 * Заливка картинки в слот из командной строки, минуя админку.
 *
 * Делает ровно то же, что src/app/api/upload/route.ts — жмёт в webp, кладёт
 * в public/uploads, заводит Media — плюс сразу привязывает к ImageSlot.
 * Удобно для первичного наполнения; дальше картинки меняются в админке.
 *
 *   npx tsx scripts/put-image.ts <файл> <ключ-слота> [focalX] [focalY]
 */
import "dotenv/config";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";

const MAX_DIMENSION = 2400;

const [source, slotKey, focalX, focalY] = process.argv.slice(2);
if (!source || !slotKey) {
  console.error("нужно: put-image.ts <файл> <ключ-слота> [focalX] [focalY]");
  process.exit(1);
}

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const db = new PrismaClient({ adapter });

const input = await readFile(source);
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

const now = new Date();
const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
const filename = `${randomUUID()}.webp`;
const relative = `/uploads/${folder}/${filename}`;
const absolute = path.join(process.cwd(), "public", "uploads", folder, filename);

await mkdir(path.dirname(absolute), { recursive: true });
await writeFile(absolute, result.data);

const media = await db.media.create({
  data: {
    path: relative,
    filename: path.basename(source).slice(0, 200),
    mimeType: "image/webp",
    width: result.info.width,
    height: result.info.height,
    size: result.data.byteLength,
  },
});

await db.imageSlot.upsert({
  where: { key: slotKey },
  update: {
    mediaId: media.id,
    focalX: focalX ? Number(focalX) : 50,
    focalY: focalY ? Number(focalY) : 50,
  },
  create: {
    key: slotKey,
    mediaId: media.id,
    focalX: focalX ? Number(focalX) : 50,
    focalY: focalY ? Number(focalY) : 50,
  },
});

console.log(
  `${slotKey} <- ${path.basename(source)} -> ${relative} ` +
    `(${result.info.width}x${result.info.height}, ${Math.round(result.data.byteLength / 1024)} KB)`,
);

await db.$disconnect();
