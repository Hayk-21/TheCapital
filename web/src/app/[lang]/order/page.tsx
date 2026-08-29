import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { OrderView } from "@/components/shop/OrderView";
import { AgeGate } from "@/components/shop/AgeGate";
import { preparePage, type RouteParams, type RouteSearch } from "@/lib/page-setup";

export const metadata: Metadata = {
  title: "Заказ — The Capital",
  robots: { index: false },
};

/** Страница корзины и оформления. Контент берём из «Контактов»: там телефон и подвал. */
export default async function OrderPage(props: RouteParams & RouteSearch) {
  const { content, lang, canEdit, editing, news } = await preparePage("visit", props);

  return (
    <SiteShell content={content} lang={lang} canEdit={canEdit} editing={editing} news={news}>
      <AgeGate>
        <OrderView />
      </AgeGate>
    </SiteShell>
  );
}
