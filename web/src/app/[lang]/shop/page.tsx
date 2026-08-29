import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { ShopView } from "@/components/shop/ShopView";
import { AgeGate } from "@/components/shop/AgeGate";
import { db } from "@/lib/db";
import { preparePage, type RouteParams, type RouteSearch } from "@/lib/page-setup";

export const metadata: Metadata = {
  title: "Наши дистрибуции — The Capital",
  description: "Кальянный табак и угли с доставкой по Еревану.",
};

export default async function ShopPage(props: RouteParams & RouteSearch) {
  // Контент берём со страницы «Контакты»: оттуда телефон и подвал.
  const setup = await preparePage("shop", props);
  const { content, lang, canEdit, editing, news } = setup;

  const categories = await db.productCategory.findMany({
    where: editing ? {} : { visible: true },
    orderBy: { position: "asc" },
  });

  // В режиме правки показываем и скрытые бренды: иначе их не вернуть на сайт.
  const brands = await db.productBrand.findMany({
      where: editing ? {} : { visible: true },
      orderBy: [{ category: "asc" }, { position: "asc" }],
      include: {
        products: {
          where: editing ? {} : { visible: true },
          orderBy: { position: "asc" },
          include: { variants: { orderBy: { price: "asc" } } },
        },
      },
  });

  return (
    <SiteShell content={content} lang={lang} canEdit={canEdit} editing={editing} news={news}>
      {/* Табак продаём только взрослым: до подтверждения витрина под шторкой. */}
      <AgeGate>
        <ShopView
          news={news}
          categories={categories.map((c) => ({
            key: c.key,
            title: { en: c.titleEn, ru: c.titleRu },
            visible: c.visible,
          }))}
          brands={brands.map((b) => ({
            id: b.id,
            category: b.category,
            name: b.name,
            visible: b.visible,
            isNew: b.isNew,
            products: b.products.map((p) => ({
              id: p.id,
              name: p.name,
              isNew: p.isNew,
              variants: p.variants.map((v) => ({
                id: v.id,
                size: v.size,
                price: v.price,
                oldPrice: v.oldPrice,
                inStock: v.inStock,
              })),
            })),
          }))}
        />
      </AgeGate>
    </SiteShell>
  );
}
