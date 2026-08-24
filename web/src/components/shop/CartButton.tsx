"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContent } from "@/components/editor/ContentProvider";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/view";

/**
 * Плавающая кнопка корзины: видна на всех страницах, пока в ней что-то есть.
 * На самой странице заказа прячется — там корзина и так перед глазами.
 */
export function CartButton() {
  const { lang, editing } = useContent();
  const { count, total, ready } = useCart();
  const pathname = usePathname() ?? "";

  if (!ready || count === 0 || editing) return null;
  if (pathname.endsWith("/order")) return null;

  return (
    <Link href={`/${lang}/order`} className="cap-cart-fab">
      <span>{lang === "ru" ? "Заказ" : "Order"}</span>
      <span className="cap-cart-fab-count">{count}</span>
      <span className="cap-cart-fab-total">{formatPrice(total, false, lang)}</span>
    </Link>
  );
}
