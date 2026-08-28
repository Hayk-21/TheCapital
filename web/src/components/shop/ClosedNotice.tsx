"use client";

import { useContent } from "@/components/editor/ContentProvider";
import { formatHours } from "@/lib/hours";
import { useShopOpen } from "./useShopOpen";

/**
 * Плашка «сейчас заказы не принимаем».
 *
 * Каталог при этом открыт: гость может смотреть и набирать корзину — она
 * переживёт ночь в localStorage, а оформить заказ можно будет с открытия.
 */
export function ClosedNotice() {
  const { lang } = useContent();
  const { hours, open } = useShopOpen();
  if (open) return null;

  const t = (en: string, ru: string) => (lang === "ru" ? ru : en);

  return (
    <div className="cap-closed" role="status">
      <strong>{t("Orders are closed right now", "Сейчас заказы не принимаем")}</strong>
      <span>
        {t(
          `We take orders from ${formatHours(hours)}, Yerevan time. The catalogue stays open — collect your cart and place the order when we open.`,
          `Заказы принимаем с ${formatHours(hours)} по Еревану. Каталог открыт: соберите корзину, а оформить заказ можно будет с открытия.`,
        )}
      </span>
    </div>
  );
}
