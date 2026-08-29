/**
 * Заливка логотипов брендов в слоты витрины.
 *
 * Каталог The Capital повторяет ассортимент дистрибьютора Overpack, и там же
 * лежат готовые фирменные плашки брендов. Скрипт скачивает их, жмёт в webp и
 * кладёт в слот `shop.brand.<id>` — тот самый, что правится в админке и на
 * витрине. Картинка попадает в базу (Media.data), а не на диск: контейнер на
 * Railway пересоздаётся при каждом деплое.
 *
 * Углы плашек скругляются маской: у части логотипов за скруглением лежит не
 * прозрачность, а белый фон, и на тёмной витрине он вылезал белыми уголками.
 *
 * Бренд ищется по имени, как оно заведено у нас. Не нашёлся — строка
 * пропускается с предупреждением, остальные заливаются.
 *
 *   npx tsx scripts/import-brand-logos.mts          # только без логотипа
 *   npx tsx scripts/import-brand-logos.mts --force  # перезалить все
 */
import "dotenv/config";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const CDN = "https://cdn.overpack.am/overpack/images";

/** Имя бренда у нас → файл плашки у дистрибьютора. */
const LOGOS: Record<string, string> = {
  "Black Burn": "2025-9-3/xaAgz175752936181712221.png",
  Darkside: "2025-9-2/YfaEA1758641360574.png",
  Musthave: "2025-9-2/zYjrO1758641360879.png",
  Sabotage: "2025-9-2/eyxpE1758641361234.png",
  SWAG: "2026-8-0/oYAse1786281013574.png",
  "Sarma Classic": "2025-9-2/SWDLm1758641361632.png",
  HIT: "2025-9-2/lLPgv1758641360721.png",
  Overdose: "2025-9-2/qaxgO1758641361044.png",
  Shot: "2025-9-2/rsDBv1758641362100.png",
  "Sarma Light": "2025-9-2/ZKAmN1758641361799.png",
  Starline: "2025-9-2/EIXIS1758641362240.png",
  База: "2025-12-0/iWfNp1766942763553.png",
  "Sarma Strong": "2025-9-2/PaYIu1758641361973.png",
  Sapphire: "2025-9-5/uAnlS1758902772227.png",
  Xperience: "2025-9-2/ueVHY1758641362363.png",
  Догма: "2025-12-0/XSKeC1766942908162.png",
  Северный: "2025-9-5/uoXRI1758902772787.png",
  "Nаш": "2025-12-0/IVeAN1766942707330.png",
  Macbellzy: "2026-1-1/cMFIs1768182322490.png",
  Palitra: "2026-3-2/cALAx1772524580485.png",
};

// Плашка на карточке показывается шириной в пару сотен пикселей; 640 хватает
// и на ретину, и на страницу бренда, где логотип крупнее.
const MAX_WIDTH = 640;

// Доля высоты, которую занимает скругление у фирменных плашек: замерено по
// углам исходников — тёмный пиксель начинается примерно на 16% высоты.
const CORNER = 0.16;

/**
 * Готовит плашку к тёмной витрине.
 *
 * У части исходников за скруглением лежит не прозрачность, а белый фон.
 * Сначала срезаем однородные поля по краям (`trim`), потом режем углы маской,
 * и маска берётся на пару пикселей уже картинки: ровно по краю от белого
 * остаётся полупрозрачная кромка сглаживания, и она светилась на тёмном фоне.
 */
async function roundCorners(input: Buffer) {
  const prepared = sharp(input).ensureAlpha();

  // trim ориентируется на цвет углового пикселя: у белых плашек уберёт белые
  // поля, у прозрачных — прозрачные. Однородного поля нет — вернёт как есть.
  let trimmed: Buffer;
  try {
    trimmed = await prepared.clone().trim({ threshold: 12 }).toBuffer();
  } catch {
    trimmed = await prepared.clone().toBuffer();
  }

  const flat = await sharp(trimmed)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = flat.info;
  const r = Math.round(height * CORNER);
  const inset = Math.max(1, Math.round(height * 0.012));
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}">` +
      `<rect x="${inset}" y="${inset}" width="${width - inset * 2}" ` +
      `height="${height - inset * 2}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
  );

  return sharp(flat.data)
    .composite([{ input: mask, blend: "dest-in" }])
    .webp({ quality: 88, alphaQuality: 100 })
    .toBuffer({ resolveWithObject: true });
}

const force = process.argv.includes("--force");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Часть имён приехала из выгрузки в разложенном виде («и» + знак краткости),
// поэтому сравниваем нормализованные строки, иначе «Северный» не находится.
const key = (name: string) => name.normalize("NFC").toLowerCase();

const brands = await db.productBrand.findMany({ select: { id: true, name: true } });
const byName = new Map(brands.map((b) => [key(b.name), b]));

let done = 0;
let skipped = 0;

for (const [name, file] of Object.entries(LOGOS)) {
  const brand = byName.get(key(name));
  if (!brand) {
    console.warn(`— бренда «${name}» нет в базе, пропускаю`);
    skipped += 1;
    continue;
  }

  const slotKey = `shop.brand.${brand.id}`;
  const existing = await db.imageSlot.findUnique({ where: { key: slotKey } });
  if (existing?.mediaId && !force) {
    console.log(`= ${name}: логотип уже стоит`);
    skipped += 1;
    continue;
  }

  const res = await fetch(`${CDN}/${file}`, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) {
    console.warn(`— ${name}: ${res.status} ${res.statusText}`);
    skipped += 1;
    continue;
  }

  const input = Buffer.from(await res.arrayBuffer());
  const out = await roundCorners(input);

  const media = await db.media.create({
    data: {
      path: "",
      filename: `${name}.webp`,
      mimeType: "image/webp",
      width: out.info.width,
      height: out.info.height,
      size: out.data.byteLength,
      data: new Uint8Array(out.data),
      altEn: `${name} logo`,
      altRu: `Логотип ${name}`,
    },
    select: { id: true },
  });
  await db.media.update({ where: { id: media.id }, data: { path: `/api/media/${media.id}` } });

  // Логотип должен быть виден целиком — вписываем, а не заполняем рамку.
  await db.imageSlot.upsert({
    where: { key: slotKey },
    update: { mediaId: media.id, fit: "contain" },
    create: { key: slotKey, mediaId: media.id, fit: "contain" },
  });

  // Отдача картинок кеширует навсегда, поэтому замена — это всегда новая
  // запись. Прежнюю убираем, если на неё больше никто не смотрит: иначе
  // каждая перезаливка оставляла бы в медиатеке по копии логотипа.
  if (existing?.mediaId) {
    const used = await db.imageSlot.count({ where: { mediaId: existing.mediaId } });
    if (used === 0) await db.media.delete({ where: { id: existing.mediaId } });
  }

  console.log(
    `+ ${name}: ${out.info.width}x${out.info.height}, ${Math.round(out.data.byteLength / 1024)} КБ`,
  );
  done += 1;
}

console.log(`\nготово: ${done}, пропущено: ${skipped}`);
await db.$disconnect();
