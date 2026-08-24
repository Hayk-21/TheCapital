/**
 * Импорт каталога товаров из data/overpack-catalog.json.
 *
 * Идемпотентный: повторный запуск добавляет недостающее и обновляет цены,
 * не трогая то, что наредактировали руками (видимость, наличие, описания).
 * Пишет пачками — по одной записи 900 товаров заливаются минутами.
 *
 *   npx tsx scripts/import-catalog.mts [--hidden]
 *
 * --hidden заводит бренды скрытыми: пока не сверились с «Моим складом»,
 * показывать 890 вкусов, которых нет на полке, нельзя.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";

type Raw = {
  categories: Array<{
    key: string;
    brands: Array<{
      brand: string;
      products: Array<{ name: string; variants: Array<{ size: string | null; price: number }> }>;
    }>;
  }>;
};

const hidden = process.argv.includes("--hidden");
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const db = new PrismaClient({ adapter });

const raw: Raw = JSON.parse(await readFile("data/overpack-catalog.json", "utf8"));

/** «25» → «25 г» для табака, «25» → «25 мм» для угля. */
const sizeLabel = (size: string | null, category: string) =>
  !size ? "—" : category === "coal" ? `${size} мм` : `${size} г`;

// ── Бренды ───────────────────────────────────────────────────
// skipDuplicates в SQLite не поддерживается — отсеиваем уже заведённые сами.
const have = new Set(
  (await db.productBrand.findMany({ select: { category: true, name: true } })).map(
    (b) => `${b.category}:${b.name}`,
  ),
);
const wantBrands = raw.categories
  .flatMap((c) =>
    c.brands.map((b, i) => ({ category: c.key, name: b.brand, position: i, visible: !hidden })),
  )
  .filter((b) => !have.has(`${b.category}:${b.name}`));
if (wantBrands.length) await db.productBrand.createMany({ data: wantBrands });

const brands = await db.productBrand.findMany();
const brandId = new Map(brands.map((b) => [`${b.category}:${b.name}`, b.id]));

// ── Товары ───────────────────────────────────────────────────
const existingProducts = await db.product.findMany({ select: { id: true, brandId: true, name: true } });
const productKey = new Map(existingProducts.map((p) => [`${p.brandId}:${p.name}`, p.id]));

const newProducts: Array<{ brandId: string; name: string; position: number }> = [];
for (const c of raw.categories) {
  for (const b of c.brands) {
    const bid = brandId.get(`${c.key}:${b.brand}`)!;
    b.products.forEach((p, i) => {
      if (!productKey.has(`${bid}:${p.name}`)) newProducts.push({ brandId: bid, name: p.name, position: i });
    });
  }
}
if (newProducts.length) await db.product.createMany({ data: newProducts });

const allProducts = await db.product.findMany({ select: { id: true, brandId: true, name: true } });
const pid = new Map(allProducts.map((p) => [`${p.brandId}:${p.name}`, p.id]));

// ── Варианты ─────────────────────────────────────────────────
const existingVariants = await db.productVariant.findMany({
  select: { id: true, productId: true, size: true, price: true },
});
const variantKey = new Map(existingVariants.map((v) => [`${v.productId}:${v.size}`, v]));

const newVariants: Array<{ productId: string; size: string; price: number }> = [];
const priceFixes: Array<{ id: string; price: number }> = [];

for (const c of raw.categories) {
  for (const b of c.brands) {
    const bid = brandId.get(`${c.key}:${b.brand}`)!;
    for (const p of b.products) {
      const productId = pid.get(`${bid}:${p.name}`)!;
      for (const v of p.variants) {
        const size = sizeLabel(v.size, c.key);
        const has = variantKey.get(`${productId}:${size}`);
        if (!has) newVariants.push({ productId, size, price: v.price });
        else if (has.price !== v.price) priceFixes.push({ id: has.id, price: v.price });
      }
    }
  }
}
if (newVariants.length) await db.productVariant.createMany({ data: newVariants });
for (const f of priceFixes) {
  await db.productVariant.update({ where: { id: f.id }, data: { price: f.price } });
}

console.log(
  `Готово. Брендов: ${brands.length}. Товаров: ${allProducts.length} (+${newProducts.length}). ` +
    `Вариантов: ${existingVariants.length + newVariants.length} (+${newVariants.length}), цен обновлено: ${priceFixes.length}.` +
    (hidden ? " Новые бренды скрыты." : ""),
);
await db.$disconnect();
