import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BrandsTable } from "@/components/admin/BrandsTable";

export const metadata: Metadata = { title: "Магазин — The Capital" };

export default async function ShopAdminPage() {
  const brands = await db.productBrand.findMany({
    orderBy: [{ category: "asc" }, { position: "asc" }],
    include: { products: { include: { variants: true } } },
  });

  return (
    <>
      <h1 className="adm-title">Магазин</h1>
      <p className="adm-sub">
        Бренды и позиции страницы «Наши дистрибуции». Скрытый бренд пропадает
        с сайта вместе со всеми своими позициями.
      </p>

      <BrandsTable
        brands={brands.map((b) => ({
          id: b.id,
          category: b.category,
          name: b.name,
          visible: b.visible,
          products: b.products.length,
          variants: b.products.reduce((n, p) => n + p.variants.length, 0),
          hidden: b.products.filter((p) => !p.visible).length,
        }))}
      />
    </>
  );
}
