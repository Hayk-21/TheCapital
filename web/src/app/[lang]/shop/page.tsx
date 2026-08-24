import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { ShopView } from "@/components/shop/ShopView";
import { db } from "@/lib/db";
import { preparePage, type RouteParams, type RouteSearch } from "@/lib/page-setup";

export const metadata: Metadata = {
  title: "Наши дистрибуции — The Capital",
  description: "Кальянный табак и угли с доставкой по Еревану.",
};

export default async function ShopPage(props: RouteParams & RouteSearch) {
  // Контент берём со страницы «Контакты»: оттуда телефон и подвал.
  const [{ content, lang, canEdit, editing }, brands] = await Promise.all([
    preparePage("visit", props),
    db.productBrand.findMany({
      where: { visible: true },
      orderBy: [{ category: "asc" }, { position: "asc" }],
      include: {
        products: {
          where: { visible: true },
          orderBy: { position: "asc" },
          include: { variants: { orderBy: { price: "asc" } } },
        },
      },
    }),
  ]);

  return (
    <SiteShell content={content} lang={lang} canEdit={canEdit} editing={editing}>
      <ShopView
        brands={brands.map((b) => ({
          id: b.id,
          category: b.category,
          name: b.name,
          products: b.products.map((p) => ({
            id: p.id,
            name: p.name,
            variants: p.variants.map((v) => ({
              id: v.id,
              size: v.size,
              price: v.price,
              inStock: v.inStock,
            })),
          })),
        }))}
      />
    </SiteShell>
  );
}
