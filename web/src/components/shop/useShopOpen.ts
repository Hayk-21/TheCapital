"use client";

import { useEffect, useState } from "react";
import { useContent } from "@/components/editor/ContentProvider";
import { isShopOpen, shopHours, type ShopHours } from "@/lib/hours";

/**
 * Открыт ли магазин прямо сейчас — для витрины и корзины.
 *
 * Часы приходят из настроек вместе с остальным контентом, так что первый
 * рендер уже знает ответ. Дальше пересчитываем по таймеру: гость может
 * держать страницу открытой и в момент закрытия, и в момент открытия.
 */
export function useShopOpen(): { hours: ShopHours; open: boolean } {
  const { content } = useContent();
  const hours = shopHours(content.settings);
  const [open, setOpen] = useState(() => isShopOpen(hours));

  useEffect(() => {
    const tick = () => setOpen(isShopOpen({ from: hours.from, to: hours.to }));
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, [hours.from, hours.to]);

  return { hours, open };
}
