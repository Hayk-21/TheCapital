"use client";

import { useState } from "react";
import Link from "next/link";
import { useContent } from "@/components/editor/ContentProvider";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "./CartProvider";
import { ClosedNotice } from "./ClosedNotice";
import { createOrder } from "@/lib/actions";
import { DELIVERY_FEE } from "@/lib/order";
import { formatHours } from "@/lib/hours";
import { useShopOpen } from "./useShopOpen";
import { formatPrice } from "@/lib/view";
import {
  FIELD_LABEL,
  GHOST_BTN,
  INPUT,
  PAGE,
  PAGE_KICKER,
  PAGE_TITLE,
  SECTION_TITLE,
} from "@/components/site/styles";

type Kind = "delivery" | "pickup";

export function OrderView() {
  const { lang, content } = useContent();
  const { lines, total, setQty, remove, clear, ready } = useCart();
  const { hours, open } = useShopOpen();

  const [kind, setKind] = useState<Kind>("delivery");
  const [sent, setSent] = useState<{ number: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const t = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const fee = kind === "delivery" ? DELIVERY_FEE : 0;

  async function submit(form: FormData) {
    if (!open) {
      setError(true);
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const order = await createOrder({
        kind,
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        address: String(form.get("address") ?? ""),
        comment: String(form.get("comment") ?? ""),
        lang,
        lines: lines.map((l) => ({ itemId: l.itemId, qty: l.qty, note: l.note })),
      });
      clear();
      setSent(order);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div style={PAGE}>
        <Header />
        <section className="cap-shop-head" style={{ paddingBottom: 88 }}>
          <span style={PAGE_KICKER}>{t("Order", "Заказ")}</span>
          <h1 style={PAGE_TITLE}>{t("Order accepted.", "Заказ принят.")}</h1>
          <p style={{ margin: 0, fontSize: 17, color: "#a89f96", maxWidth: "52ch", lineHeight: 1.6 }}>
            {t(
              "We will call you back to confirm the order and the delivery cost. Payment on receipt.",
              "Мы перезвоним, чтобы подтвердить заказ и стоимость доставки. Оплата при получении.",
            )}
          </p>
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22 }}>
            {formatPrice(sent.total, false, lang)}
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingTop: 8 }}>
            <Link href={`/${lang}/shop`} className="btn btn-primary">
              {t("Back to the shop", "Вернуться в магазин")}
            </Link>
            <a
              href={`tel:${content.settings.phoneHref ?? ""}`}
              className="btn cap-ghost-btn"
              style={GHOST_BTN}
            >
              {content.settings.phone ?? ""}
            </a>
          </div>
        </section>
        <Footer narrow />
      </div>
    );
  }

  return (
    <div style={PAGE}>
      <Header />

      <section className="cap-shop-head">
        <span style={PAGE_KICKER}>{t("Order", "Заказ")}</span>
        <h1 style={PAGE_TITLE}>{t("Your order", "Ваш заказ")}</h1>
      </section>

      <ClosedNotice />

      {ready && lines.length === 0 ? (
        <section className="cap-shop-section" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <p style={{ margin: 0, fontSize: 17, color: "#a89f96" }}>
            {t("Nothing here yet.", "Пока пусто.")}
          </p>
          <Link href={`/${lang}/shop`} className="btn btn-primary" style={{ alignSelf: "start" }}>
            {t("Open the shop", "Открыть магазин")}
          </Link>
        </section>
      ) : (
        <section className="cap-order-grid">
          {/* ── Позиции ─────────────────────────────────────── */}
          <div>
            <h2 style={{ ...SECTION_TITLE, fontSize: 24, margin: "0 0 24px" }}>
              {t("Items", "Позиции")}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {lines.map((line) => (
                <div
                  key={`${line.itemId}:${line.note ?? ""}`}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom: "1px solid #332c26",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16 }}>
                      {lang === "ru" ? line.titleRu : line.titleEn}
                    </span>
                    <span style={{ fontSize: 12, color: "#a89f96" }}>
                      {line.size}
                      {line.note ? ` · ${line.note}` : ""}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="cap-cart-btn"
                      data-quiet="true"
                      onClick={() => setQty(line.itemId, line.note, line.qty - 1)}
                      aria-label={t("One less", "На одну меньше")}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700 }}>
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      className="cap-cart-btn"
                      data-quiet="true"
                      onClick={() => setQty(line.itemId, line.note, line.qty + 1)}
                      aria-label={t("One more", "На одну больше")}
                    >
                      +
                    </button>
                  </div>

                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      minWidth: 92,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatPrice(line.price * line.qty, false, lang)}
                  </span>

                  <button
                    type="button"
                    className="cap-cart-btn"
                    data-quiet="true"
                    onClick={() => remove(line.itemId, line.note)}
                    aria-label={t("Remove", "Убрать")}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <Link
              href={`/${lang}/shop`}
              style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: "#a89f96" }}
            >
              {t("+ add more", "+ добавить ещё")}
            </Link>
          </div>

          {/* ── Оформление ──────────────────────────────────── */}
          <div>
            <h2 style={{ ...SECTION_TITLE, fontSize: 24, margin: "0 0 24px" }}>
              {t("Checkout", "Оформление")}
            </h2>

            <div style={{ display: "flex", gap: 0, border: "2px solid #4a4038", marginBottom: 24 }}>
              {(["delivery", "pickup"] as Kind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  style={{
                    font: "inherit",
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "11px 18px",
                    border: "none",
                    cursor: "pointer",
                    flex: 1,
                    background: kind === k ? "var(--color-accent)" : "transparent",
                    color: kind === k ? "#fff" : "#b9b0a7",
                  }}
                >
                  {k === "delivery" ? t("Delivery", "Доставка") : t("Pickup", "Навынос")}
                </button>
              ))}
            </div>

            <form action={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label={t("Name", "Имя")} name="name" required />
              <Field label={t("Phone", "Телефон")} name="phone" type="tel" required />

              {kind === "delivery" && (
                <Field
                  label={t("Delivery address", "Адрес доставки")}
                  name="address"
                  required
                  hint={t(
                    "Street, building, apartment. We will confirm the delivery cost by phone.",
                    "Улица, дом, квартира. Стоимость доставки подтвердим по телефону.",
                  )}
                />
              )}

              <Field label={t("Comment", "Комментарий")} name="comment" />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "18px 0",
                  borderTop: "1px solid #3b332c",
                  borderBottom: "1px solid #3b332c",
                  margin: "8px 0",
                }}
              >
                <Row label={t("Items", "Позиции")} value={formatPrice(total, false, lang)} />
                <Row
                  label={t("Delivery", "Доставка")}
                  value={
                    kind === "pickup"
                      ? t("pickup", "навынос")
                      : formatPrice(fee, false, lang)
                  }
                />
                <Row
                  label={t("Total", "Итого")}
                  value={formatPrice(total + fee, false, lang)}
                  strong
                />
              </div>

              <p style={{ margin: 0, fontSize: 12, color: "#8e857c", lineHeight: 1.5 }}>
                {t(
                  "The order goes to the kitchen right away — no time slot to pick. Payment on receipt.",
                  "Заказ уходит в работу сразу — время выбирать не нужно. Оплата при получении.",
                )}
              </p>

              <button type="submit" className="btn btn-primary" disabled={busy || !open}>
                {busy
                  ? t("Sending…", "Отправляю…")
                  : open
                    ? t("Place order", "Оформить заказ")
                    : t("Shop is closed", "Магазин закрыт")}
              </button>

              {error && (
                <p style={{ margin: 0, color: "var(--color-accent)", fontSize: 14 }}>
                  {open
                    ? t(
                        "Could not place the order. Please call us instead.",
                        "Не удалось оформить заказ. Позвоните нам, пожалуйста.",
                      )
                    : t(
                        `We take orders from ${formatHours(hours)}.`,
                        `Заказы принимаем с ${formatHours(hours)}.`,
                      )}
                </p>
              )}
            </form>
          </div>
        </section>
      )}

      <Footer narrow />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={FIELD_LABEL}>{label}</span>
      <input name={name} type={type} required={required} placeholder={placeholder} style={INPUT} />
      {hint && <span style={{ fontSize: 12, color: "#8e857c" }}>{hint}</span>}
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={{ fontSize: strong ? 15 : 14, color: strong ? "#f4f1ee" : "#a89f96" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: strong ? 19 : 15,
        }}
      >
        {value}
      </span>
    </div>
  );
}
