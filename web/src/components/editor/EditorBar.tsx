"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useContent } from "./ContentProvider";

const STATUS_TEXT: Record<string, string> = {
  idle: "",
  saving: "сохраняю…",
  saved: "сохранено",
  error: "ошибка сохранения",
};

const STATUS_COLOR: Record<string, string> = {
  idle: "#7d746b",
  saving: "#f0b429",
  saved: "#5fbf6b",
  error: "#ec3013",
};

/**
 * Плавающая панель внизу экрана. Появляется только в режиме правки — на самом
 * сайте её нет, даже когда админ залогинен: обычный просмотр должен выглядеть
 * ровно так же, как у гостя. Включается режим из админки, кнопкой «Править».
 */
export function EditorBar() {
  const { canEdit, editing, saveState } = useContent();
  const pathname = usePathname() ?? "/";
  const params = useSearchParams();

  if (!canEdit || !editing) return null;

  const next = new URLSearchParams(params?.toString() ?? "");
  next.delete("edit");
  const query = next.toString();
  const exitHref = `${pathname}${query ? `?${query}` : ""}`;

  return (
    <div className="cap-editor-bar">
      <span style={{ color: "#ec3013" }}>Режим правки</span>

      <Link href={exitHref} scroll={false} style={{ textDecoration: "underline" }}>
        Выключить
      </Link>

      <span style={{ opacity: 0.35 }}>·</span>
      <Link href="/admin">Админка</Link>

      {saveState !== "idle" && (
        <span style={{ color: STATUS_COLOR[saveState], textTransform: "none", letterSpacing: 0 }}>
          {STATUS_TEXT[saveState]}
        </span>
      )}

      <span style={{ color: "#7d746b", textTransform: "none", letterSpacing: 0, fontSize: 11 }}>
        Клик по тексту — правка, Esc — отмена
      </span>
    </div>
  );
}
