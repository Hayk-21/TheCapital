"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/admin-actions";

const LINKS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/stats", label: "Статистика" },
  { href: "/admin/shop", label: "Магазин" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/bookings", label: "Заявки на бронь" },
  { href: "/admin/media", label: "Картинки" },
  { href: "/admin/settings", label: "Настройки" },
];

export function AdminNav({ name, role }: { name: string; role: string }) {
  const pathname = usePathname() ?? "";

  return (
    <aside className="adm-side">
      <div className="adm-brand">The Capital</div>

      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="adm-nav-link"
          data-active={
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href)
          }
        >
          {link.label}
        </Link>
      ))}

      <div style={{ height: 20 }} />
      <div className="adm-label" style={{ padding: "0 20px" }}>
        Сайт
      </div>
      <Link href="/en?edit=1" className="adm-nav-link" target="_blank">
        Открыть в режиме правки ↗
      </Link>
      <Link href="/en" className="adm-nav-link" target="_blank">
        Открыть сайт ↗
      </Link>

      <div style={{ marginTop: "auto", padding: "20px 20px 0", borderTop: "1px solid #241f1b" }}>
        <div style={{ fontSize: 13 }}>{name}</div>
        <div className="adm-hint" style={{ marginBottom: 10 }}>
          {role === "owner" ? "владелец" : role === "admin" ? "администратор" : "редактор"}
        </div>
        <form action={logoutAction}>
          <button type="submit" className="adm-btn" data-variant="ghost" style={{ width: "100%" }}>
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}
