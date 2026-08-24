/**
 * Перенос картинок из старой локальной базы SQLite в Postgres.
 *
 * Сами файлы лежат в public/uploads и никуда не переезжают — переносятся
 * только записи Media и привязки слотов с кадрированием. Разовый скрипт,
 * нужен только при переезде; после него можно удалить.
 *
 *   npx tsx scripts/migrate-media.mts [путь-к-dev.db]
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const source = process.argv[2] ?? "dev.db";
const old = new Database(source, { readonly: true });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

type OldMedia = {
  id: string; path: string; filename: string; mimeType: string;
  width: number | null; height: number | null; size: number;
  altEn: string | null; altRu: string | null;
};
type OldSlot = {
  key: string; mediaId: string | null; fit: string;
  focalX: number; focalY: number; scale: number; placeholder: string | null;
};

const media = old.prepare("select * from Media").all() as OldMedia[];
const slots = (old.prepare("select * from ImageSlot").all() as OldSlot[]).filter((s) => s.mediaId);

for (const m of media) {
  await db.media.upsert({
    where: { id: m.id },
    update: {},
    create: {
      id: m.id, path: m.path, filename: m.filename, mimeType: m.mimeType,
      width: m.width, height: m.height, size: m.size, altEn: m.altEn, altRu: m.altRu,
    },
  });
}

for (const s of slots) {
  await db.imageSlot.upsert({
    where: { key: s.key },
    update: { mediaId: s.mediaId, fit: s.fit, focalX: s.focalX, focalY: s.focalY, scale: s.scale },
    create: {
      key: s.key, mediaId: s.mediaId, fit: s.fit,
      focalX: s.focalX, focalY: s.focalY, scale: s.scale, placeholder: s.placeholder,
    },
  });
}

console.log(`Перенесено: картинок ${media.length}, слотов с фото ${slots.length}`);
await db.$disconnect();
