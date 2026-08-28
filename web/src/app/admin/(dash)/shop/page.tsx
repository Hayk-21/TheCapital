import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BrandsTable } from "@/components/admin/BrandsTable";

export const metadata: Metadata = { title: "Магазин — The Capital" };

export default async function ShopAdminPage() {
  const categories = await db.productCategory.findMany({ orderBy: { position: "asc" } });
  const brands = await db.productBrand.findMany({
    orderBy: [{ category: "asc" }, { position: "asc" }],
    include: { products: { include: { variants: true } } },
  });

  // Логотипы лежат в обычных слотах картинок — тех же, что правятся на витрине.
  const logoSlots = await db.imageSlot.findMany({
    where: { key: { in: brands.map((b) => `shop.brand.${b.id}`) } },
    include: { media: { select: { path: true } } },
  });
  const logos = new Map(logoSlots.map((s) => [s.key, s.media?.path ?? null]));

  return (
    <>
      <h1 className="adm-title">Магазин</h1>
      <p className="adm-sub">
        Бренды и позиции страницы «Наши дистрибуции». Скрытый бренд пропадает
        с сайта вместе со всеми своими позициями. Логотип показывается на плитке
        бренда в магазине.
      </p>

      <BrandsTable
        categories={categories.map((c) => ({ key: c.key, title: c.titleRu }))}
        brands={brands.map((b) => ({
          id: b.id,
          category: b.category,
          name: b.name,
          visible: b.visible,
          products: b.products.length,
          variants: b.products.reduce((n, p) => n + p.variants.length, 0),
          hidden: b.products.filter((p) => !p.visible).length,
          logo: logos.get(`shop.brand.${b.id}`) ?? null,
        }))}
      />
    </>
  );
}
