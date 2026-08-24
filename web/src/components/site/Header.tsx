"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContent } from "@/components/editor/ContentProvider";
import { Editable } from "@/components/editor/Editable";
import { SettingTxt } from "@/components/editor/fields";
import { Slot } from "@/components/editor/Slot";
import { addNavItem, deleteNavItem, moveNavItem, saveNavItem, saveSetting } from "@/lib/actions";
import { LANGS, type Lang } from "@/lib/content-schema";

const H = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 32,
    padding: "18px 40px",
    background: "#100d0b",
    color: "#f4f1ee",
    borderBottom: "2px solid #ec3013",
    flexWrap: "wrap" as const,
  },
  brand: { display: "flex", alignItems: "center", gap: 12, color: "#f4f1ee" },
  // Квадрат под знак: слот внутри позиционируется абсолютно, рамка нужна ему.
  logo: {
    position: "relative" as const,
    width: 40,
    height: 40,
    flexShrink: 0,
    border: "1px solid #3b332c",
  },
  brandText: { display: "flex", alignItems: "baseline", gap: 10 },
  brandName: {
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
  },
  brandCity: {
    fontSize: 11,
    letterSpacing: "0.24em",
    textTransform: "uppercase" as const,
    color: "var(--color-accent)",
  },
  nav: {
    display: "flex",
    gap: 28,
    marginLeft: "auto",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    alignItems: "center",
  },
  langBox: { display: "flex", gap: 0, border: "2px solid #4a4038" },
};

function langButton(active: boolean) {
  return {
    font: "inherit",
    fontSize: 11,
    letterSpacing: "0.16em",
    padding: "7px 12px",
    border: "none",
    cursor: "pointer",
    background: active ? "var(--color-accent)" : "transparent",
    color: active ? "#fff" : "#b9b0a7",
    textDecoration: "none",
    display: "inline-block",
  };
}

export function Header() {
  const { content, lang, editing, save } = useContent();
  const pathname = usePathname() ?? `/${lang}`;

  // Путь без языкового префикса — чтобы переключатель вёл на ту же страницу.
  const rest = pathname.replace(/^\/(en|ru)/, "") || "";

  const isActive = (href: string) => {
    const full = `/${lang}${href === "/" ? "" : href}`;
    return pathname === full || pathname === `${full}/`;
  };

  return (
    <header style={H.bar}>
      <Link href={`/${lang}`} style={H.brand}>
        {(content.logo?.src || editing) && (
          <span
            style={H.logo}
            onClick={(e) => {
              // В режиме правки клик по знаку открывает выбор файла, а не ссылку.
              if (editing) e.preventDefault();
            }}
          >
            <Slot image={content.logo ?? null} emptyLabel="Знак" />
          </span>
        )}
        <span style={H.brandText}>
          <SettingTxt k="brandName" style={H.brandName} />
          <SettingTxt k="brandCity" style={H.brandCity} />
        </span>
      </Link>

      <nav style={H.nav}>
        {content.nav.map((item) => {
          const href = item.external ? item.href : `/${lang}${item.href === "/" ? "" : item.href}`;
          const color = isActive(item.href) ? "var(--color-accent)" : "#f4f1ee";

          if (!editing) {
            return (
              <Link key={item.id} href={href} style={{ color }}>
                {item.label[lang] || item.label.en}
              </Link>
            );
          }

          return (
            <span
              key={item.id}
              className="cap-editable-block"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, paddingTop: 18 }}
            >
              <Editable
                value={item.label[lang] || ""}
                editing
                placeholder="пункт"
                style={{ color }}
                onSave={(next) =>
                  save(() =>
                    saveNavItem(item.id, lang === "ru" ? { labelRu: next } : { labelEn: next }),
                  )
                }
              />
              <Editable
                value={item.href}
                editing
                placeholder="/путь"
                style={{ color: "#7d746b", fontSize: 10, textTransform: "none" }}
                onSave={(next) => save(() => saveNavItem(item.id, { href: next }))}
              />
              <span className="cap-block-tools">
                <button
                  type="button"
                  className="cap-tool-btn"
                  title="Левее"
                  onClick={() => save(() => moveNavItem(item.id, "up"))}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="cap-tool-btn"
                  title="Правее"
                  onClick={() => save(() => moveNavItem(item.id, "down"))}
                >
                  →
                </button>
                <button
                  type="button"
                  className="cap-tool-btn"
                  data-danger="true"
                  title="Удалить пункт"
                  onClick={() => {
                    if (confirm("Удалить пункт меню?")) save(() => deleteNavItem(item.id));
                  }}
                >
                  ✕
                </button>
              </span>
            </span>
          );
        })}

        {editing && (
          <button
            type="button"
            className="cap-tool-btn"
            onClick={() => save(() => addNavItem())}
          >
            + пункт
          </button>
        )}
      </nav>

      <div style={H.langBox}>
        {LANGS.map((code: Lang) => (
          <Link
            key={code}
            href={`/${code}${rest}`}
            style={langButton(code === lang)}
            onClick={() => {
              document.cookie = `capital-lang=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
            }}
          >
            {code.toUpperCase()}
          </Link>
        ))}
      </div>

      <a
        href={`tel:${content.settings.phoneHref ?? ""}`}
        className="btn btn-primary"
        style={{ fontSize: 12, letterSpacing: "0.12em" }}
        onClick={(e) => {
          if (editing) e.preventDefault();
        }}
      >
        <Editable
          value={content.settings.phone ?? ""}
          editing={editing}
          placeholder="телефон"
          onSave={(next) => save(() => saveSetting("phone", next))}
        />
      </a>
    </header>
  );
}
