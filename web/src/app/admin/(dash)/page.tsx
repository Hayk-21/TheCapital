import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Обзор — The Capital" };

const PAGES = [
  {
    title: "Главная",
    path: "",
    hint: "Первый экран, цифры, «о нас», карточки, отзывы, адрес",
  },
  { title: "Меню", path: "/menu", hint: "Кальяны, бар и кухня — категории и позиции" },
  {
    title: "Наши дистрибуции",
    path: "/shop",
    hint: "Магазин: бренды, вкусы, фасовки и цены",
  },
  { title: "Контакты", path: "/visit", hint: "Часы, адрес, форма брони, правила" },
];

export default async function AdminHome() {
  const [newBookings, totalBookings, menuItems, mediaCount] = await Promise.all([
    db.booking.count({ where: { status: "new" } }),
    db.booking.count(),
    db.menuItem.count(),
    db.media.count(),
  ]);

  return (
    <>
      <h1 className="adm-title">Обзор</h1>
      <p className="adm-sub">
        Тексты и картинки правятся прямо на сайте: откройте страницу в режиме правки
        и кликните по нужному месту.
      </p>

      <div className="adm-grid" style={{ marginBottom: 32 }}>
        <div className="adm-card">
          <span className="adm-label">Новые заявки</span>
          <div style={{ fontSize: 34, fontFamily: "var(--font-heading)", fontWeight: 800 }}>
            {newBookings}
          </div>
          <Link href="/admin/bookings" style={{ fontSize: 13 }}>
            Все заявки ({totalBookings}) →
          </Link>
        </div>

        <div className="adm-card">
          <span className="adm-label">Позиций в меню</span>
          <div style={{ fontSize: 34, fontFamily: "var(--font-heading)", fontWeight: 800 }}>
            {menuItems}
          </div>
          <Link href="/en/menu?edit=1" target="_blank" style={{ fontSize: 13 }}>
            Редактировать меню ↗
          </Link>
        </div>

        <div className="adm-card">
          <span className="adm-label">Загружено картинок</span>
          <div style={{ fontSize: 34, fontFamily: "var(--font-heading)", fontWeight: 800 }}>
            {mediaCount}
          </div>
          <Link href="/admin/media" style={{ fontSize: 13 }}>
            Библиотека →
          </Link>
        </div>
      </div>

      <h2 className="adm-title" style={{ fontSize: 20 }}>
        Страницы сайта
      </h2>
      <p className="adm-sub">Откройте нужный язык — правки сохраняются сразу.</p>

      <div className="adm-grid">
        {PAGES.map((page) => (
          <div key={page.path} className="adm-card">
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 18 }}>
              {page.title}
            </div>
            <div className="adm-hint">{page.hint}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Link
                href={`/ru${page.path}?edit=1`}
                target="_blank"
                className="adm-btn"
                style={{ textDecoration: "none" }}
              >
                Править RU ↗
              </Link>
              <Link
                href={`/en${page.path}?edit=1`}
                target="_blank"
                className="adm-btn"
                data-variant="ghost"
                style={{ textDecoration: "none" }}
              >
                Править EN ↗
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-card" style={{ marginTop: 32 }}>
        <span className="adm-label">Как это работает</span>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: "#b9b0a7" }}>
          <li>В режиме правки любой текст обведён пунктиром — кликните и печатайте.</li>
          <li>Enter или клик мимо — сохранить, Esc — отменить правку.</li>
          <li>
            На картинку наведите курсор и перетащите файл или нажмите, чтобы выбрать.
            Кнопка «кадр» двигает видимую часть фото.
          </li>
          <li>
            У списков (цифры, отзывы, позиции меню, дни недели) при наведении появляются
            стрелки порядка и крестик удаления, а внизу — кнопка добавления.
          </li>
          <li>Языки правятся отдельно: переключите EN/RU в шапке сайта.</li>
        </ul>
      </div>
    </>
  );
}
