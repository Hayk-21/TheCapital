"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useContent } from "@/components/editor/ContentProvider";
import type { NewsItem } from "@/lib/news";

/**
 * Полоса над шапкой: «привезли новое».
 *
 * Висит на всех страницах, потому что про новинку должен узнать и тот, кто
 * зашёл почитать про кальянную, а не в магазин. Гость может закрыть полосу —
 * запоминаем это до следующей новинки: ключ включает состав, поэтому новый
 * товар полосу вернёт, а уже закрытую не покажет повторно.
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
  const label = (n: NewsItem) => (n.name ? `${n.brand} · ${n.name}` : n.brand);

  const shown = news.slice(0, 2).map(label).join(", ");
  const rest = news.length - Math.min(2, news.length);

  const close = () => {
    try {
      localStorage.setItem("capital-news-seen", key);
    } catch {
      // Приватный режим — полоса просто вернётся в следующий заход.
    }
    setHidden(true);
  };

  return (
    <div className="cap-news-bar">
      <span className="cap-news-flag">{t("New", "Новинка")}</span>
      <span className="cap-news-text">
        {t("We got in", "У нас появились")}: {shown}
        {rest > 0 ? t(` and ${rest} more`, ` и ещё ${rest}`) : ""}
      </span>
      <Link href={`/${lang}/shop`} className="cap-news-link">
        {t("Take a look →", "Посмотреть →")}
      </Link>
      <button
        type="button"
        className="cap-news-close"
        onClick={close}
        aria-label={t("Hide", "Скрыть")}
      >
        ✕
      </button>
    </div>
  );
}
