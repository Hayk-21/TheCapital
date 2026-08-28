"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/components/editor/ContentProvider";

/**
 * Подтверждение совершеннолетия на входе в магазин.
 *
 * Табак продаётся только взрослым, поэтому до ответа витрина закрыта
 * шторкой. Ответ храним в localStorage: регистрации на сайте нет, а
 * спрашивать при каждом переходе между страницами магазина — издевательство.
 *
 * Редактор сайта шторку не видит: она мешала бы править витрину.
 */

const STORAGE_KEY = "capital-age-18";

export function AgeGate({ children }: { children: ReactNode }) {
  const { lang, editing } = useContent();
  const router = useRouter();
  // null — ещё не читали хранилище; до этого шторку не показываем,
  // иначе она мигала бы у тех, кто уже подтвердил возраст.
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setConfirmed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // Приватный режим — спросим ещё раз в следующий заход.
      setConfirmed(false);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Не сохранилось — ничего, шторка просто вернётся в следующий раз.
    }
    setConfirmed(true);
  };

  const t = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const closed = confirmed === false && !editing;

  // Пока шторка на экране, страница под ней не должна прокручиваться.
  useEffect(() => {
    if (!closed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [closed]);

  return (
    <>
      {children}
      {closed && (
        <div className="cap-age" role="dialog" aria-modal="true" aria-labelledby="cap-age-title">
          <div className="cap-age-card">
            <span className="cap-age-kicker">18+</span>
            <h2 id="cap-age-title" className="cap-age-title">
              {t("Are you 18 or older?", "Вам есть 18 лет?")}
            </h2>
            <p className="cap-age-text">
              {t(
                "The shop sells tobacco products. Please confirm your age to continue.",
                "В магазине продаётся табачная продукция. Подтвердите возраст, чтобы продолжить.",
              )}
            </p>
            <div className="cap-age-actions">
              <button type="button" className="btn btn-primary" onClick={accept}>
                {t("Yes, I am 18+", "Да, мне есть 18")}
              </button>
              <button
                type="button"
                className="btn cap-age-no"
                onClick={() => router.push(`/${lang}`)}
              >
                {t("No", "Нет")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
