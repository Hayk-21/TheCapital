"use client";

import Link from "next/link";
import { useContent } from "@/components/editor/ContentProvider";
import { formatPrice } from "@/lib/view";
import type { NewsItem } from "@/lib/news";

/**
 * Блок «Новинки» — карточки того, что недавно привезли.
 *
 * Стоит в начале витрины и в начале меню: гость кафе видит на той же
 * странице, что появилось в продаже, и уходит по ссылке в магазин.
 */
export function NewsSection({ news }: { news: NewsItem[] }) {
  const { lang } = useContent();
  if (news.length === 0) return null;

  const t = (en: string, ru: string) => (lang === "ru" ? ru : en);

  return (
    <section className="cap-shop-section cap-news-section">
      <div className="cap-news-head">
        <h2 className="cap-news-title">{t("Just arrived", "Новинки")}</h2>
        <span className="cap-news-sub">
          {t("What we got in recently", "Что недавно появилось у нас")}
        </span>
      </div>

      <div className="cap-news-grid">
        {news.map((n) => {
          const discount = n.oldPrice != null && n.price != null && n.oldPrice > n.price;
          return (
            <Link key={`${n.kind}:${n.id}`} href={`/${lang}/shop`} className="cap-news-card">
              {n.logo && (
                <span className="cap-brand-logo">
                  <img src={n.logo} alt={n.brand} loading="lazy" decoding="async" />
                </span>
              )}

              <span className="cap-news-name">{n.name ?? n.brand}</span>
              {n.name && <span className="cap-news-brand">{n.brand}</span>}

              <span className="cap-news-tags">
                <span className="cap-tag">{t("new", "новинка")}</span>
                {discount && <span className="cap-tag" data-kind="sale">{t("sale", "скидка")}</span>}
              </span>

              {n.price != null && (
                <span className="cap-news-price">
                  {discount && (
                    <s className="cap-price-old">{formatPrice(n.oldPrice, false, lang)}</s>
                  )}
                  {formatPrice(n.price, n.kind === "brand", lang)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
