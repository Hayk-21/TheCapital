"use client";

import { useContent } from "@/components/editor/ContentProvider";
import { Editable } from "@/components/editor/Editable";
import { SettingTxt, Txt } from "@/components/editor/fields";
import { saveSetting } from "@/lib/actions";

/** Та же колонка, что у .cap-shop-section в globals.css. */
const NARROW = {
  width: "100%",
  maxWidth: 1180,
  marginInline: "auto",
  paddingInline: 32,
} as const;

const F = {
  bar: {
    padding: "48px 40px",
    display: "flex",
    gap: 40,
    flexWrap: "wrap" as const,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  name: {
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
  },
  links: {
    display: "flex",
    gap: 20,
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
  },
};

const SOCIALS: Array<{ key: string; label: string }> = [
  { key: "instagram", label: "Instagram" },
  { key: "telegram", label: "Telegram" },
  { key: "whatsapp", label: "WhatsApp" },
];

/**
 * @param narrow — выровнять содержимое по той же колонке, что и контент
 *   страницы. Нужно в магазине и корзине: там всё собрано по центру, и
 *   подвал во всю ширину выбивается из страницы.
 */
export function Footer({ narrow = false }: { narrow?: boolean } = {}) {
  const { content, editing, save } = useContent();

  return (
    <footer style={narrow ? { ...F.bar, ...NARROW } : F.bar}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SettingTxt k="brandName" style={F.name} />
        <Txt k="addressShort" scope="common" style={{ fontSize: 13, color: "#a89f96" }} />
        <a
          href={`tel:${content.settings.phoneHref ?? ""}`}
          style={{ fontSize: 13 }}
          onClick={(e) => editing && e.preventDefault()}
        >
          <SettingTxt k="phone" />
        </a>
      </div>

      <div style={F.links}>
        {SOCIALS.filter((s) => editing || content.settings[s.key]).map((social) => (
          <a
            key={social.key}
            href={content.settings[social.key] || "#"}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => editing && e.preventDefault()}
          >
            {social.label}
            {editing && (
              <Editable
                value={content.settings[social.key] ?? ""}
                editing
                placeholder="ссылка"
                style={{
                  display: "block",
                  fontSize: 10,
                  textTransform: "none",
                  letterSpacing: 0,
                  color: "#7d746b",
                  marginTop: 4,
                }}
                onSave={(next) => save(() => saveSetting(social.key, next))}
              />
            )}
          </a>
        ))}
      </div>
    </footer>
  );
}
