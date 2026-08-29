"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useContent } from "@/components/editor/ContentProvider";
import type { NewsItem } from "@/lib/news";

/**
 * Полоса над шапкой: «привезли новое».
 *
 * Висит на всех страницах, потому что про новинку должен узнать и тот, кто
 * зашёл почитать про кальянную, а не в магазин. Показываем плашки брендов —
 * гость узнаёт линейку по знаку раньше, чем прочитает название.
 *
 * Гость может закрыть полосу — запоминаем это до следующей новинки: ключ
 * включает состав, поэтому новый товар полосу вернёт, а уже закрытую не
 * покажет повторно.
 */
export function NewsBar({ news }: { news: NewsItem[] }) {
  const { lang } = useContent();
  const [hidden, setHidden] = useState(true);

  const key = news.map((n) => n.id).join(",");

  useEffect(() => {
    if (!key) return;
    try {
      setHidden(localStorage.getItem("capital-news-seen") === key);
    } catch {
      setHidden(false);
    }
  }, [key]);

  if (!key || hidden) return null;

  const t = (en: string, ru: string) => (lang === "ru" ? ru : en);

  // Больше трёх в строку не влезает, остальные считаем числом.
  const shown = news.slice(0, 3);
  const rest = news.length - shown.length;

  const close = () => {
    try {
      localStorage.setItem("capital-news-seen", key);
    } catch {
      // Приватный режим — полоса просто вернётся в следующий заход.
    }
    setHidden(true);
  };

  return (
    <aside className="cap-news-bar" aria-label={t("New arrivals", "Новинки")}>
      <span className="cap-news-flag">{t("New in", "Новинка")}</span>

      <span className="cap-news-items">
        {shown.map((n) => (
          <span key={`${n.kind}:${n.id}`} className="cap-news-chip">
            {n.logo && <img src={n.logo} alt="" loading="lazy" decoding="async" />}
            <span className="cap-news-chip-name">{n.name ?? n.brand}</span>
          </span>
        ))}
        {rest > 0 && <span className="cap-news-more">+{rest}</span>}
      </span>

      <Link href={`/${lang}/shop`} className="cap-news-link">
        {t("See what's new", "Посмотреть")}
        <span aria-hidden="true">→</span>
      </Link>

      <button
        type="button"
        className="cap-news-close"
        onClick={close}
        aria-label={t("Hide", "Скрыть")}
      >
        ✕
      </button>
    </aside>
  );
}
